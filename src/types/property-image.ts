
export interface PropertyImage {
  id: string;
  property_id: string;
  user_id: string;
  image_url: string;
  description?: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyImageFormData {
  property_id: string;
  description?: string | null;
  is_primary?: boolean;
  display_order?: number;
}
