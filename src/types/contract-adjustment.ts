
export interface ContractValueAdjustment {
  id: string;
  contract_id: string;
  old_value: number;
  new_value: number;
  adjustment_date: string;
  adjustment_reason?: string | null;
  adjustment_percentage?: number | null;
  applied_index?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ContractAdjustmentFormData {
  contract_id: string;
  old_value: number;
  new_value?: number;
  adjustment_percentage?: number;
  adjustment_date: string;
  adjustment_reason?: string;
  applied_index?: string;
}
