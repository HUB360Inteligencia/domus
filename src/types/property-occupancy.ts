
// Define the occupancy types as an enum
export enum OccupancyType {
  RENTED = 'rented',
  AIRBNB = 'airbnb',
  OWNER_OCCUPIED = 'owner_occupied', 
  VACANT = 'vacant'
}

// Create interface for property occupancy data
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

// Create interface for property occupancy form data
export interface PropertyOccupancyFormData {
  property_id: string;
  start_date: string;
  end_date?: string;
  occupancy_type: OccupancyType;
  tenant_name?: string;
  contract_id?: string;
  notes?: string;
}
