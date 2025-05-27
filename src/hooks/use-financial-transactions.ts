
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialTransaction {
  id: string;
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

  // Fetch all transactions with category and property names
  const { data: rawTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          properties:property_id (id, title),
          financial_categories!inner(id, name)
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
        toast.error('Falha ao buscar transações');
        return [];
      }

      return data || [];
    }
  });

  // Transform raw transactions to ensure they match the FinancialTransaction type
  const transactions: FinancialTransaction[] = rawTransactions.map(tx => ({
    ...tx,
    // Ensure transaction_type is properly typed
    transaction_type: tx.transaction_type === 'income' ? 'income' : 'expense',
    // Get category name from joined table
    category: tx.financial_categories?.name || tx.category,
    category_name: tx.financial_categories?.name,
    // Ensure property_title is properly set if properties data exists
    property_title: tx.properties?.title || undefined,
    // Ensure numbers are properly typed
    amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
  }));

  // Upload receipt and get URL
  const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.data.user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('transaction_receipts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading receipt:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('transaction_receipts')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Receipt upload error:', error);
      return null;
    }
  };

  // Create transaction
  const { mutateAsync: createTransaction, isPending: isCreating } = useMutation({
    mutationFn: async (transaction: TransactionFormData) => {
      // Handle receipt upload if a file is provided
      let receipt_url = transaction.receipt_url;

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert([{
          ...transaction,
          receipt_url,
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
      toast.success('Transação criada com sucesso');
    },
    onError: (error) => {
      console.error('Failed to create transaction:', error);
      toast.error('Falha ao criar transação');
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
      toast.success('Transação atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Failed to update transaction:', error);
      toast.error('Falha ao atualizar transação');
    }
  });

  // Delete transaction
  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      // Get the transaction first to check if it has a receipt
      const { data: transaction, error: getError } = await supabase
        .from('financial_transactions')
        .select('receipt_url')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error('Error getting transaction before delete:', getError);
      }
      
      // If there's a receipt, delete it from storage
      if (transaction?.receipt_url) {
        const receiptPath = transaction.receipt_url.split('/').pop();
        if (receiptPath) {
          const { error: storageError } = await supabase.storage
            .from('transaction_receipts')
            .remove([receiptPath]);
            
          if (storageError) {
            console.error('Error deleting receipt from storage:', storageError);
          }
        }
      }

      // Delete the transaction from the database
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
      toast.success('Transação excluída com sucesso');
    },
    onError: (error) => {
      console.error('Failed to delete transaction:', error);
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
    uploadReceipt,
    isCreating,
    isUpdating,
    isDeleting,
    filters,
    handleFilterChange
  };
};
