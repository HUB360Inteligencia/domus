
import { supabase } from "@/integrations/supabase/client";
import { PropertyExpense, PropertyExpenseFormData } from "@/types/property-expense";

/**
 * Fetches all expenses for a specific property
 */
export const fetchPropertyExpenses = async (propertyId: string): Promise<PropertyExpense[]> => {
  try {
    console.log(`Fetching expenses for property ID: ${propertyId}`);
    const { data, error } = await supabase
      .from('property_expenses')
      .select('*')
      .eq('property_id', propertyId)
      .order('paid_at', { ascending: false });

    if (error) {
      console.error('Error fetching property expenses:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch property expenses:', err);
    throw err;
  }
};

/**
 * Creates a new property expense
 */
export const createPropertyExpense = async (expenseData: PropertyExpenseFormData): Promise<PropertyExpense> => {
  try {
    console.log('Creating property expense:', expenseData);
    const { data, error } = await supabase
      .from('property_expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) {
      console.error('Error creating property expense:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Failed to create property expense:', err);
    throw err;
  }
};

/**
 * Updates an existing property expense
 */
export const updatePropertyExpense = async (
  id: string,
  expenseData: Partial<PropertyExpenseFormData>
): Promise<PropertyExpense> => {
  try {
    console.log(`Updating property expense ${id}:`, expenseData);
    const { data, error } = await supabase
      .from('property_expenses')
      .update(expenseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property expense:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Failed to update property expense:', err);
    throw err;
  }
};

/**
 * Deletes a property expense
 */
export const deletePropertyExpense = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting property expense ${id}`);
    const { error } = await supabase
      .from('property_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property expense:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to delete property expense:', err);
    throw err;
  }
};

/**
 * Uploads a receipt for a property expense
 */
export const uploadExpenseReceipt = async ({ 
  fileObject, 
  expenseId 
}: { 
  fileObject: File; 
  expenseId: string 
}): Promise<string> => {
  try {
    const fileExt = fileObject.name.split('.').pop();
    const fileName = `${expenseId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName;

    console.log(`Uploading receipt for expense ${expenseId} to expense_receipts bucket`);

    const { error: uploadError } = await supabase
      .storage
      .from('expense_receipts')
      .upload(filePath, fileObject);

    if (uploadError) {
      console.error('Error uploading receipt:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase
      .storage
      .from('expense_receipts')
      .getPublicUrl(filePath);

    // Update the expense record with the receipt URL
    const { error: updateError } = await supabase
      .from('property_expenses')
      .update({ receipt_url: urlData.publicUrl })
      .eq('id', expenseId);

    if (updateError) {
      console.error('Error updating expense with receipt URL:', updateError);
      throw updateError;
    }

    return urlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload expense receipt:', err);
    throw err;
  }
};

/**
 * Calculate expense analytics for a property
 */
export const calculateExpenseAnalytics = (expenses: PropertyExpense[]) => {
  if (!expenses || expenses.length === 0) {
    return {
      totalExpenses: 0,
      lastMonthExpenses: 0,
      monthlyAverage: 0,
      expensesByType: {},
      expensesByMonth: []
    };
  }

  // Get current date and calculate dates for analytics
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Filter expenses from the last 12 months
  const last12MonthsExpenses = expenses.filter(expense => 
    new Date(expense.paid_at) >= oneYearAgo
  );

  // Calculate total expenses for the last 12 months
  const totalExpenses = last12MonthsExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount), 
    0
  );
  
  // Calculate expenses for the last month
  const lastMonthExpenses = expenses.filter(expense => {
    const paidAt = new Date(expense.paid_at);
    return paidAt >= lastMonthStart && paidAt <= lastMonthEnd;
  }).reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  // Calculate monthly average
  const monthlyAverage = last12MonthsExpenses.length > 0 ? 
    totalExpenses / 12 : 0;
  
  // Calculate expenses by type
  const expensesByType = last12MonthsExpenses.reduce((acc, expense) => {
    const type = expense.expense_type;
    acc[type] = (acc[type] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate expenses by month for the last 12 months
  const expensesByMonth = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date();
    monthDate.setMonth(now.getMonth() - i);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const monthName = monthStart.toLocaleString('default', { month: 'short' });
    const year = monthStart.getFullYear();
    
    const monthExpenses = expenses.filter(expense => {
      const paidAt = new Date(expense.paid_at);
      return paidAt >= monthStart && paidAt <= monthEnd;
    });
    
    const total = monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount), 
      0
    );
    
    expensesByMonth.push({
      month: `${monthName}/${year}`,
      total
    });
  }
  
  // Reverse to get chronological order
  expensesByMonth.reverse();
  
  return {
    totalExpenses,
    lastMonthExpenses,
    monthlyAverage,
    expensesByType,
    expensesByMonth
  };
};
