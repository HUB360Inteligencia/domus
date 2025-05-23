
export type OccupancyType = 'rented' | 'airbnb' | 'owner_occupied' | 'vacant';

export interface PropertyOccupancy {
  id: string;
  property_id: string;
  start_date: string;
  end_date?: string;
  occupancy_type: OccupancyType;
  tenant_name?: string;
  contract_id?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyOccupancyFormData {
  property_id: string;
  start_date: string;
  end_date?: string;
  occupancy_type: OccupancyType;
  tenant_name?: string;
  contract_id?: string;
  notes?: string;
}
