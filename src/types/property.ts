
export type PropertyStatus = 'available' | 'rented' | 'airbnb' | 'maintenance' | 'sold';

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'rural';

export interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  type: string;
  status: PropertyStatus;
  value: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: Record<string, any>;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  type: string;
  status: PropertyStatus;
  value: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: Record<string, any>;
}
