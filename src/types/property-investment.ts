
export type InvestmentType = 'purchase' | 'improvement' | 'renovation' | 'maintenance' | 'other';

export interface PropertyInvestment {
  id: string;
  property_id: string;
  user_id: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string;
  description?: string;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyInvestmentFormData {
  property_id: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string;
  description?: string;
  receipt_url?: string | null;
}
