
import { supabase } from "@/integrations/supabase/client";
import { Property, PropertyFormData, PropertyStatus } from "@/types/property";

/**
 * Fetches all properties for the current user
 */
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw new Error(error.message);
    }

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
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching property ${id}:`, error);
      throw new Error(error.message);
    }

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

  const { error: uploadError } = await supabase
    .storage
    .from('properties')
    .upload(filePath, imageFile);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(uploadError.message);
  }

  // Get the public URL
  const { data } = supabase
    .storage
    .from('properties')
    .getPublicUrl(filePath);

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
