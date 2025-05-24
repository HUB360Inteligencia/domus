
import { supabase } from '@/integrations/supabase/client';
import { Development, DevelopmentFormData } from '@/types/development';

export const developmentsApi = {
  async getDevelopments(): Promise<Development[]> {
    const { data, error } = await supabase
      .from('developments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDevelopment(id: string): Promise<Development | null> {
    const { data, error } = await supabase
      .from('developments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createDevelopment(formData: DevelopmentFormData): Promise<Development> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('developments')
      .insert({
        ...formData,
        user_id: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDevelopment(id: string, formData: Partial<DevelopmentFormData>): Promise<Development> {
    const { data, error } = await supabase
      .from('developments')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDevelopment(id: string): Promise<void> {
    const { error } = await supabase
      .from('developments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
