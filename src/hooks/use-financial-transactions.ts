import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { logger } from "@/lib/logger";
export interface FinancialTransaction {
  id: string;
  name: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  category_name?: string;
  subcategory?: string | null;
  description?: string | null;
  transaction_date: string;
  property_id?: string | null;
  property_title?: string;
  payment_method?: string | null;
  recurring?: boolean;
  recurring_frequency?: string | null;
  recurring_end_date?: string | null;
  receipt_url?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  name: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  subcategory?: string | null;
  description?: string | null;
  transaction_date: string;
  payment_method?: string | null;
  recurring?: boolean;
  recurring_frequency?: string | null;
  recurring_end_date?: string | null;
  property_id?: string | null;
  receipt_url?: string | null;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: string[];
  category?: string[];
  propertyId?: string;
  minAmount?: number;
  maxAmount?: number;
}

const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user.id;
};

export const useFinancialTransactions = (initialFilters: TransactionFilters = {}) => {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Fetch all transactions with category and property names
  const { data: rawTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          properties:property_id (id, title),
          financial_categories:category (id, name)
        `);

      // Apply filters
      if (filters.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      
      if (filters.type && filters.type.length > 0) {
        query = query.in('transaction_type', filters.type);
      }
      
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }
      
      if (filters.propertyId) {
        query = query.eq('property_id', filters.propertyId);
      }
      
      if (filters.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
      }
      
      if (filters.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
      }
      
      // Order by transaction date (newest first)
      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching financial transactions:', error);
        toast.error('Falha ao buscar transações');
        return [];
      }

      // Incluir todas as transações - removido o filtro que excluía rental-management
      return data || [];
    }
  });

  // Transform raw transactions to ensure they match the FinancialTransaction type
  const transactions: FinancialTransaction[] = rawTransactions.map(tx => ({
    ...tx,
    // Ensure transaction_type is properly typed
    transaction_type: tx.transaction_type === 'income' ? 'income' : 'expense',
    // Use category as is since it's now a UUID reference
    category: tx.category,
    // Add category name from the join
    category_name: tx.financial_categories?.name || 'Categoria não encontrada',
    // Ensure property_title is properly set if properties data exists
    property_title: tx.properties?.title || undefined,
    // Ensure numbers are properly typed
    amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
    // Ensure name exists
    name: tx.name || tx.description || 'Transação sem nome',
  }));

  // Create transaction
  const { mutateAsync: createTransaction, isPending: isCreating } = useMutation({
    mutationFn: async (transaction: TransactionFormData) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          ...transaction,
          user_id: userId
        }])
        .select();

      if (error) {
        logger.error('Error creating transaction:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transação criada com sucesso');
    },
    onError: (error) => {
      logger.error('Failed to create transaction:', error);
      toast.error('Falha ao criar transação');
    }
  });

  // Update transaction
  const { mutateAsync: updateTransaction, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...transaction }: TransactionFormData & { id: string }) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(transaction)
        .eq('id', id)
        .eq('user_id', userId)
        .select();

      if (error) {
        logger.error('Error updating transaction:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transação atualizada com sucesso');
    },
    onError: (error) => {
      logger.error('Failed to update transaction:', error);
      toast.error('Falha ao atualizar transação');
    }
  });

  // Delete transaction
  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCurrentUserId();
      // Get the transaction first to check if it has a receipt
      const { data: transaction, error: getError } = await supabase
        .from('financial_transactions')
        .select('receipt_url')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (getError) {
        logger.error('Error getting transaction before delete:', getError);
      }
      
      // If there's a receipt, delete it from storage
      if (transaction?.receipt_url) {
        const receiptPath = transaction.receipt_url.split('/').pop();
        if (receiptPath) {
          const { error: storageError } = await supabase.storage
            .from('transaction_receipts')
            .remove([receiptPath]);
            
          if (storageError) {
            logger.error('Error deleting receipt from storage:', storageError);
          }
        }
      }

      // Delete the transaction from the database
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting transaction:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transação excluída com sucesso');
    },
    onError: (error) => {
      logger.error('Failed to delete transaction:', error);
      toast.error('Falha ao excluir transação');
    }
  });

  // Function to handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    transactions,
    isLoadingTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
    filters,
    handleFilterChange
  };
};
