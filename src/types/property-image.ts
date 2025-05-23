
export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  description?: string;
  is_primary: boolean;
  display_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyImageFormData {
  property_id: string;
  image_url?: string;
  description?: string;
  is_primary?: boolean;
  display_order?: number;
}
