export type ContractStatus = 'active' | 'pending' | 'expired' | 'canceled' | 'draft';
export type SignatureStatus = 'unsigned' | 'pending' | 'completed' | 'rejected';

export interface VariableRentValue {
  month: number;
  year: number;
  value: number;
  applyUntilEnd?: boolean;
}

export interface Contract {
  id: string;
  title: string;
  property_id: string | null;
  property?: { // Added optional property field for join data
    title?: string;
    address?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    type?: string;
    tags?: string[];
  };
  tenant_name: string;
  tenant_document: string | null;
  tenant_contact: string | null;
  start_date: string;
  end_date: string;
  value: number;
  payment_day: number;
  deposit_value: number | null;
  status: ContractStatus;
  terms: string | null;
  document_url: string | null;
  has_renewal_option: boolean | null;
  renewal_terms: string | null;
  special_conditions: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  signature_status: SignatureStatus;
  
  // Novos campos
  has_variable_rent: boolean | null;
  variable_rent_values: VariableRentValue[] | null;
  payment_due_day: number | null;
  on_time_discount_percentage: number | null;
  late_fee_percentage: number | null;
  is_discount_not_fee: boolean | null;
  late_interest_percentage: number | null;
  late_daily_interest: number | null;
  fine_percentage: number | null;
  payment_terms: string | null;
}

export interface ContractFormData {
  title: string;
  property_id?: string | null;
  tenant_name: string;
  tenant_document?: string | null;
  tenant_contact?: string | null;
  start_date: string;
  end_date: string;
  value: number;
  payment_day: number;
  deposit_value?: number | null;
  status: ContractStatus;
  terms?: string | null;
  has_renewal_option?: boolean;
  renewal_terms?: string | null;
  special_conditions?: string | null;
  
  // Novos campos
  has_variable_rent?: boolean;
  variable_rent_values?: VariableRentValue[];
  payment_due_day?: number;
  on_time_discount_percentage?: number;
  late_fee_percentage?: number;
  is_discount_not_fee?: boolean;
  late_interest_percentage?: number;
  late_daily_interest?: number;
  fine_percentage?: number;
  payment_terms?: string;
}

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_encrypted: boolean | null;
  category: string;
  contract_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DocumentFormData {
  name: string;
  file: File;
  category: string;
  contract_id?: string | null;
  is_encrypted?: boolean;
}

export interface ContractTemplate {
  id: string;
  title: string;
  content: string;
  is_default: boolean | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Clause {
  id: string;
  name: string;
  content: string;
  category: string;
  is_standard: boolean | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_to: string | null;
  related_id: string | null;
  is_read: boolean | null;
  created_at: string;
}
