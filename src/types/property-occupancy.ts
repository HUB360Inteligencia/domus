
export type OccupancyType = 'rented' | 'airbnb' | 'vacant' | 'maintenance' | 'owner_occupied';

export interface PropertyOccupancyPeriod {
  id: string;
  property_id: string;
  user_id: string;
  occupancy_type: OccupancyType;
  start_date: string;
  end_date?: string | null;
  tenant_name?: string | null;
  notes?: string | null;
  contract_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyOccupancyFormData {
  property_id: string;
  occupancy_type: OccupancyType;
  start_date: string;
  end_date?: string | null;
  tenant_name?: string | null;
  notes?: string | null;
  contract_id?: string | null;
}
