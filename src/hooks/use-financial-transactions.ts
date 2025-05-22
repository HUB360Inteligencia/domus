
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialTransaction {
  id: string;
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
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
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

export const useFinancialTransactions = (initialFilters: TransactionFilters = {}) => {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const queryClient = useQueryClient();

  // Fetch all transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          properties:property_id (id, title)
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
        console.error('Error fetching financial transactions:', error);
        toast.error('Failed to fetch transactions');
        return [];
      }

      return data.map(tx => ({
        ...tx,
        property_title: tx.properties?.title
      }));
    }
  });

  // Create transaction
  const { mutateAsync: createTransaction, isPending: isCreating } = useMutation({
    mutationFn: async (transaction: TransactionFormData) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          ...transaction,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select();

      if (error) {
        console.error('Error creating transaction:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transaction created successfully');
    },
    onError: (error) => {
      console.error('Failed to create transaction:', error);
      toast.error('Failed to create transaction');
    }
  });

  // Update transaction
  const { mutateAsync: updateTransaction, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...transaction }: TransactionFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(transaction)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating transaction:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transaction updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update transaction:', error);
      toast.error('Failed to update transaction');
    }
  });

  // Delete transaction
  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Transaction deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete transaction:', error);
      toast.error('Failed to delete transaction');
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
