import { Json } from '@/integrations/supabase/types';

export type PropertyStatus = 'available' | 'rented' | 'airbnb' | 'maintenance' | 'sold';

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'rural';

export type FurnishedStatus = 'not_furnished' | 'partially_furnished' | 'fully_furnished';

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
  type: PropertyType | string; // Allow both PropertyType and string for flexibility
  status: PropertyStatus;
  value: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  garage_spots?: number;
  condo_fee?: number;
  floor_number?: number;
  furnished?: FurnishedStatus;
  features?: Json | Record<string, any>; // Accept both Json type from Supabase and Record type
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  // Novos campos
  purchase_date?: string | null;
  purchase_value?: number | null;
  tenant_name?: string | null;
  tenant_contact?: string | null;
  agency_name?: string | null;
  agency_responsible?: string | null;
  agency_contact?: string | null;
  square_meter_value?: number | null;
  tags?: string[] | null;
  // Add this for ROIChart and PropertyInvestmentSection
  last_valuation_date?: string | null;
  total_investment?: number | null;
  monthly_return_rate?: number | null;
  annual_return_rate?: number | null;
  vacancy_rate?: number | null;
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
  // Novos campos
  purchase_date?: string | null;
  purchase_value?: number | null;
  tenant_name?: string | null;
  tenant_contact?: string | null;
  agency_name?: string | null;
  agency_responsible?: string | null;
  agency_contact?: string | null;
  square_meter_value?: number | null;
  tags?: string[] | null;
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
