
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFormData } from '@/types/property';
import { handleAuthError } from '@/utils/auth-utils';

export const createPropertyEnhanced = async (propertyData: Omit<PropertyFormData, 'images'>): Promise<Property> => {
  try {
    console.log('Creating property with data:', propertyData);
    
    // Check authentication first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Erro de autenticação');
    }
    
    if (!session) {
      console.error('No active session found');
      throw new Error('Usuário não autenticado');
    }

    // Prepare data for insertion
    const insertData = {
      ...propertyData,
      user_id: session.user.id,
      // Ensure required fields have valid values
      title: propertyData.title || '',
      address: propertyData.address || '',
      city: propertyData.city || '',
      state: propertyData.state || '',
      type: propertyData.type || 'apartment',
      status: propertyData.status || 'available',
      value: Number(propertyData.value) || 0,
    };

    console.log('Insert data prepared:', insertData);

    const { data, error } = await supabase
      .from('properties')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Database error creating property:', error);
      const authError = handleAuthError(error);
      throw new Error(authError.message);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado ao criar propriedade');
    }

    console.log('Property created successfully:', data);
    return data as unknown as Property;
    
  } catch (err: any) {
    console.error('Failed to create property:', err);
    throw new Error(err.message || 'Erro ao criar propriedade');
  }
};

export const updatePropertyEnhanced = async (propertyData: { id: string } & Partial<Omit<PropertyFormData, 'images'>>): Promise<Property> => {
  try {
    console.log('Updating property with data:', propertyData);
    
    const { id, ...updateData } = propertyData;

    // Check authentication first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Erro de autenticação');
    }
    
    if (!session) {
      console.error('No active session found');
      throw new Error('Usuário não autenticado');
    }

    console.log('Update data prepared:', updateData);

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id) // Ensure user can only update their own properties
      .select()
      .single();

    if (error) {
      console.error('Database error updating property:', error);
      const authError = handleAuthError(error);
      throw new Error(authError.message);
    }

    if (!data) {
      throw new Error('Propriedade não encontrada ou sem permissão para editar');
    }

    console.log('Property updated successfully:', data);
    return data;
    
  } catch (err: any) {
    console.error('Failed to update property:', err);
    throw new Error(err.message || 'Erro ao atualizar propriedade');
  }
};
