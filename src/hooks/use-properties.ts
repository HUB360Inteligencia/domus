
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  type: string;
  status: string;
  value: number;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useProperties = () => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }

      return data as Property[];
    }
  });

  return {
    properties,
    isLoading
  };
};
