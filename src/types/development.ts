
export interface Development {
  id: string;
  user_id: string;
  name: string;
  type: 'residential_building' | 'commercial_building' | 'horizontal_condominium' | 'subdivision';
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  total_land_area?: number;
  planned_built_area?: number;
  total_units?: number;
  planned_start_date?: string;
  planned_end_date?: string;
  current_phase: 'planning' | 'land' | 'project' | 'construction' | 'sales' | 'completed';
  description?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentPhase {
  id: string;
  development_id: string;
  phase_name: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  progress_percentage: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentUnit {
  id: string;
  development_id: string;
  unit_number: string;
  unit_type: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  garage_spots?: number;
  floor_number?: number;
  planned_price?: number;
  actual_price?: number;
  sale_date?: string;
  buyer_name?: string;
  buyer_contact?: string;
  status: 'available' | 'reserved' | 'sold' | 'not_for_sale';
  created_at: string;
  updated_at: string;
}

export interface DevelopmentCost {
  id: string;
  development_id: string;
  category: string;
  subcategory?: string;
  description: string;
  planned_amount: number;
  actual_amount: number;
  payment_date?: string;
  supplier_name?: string;
  phase_id?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentRevenue {
  id: string;
  development_id: string;
  unit_id?: string;
  revenue_type: 'unit_sale' | 'rental' | 'other';
  amount: number;
  received_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentDocument {
  id: string;
  development_id: string;
  document_type: string;
  name: string;
  file_url?: string;
  upload_date: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'pending';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentMilestone {
  id: string;
  development_id: string;
  phase_id?: string;
  title: string;
  description?: string;
  planned_date: string;
  actual_date?: string;
  is_critical: boolean;
  status: 'pending' | 'completed' | 'delayed';
  created_at: string;
  updated_at: string;
}

export interface DevelopmentChecklistItem {
  id: string;
  development_id: string;
  title: string;
  description?: string;
  category: string;
  is_completed: boolean;
  completed_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentFormData {
  name: string;
  type: Development['type'];
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  total_land_area?: number;
  planned_built_area?: number;
  total_units?: number;
  planned_start_date?: string;
  planned_end_date?: string;
  current_phase: Development['current_phase'];
  description?: string;
}

export interface DevelopmentKPIs {
  totalInvestment: number;
  projectedRevenue: number;
  roi: number;
  completionPercentage: number;
  unitsAvailable: number;
  unitsSold: number;
  totalUnits: number;
  avgPricePerUnit: number;
}
