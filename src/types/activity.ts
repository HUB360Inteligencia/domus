
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';

export type ActivityPriority = 'high' | 'medium' | 'low';

export type ActivityType = 'maintenance' | 'contract' | 'payment' | 'visit' | 'documentation' | 'other';

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  activity_type: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  
  // Relacionamentos
  property_id: string | null;
  contract_id: string | null;
  expense_id: string | null;
  user_id: string;
  
  // Responsável
  responsible_name: string | null;
  responsible_contact: string | null;
  responsible_notes: string | null;
  
  // Metadados
  estimated_cost: number | null;
  actual_cost: number | null;
  files: any | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

export interface ActivityFormData {
  title: string;
  description?: string;
  activity_type: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  due_date?: string | null;
  start_date?: string | null;
  property_id?: string | null;
  contract_id?: string | null;
  responsible_name?: string | null;
  responsible_contact?: string | null;
  responsible_notes?: string | null;
  estimated_cost?: number | null;
  categories?: string[];
}
