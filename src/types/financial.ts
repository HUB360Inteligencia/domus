
export type TransactionType = 'income' | 'expense';

export type RecurringFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface FinancialCategory {
  id: string;
  name: string;
  type: TransactionType;
  is_default: boolean;
  user_id?: string | null;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  property_id: string | null;
  transaction_type: TransactionType;
  category: string;
  subcategory?: string | null;
  amount: number;
  transaction_date: string;
  description?: string | null;
  recurring: boolean;
  recurring_frequency?: RecurringFrequency | null;
  recurring_end_date?: string | null;
  payment_method?: string | null;
  receipt_url?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransactionFormData {
  property_id: string | null;
  transaction_type: TransactionType;
  category: string;
  subcategory?: string | null;
  amount: number;
  transaction_date: string;
  description?: string | null;
  recurring: boolean;
  recurring_frequency?: RecurringFrequency | null;
  recurring_end_date?: string | null;
  payment_method?: string | null;
  receipt_url?: string | null;
}

export interface FinancialAnalytics {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  roi: number;
  monthlyROI: number;
  annualROI: number;
  propertyValues: {
    totalValue: number;
    byProperty: Record<string, number>;
  };
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  monthlyData: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  propertiesROI: Array<{
    propertyId: string;
    propertyTitle: string;
    roi: number;
    monthlyROI: number;
    annualROI: number;
  }>;
}

export interface FinancialReportFilters {
  startDate?: string;
  endDate?: string;
  propertyIds?: string[];
  transactionTypes?: TransactionType[];
  categories?: string[];
}
