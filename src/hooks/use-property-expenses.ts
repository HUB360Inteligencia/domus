
import { useState } from 'react';
import { usePropertyExpenseQueries } from './use-property-expense-queries';
import { usePropertyExpenseMutations } from './use-property-expense-mutations';
import { PropertyExpenseFormData } from '@/types/property-expense';

export const usePropertyExpenses = (propertyId: string | null) => {
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const {
    expenses,
    analytics,
    isLoadingExpenses,
    refetchExpenses,
  } = usePropertyExpenseQueries(propertyId);

  const {
    createExpense,
    updateExpense,
    deleteExpense,
    uploadReceipt,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading
  } = usePropertyExpenseMutations(propertyId || '');

  // Find the currently selected expense
  const selectedExpense = selectedExpenseId 
    ? expenses.find(expense => expense.id === selectedExpenseId) || null
    : null;

  const handleCreateExpense = (data: PropertyExpenseFormData) => {
    if (propertyId) {
      createExpense({ ...data, property_id: propertyId });
    }
  };

  const handleUpdateExpense = (id: string, data: Partial<PropertyExpenseFormData>) => {
    updateExpense({ id, data });
  };
  
  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
  };

  return {
    // Data
    expenses,
    selectedExpense,
    analytics,
    
    // State
    selectedExpenseId,
    setSelectedExpenseId,
    
    // Loading states
    isLoadingExpenses,
    isCreating,
    isUpdating,
    isDeleting,
    isUploading,
    
    // Actions
    createExpense: handleCreateExpense,
    updateExpense: handleUpdateExpense,
    deleteExpense: handleDeleteExpense,
    uploadReceipt,
    refetchExpenses
  };
};
