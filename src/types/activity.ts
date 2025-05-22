
import { Json } from '@/integrations/supabase/types';

export type ActivityPriority = 'low' | 'medium' | 'high';
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ActivityType = 'maintenance' | 'inspection' | 'legal' | 'financial' | 'other';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  activity_type: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  start_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  responsible_name?: string | null;
  responsible_contact?: string | null;
  responsible_notes?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  files?: Json | Record<string, any> | null;
  created_at: string;
  updated_at: string;
  property_id?: string | null;
  contract_id?: string | null;
  expense_id?: string | null;
  user_id: string;
}

export interface ActivityFormData {
  title: string;
  description?: string;
  activity_type: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  start_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  responsible_name?: string | null;
  responsible_contact?: string | null;
  responsible_notes?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  files?: Record<string, any> | null;
  property_id?: string | null;
  contract_id?: string | null;
}

export interface BoardColumn {
  id: ActivityStatus;
  title: string;
  activities: Activity[];
}

export interface ActivityBoardProps {
  columns: BoardColumn[];
  isLoading?: boolean;
  onAdd?: () => void;
  onStatusChange?: (id: string, newStatus: ActivityStatus) => void;
  onSelect?: (id: string) => void;
}

export interface ActivityCardProps {
  activity: Activity;
  onSelect?: (id: string) => void;
}

export interface ActivityFormProps {
  initialData?: ActivityFormData;
  onSubmit: (data: ActivityFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export interface ActivityFiltersProps {
  onFilterChange: (filters: ActivityFilters) => void;
  propertyOptions?: { label: string; value: string }[];
  contractOptions?: { label: string; value: string }[];
}

export interface ActivityFilters {
  status?: ActivityStatus[];
  priority?: ActivityPriority[];
  type?: ActivityType[];
  propertyId?: string;
  contractId?: string;
  dueDateRange?: { from: Date | null; to: Date | null };
}

export interface ActivityCalendarProps {
  activities: Activity[];
  isLoading?: boolean;
  onSelect?: (id: string) => void;
  onDateSelect?: (date: Date) => void;
}
