
import { Json } from '@/integrations/supabase/types';

export type PropertyStatus = 'available' | 'rented' | 'airbnb' | 'maintenance' | 'sold';

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'rural';

export type FurnishedStatus = 'not_furnished' | 'partially_furnished' | 'fully_furnished';

export interface Partner {
  id: string;
  name: string;
  percentage: number;
}

export interface PropertyDocument {
  id: string;
  type: string;
  name: string;
  date: string;
  file?: File;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  property_number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip_code?: string;
  type: PropertyType | string;
  status: PropertyStatus;
  value: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  garage_spots?: number;
  condo_fee?: number;
  floor_number?: number;
  furnished?: FurnishedStatus;
  features?: Json | Record<string, any>;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  purchase_date?: string | null;
  purchase_value?: number | null;
  tenant_name?: string | null;
  tenant_contact?: string | null;
  agency_name?: string | null;
  agency_responsible?: string | null;
  agency_contact?: string | null;
  square_meter_value?: number | null;
  tags?: string[] | null;
  last_valuation_date?: string | null;
  total_investment?: number | null;
  monthly_return_rate?: number | null;
  annual_return_rate?: number | null;
  vacancy_rate?: number | null;
  // Removi os campos que não existem no banco: has_partners, partners, owner_percentage, documents
}

export interface PropertyFormData {
  title: string;
  description: string;
  address: string;
  property_number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip_code?: string;
  type: string;
  status: PropertyStatus;
  value: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  garage_spots?: number;
  condo_fee?: number;
  floor_number?: number;
  furnished?: FurnishedStatus;
  features?: Record<string, any>;
  latitude?: number | null;
  longitude?: number | null;
  purchase_date?: string | null;
  purchase_value?: number | null;
  tenant_name?: string | null;
  tenant_contact?: string | null;
  agency_name?: string | null;
  agency_responsible?: string | null;
  agency_contact?: string | null;
  square_meter_value?: number | null;
  tags?: string[] | null;
  // Removi os campos que não existem no banco: has_partners, partners, owner_percentage, documents
}

export interface PropertyValuation {
  id: string;
  property_id: string;
  valuation_date: string;
  value: number;
  notes?: string;
  created_at: string;
  user_id: string;
}

export interface PropertyFinancialData {
  marketValue: number;
  totalInvestment: number;
  monthlyNetReturn: number;
  monthlyNetIncome: number;
  accumulatedROI: number;
  totalProfit: number;
  vacancyRate: number;
}
