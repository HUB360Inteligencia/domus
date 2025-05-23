
export type InvestmentType = 'purchase' | 'renovation' | 'furniture' | 'taxes' | 'maintenance' | 'other';

export interface PropertyInvestment {
  id: string;
  property_id: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string;
  description?: string;
  receipt_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyInvestmentFormData {
  property_id: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string;
  description?: string;
}
