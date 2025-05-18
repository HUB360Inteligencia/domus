
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyFormData, PropertyStatus } from "@/types/property";

/**
 * Fetches all properties for the current user
 */
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    console.log('Fetching properties from Supabase...');
    const session = await supabase.auth.getSession();
    console.log('Session state:', { 
      exists: !!session.data.session,
      expired: session.data.session ? new Date(session.data.session.expires_at * 1000) < new Date() : false
    });

    if (!session.data.session) {
      console.error('No active session found');
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    console.log('Properties fetched successfully:', data?.length || 0);

    // Transform the data to ensure status is of type PropertyStatus
    return (data || []).map(item => ({
      ...item,
      status: item.status as PropertyStatus
    }));
  } catch (err) {
    console.error('Failed to fetch properties:', err);
    throw err;
  }
};

/**
 * Fetches a property by its ID
 */
export const fetchPropertyById = async (id: string): Promise<Property | null> => {
  if (!id) return null;
  
  try {
    console.log(`Fetching property details for ID: ${id}`);
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.error('No active session found');
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching property ${id}:`, error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    console.log('Property detail fetch result:', data ? 'Success' : 'Not found');

    // Transform the data to ensure status is of type PropertyStatus
    return data ? {
      ...data,
      status: data.status as PropertyStatus
    } : null;
  } catch (err) {
    console.error(`Failed to fetch property ${id}:`, err);
    throw err;
  }
};

/**
 * Creates a new property
 */
export const createProperty = async (propertyData: PropertyFormData): Promise<Property> => {
  const user = supabase.auth.getUser();
  if (!(await user).data.user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('properties')
    .insert([
      {
        ...propertyData,
        user_id: (await user).data.user?.id,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    throw new Error(error.message);
  }

  // Transform the data to ensure status is of type PropertyStatus
  return {
    ...data,
    status: data.status as PropertyStatus
  };
};

/**
 * Updates an existing property
 */
export const updateProperty = async (propertyData: PropertyFormData & { id: string }): Promise<Property> => {
  const { id, ...data } = propertyData;
  
  console.log(`Updating property ${id} with data:`, data);
  
  const { data: updatedData, error } = await supabase
    .from('properties')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating property:', error);
    throw new Error(error.message);
  }

  console.log('Property updated successfully:', updatedData);

  return {
    ...updatedData,
    status: updatedData.status as PropertyStatus
  };
};

/**
 * Deletes a property
 */
export const deleteProperty = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting property:', error);
    throw new Error(error.message);
  }
};

/**
 * Uploads an image for a property
 */
export const uploadPropertyImage = async ({ id, imageFile }: { id: string; imageFile: File }): Promise<string> => {
  // Create a unique file name
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  console.log(`Uploading image for property ${id} to property_images bucket`);

  const { error: uploadError } = await supabase
    .storage
    .from('property_images')
    .upload(filePath, imageFile);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(uploadError.message);
  }

  // Get the public URL
  const { data } = supabase
    .storage
    .from('property_images')
    .getPublicUrl(filePath);

  console.log('Image uploaded successfully, URL:', data.publicUrl);

  // Update the property with the image URL
  const { error: updateError } = await supabase
    .from('properties')
    .update({ image_url: data.publicUrl })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating property with image URL:', updateError);
    throw new Error(updateError.message);
  }

  return data.publicUrl;
};

/**
 * Get coordinates from an address using a geocoding service
 */
export const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
  try {
    // This is a placeholder. We'll implement real geocoding in a later step
    console.log('Geocoding address:', address);
    
    // Return mock coordinates for now
    return { lat: -23.550520, lng: -46.633308 }; // São Paulo coordinates as placeholder
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};
