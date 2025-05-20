
import { Json } from '@/integrations/supabase/types';

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
  type: PropertyType | string; // Allow both PropertyType and string for flexibility
  status: PropertyStatus;
  value: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: Json | Record<string, any>; // Accept both Json type from Supabase and Record type
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
}
