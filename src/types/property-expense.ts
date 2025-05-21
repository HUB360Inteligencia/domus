
export type ExpenseType = 'maintenance' | 'condo_fee' | 'tax' | 'inspection' | 'renovation' | 'insurance' | 'other';

export interface PropertyExpense {
  id: string;
  property_id: string;
  expense_type: ExpenseType | string;
  amount: number;
  paid_at: string;
  description?: string;
  receipt_url?: string;
  maintenance_details?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyExpenseFormData {
  property_id: string;
  expense_type: ExpenseType | string;
  amount: number;
  paid_at: string;
  description?: string;
  maintenance_details?: string;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  lastMonthExpenses: number;
  monthlyAverage: number;
  expensesByType: Record<string, number>;
  expensesByMonth: {
    month: string;
    total: number;
  }[];
}
