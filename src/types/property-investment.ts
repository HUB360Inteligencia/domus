
// Define the investment types as an enum
export enum InvestmentType {
  PURCHASE = 'purchase',
  RENOVATION = 'renovation',
  FURNITURE = 'furniture',
  TAXES = 'taxes',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  OTHER = 'other'
}

// Create interface for property investment data
export interface PropertyInvestment {
  id: string;
  property_id: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string;
  description: string;
  receipt_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Create interface for property investment form data
export interface PropertyInvestmentFormData {
  property_id: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string;
  description?: string;
  receipt_url?: string;
}
