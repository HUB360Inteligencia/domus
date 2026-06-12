
import { supabase } from "@/integrations/supabase/client";
import { FurnishedStatus, Property, PropertyFormData, PropertyStatus } from "@/types/property";
import { handleAuthError } from "@/utils/auth-utils";

import { logger } from "@/lib/logger";
/**
 * Fetches all properties for the current user
 */
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    logger.log('Fetching properties from Supabase...');
    
    // Check authentication first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logger.error('No active session found:', sessionError);
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching properties:', error);
      const authError = handleAuthError(error);
      throw new Error(authError.message);
    }

    logger.log('Properties fetched successfully:', data?.length || 0);

    // Transform the data to ensure property types are correctly cast
    return (data || []).map(item => ({
      ...item,
      status: item.status as PropertyStatus,
      furnished: item.furnished as FurnishedStatus,
      features: item.features as any,
      tags: item.tags || [],
      rental_value: item.rental_value || 0,
      land_area: item.land_area || 0
    }));
  } catch (err) {
    logger.error('Failed to fetch properties:', err);
    throw err;
  }
};

/**
 * Fetches a property by its ID
 */
export const fetchPropertyById = async (id: string): Promise<Property | null> => {
  if (!id) return null;
  
  try {
    logger.log(`Fetching property details for ID: ${id}`);
    
    // Check authentication first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logger.error('No active session found:', sessionError);
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    if (error) {
      logger.error(`Error fetching property ${id}:`, error);
      const authError = handleAuthError(error);
      throw new Error(authError.message);
    }

    logger.log('Property detail fetch result:', data ? 'Success' : 'Not found');

    // Transform the data to ensure property types are correctly cast
    return data ? {
      ...data,
      status: data.status as PropertyStatus,
      furnished: data.furnished as FurnishedStatus,
      features: data.features as any,
      tags: data.tags || [],
      rental_value: data.rental_value || 0,
      land_area: data.land_area || 0
    } : null;
  } catch (err) {
    logger.error(`Failed to fetch property ${id}:`, err);
    throw err;
  }
};

/**
 * Creates a new property
 */
export const createProperty = async (propertyData: PropertyFormData): Promise<Property> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }
    
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          ...propertyData,
          user_id: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating property:', error);
      const authError = handleAuthError(error);
      throw new Error(authError.message);
    }

    // Transform the data to ensure property types are correctly cast
    return {
      ...data,
      status: data.status as PropertyStatus,
      furnished: data.furnished as FurnishedStatus,
      features: data.features as any,
      tags: data.tags || [],
      rental_value: data.rental_value || 0,
      land_area: data.land_area || 0
    };
  } catch (err) {
    logger.error('Failed to create property:', err);
    throw err;
  }
};

/**
 * Updates an existing property
 */
export const updateProperty = async (propertyData: PropertyFormData & { id: string }): Promise<Property> => {
  const { id, ...data } = propertyData;
  
  try {
    logger.log(`Updating property ${id} with data:`, data);
    
    const { data: updatedData, error } = await supabase
      .from('properties')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating property:', error);
      const authError = handleAuthError(error);
      throw new Error(authError.message);
    }

    logger.log('Property updated successfully:', updatedData);

    return {
      ...updatedData,
      status: updatedData.status as PropertyStatus,
      furnished: updatedData.furnished as FurnishedStatus,
      features: updatedData.features as any,
      tags: updatedData.tags || [],
      rental_value: updatedData.rental_value || 0,
      land_area: updatedData.land_area || 0
    };
  } catch (err) {
    logger.error('Failed to update property:', err);
    throw err;
  }
};

/**
 * Updates a property's coordinates
 */
export const updatePropertyCoordinates = async ({ 
  id, 
  latitude, 
  longitude 
}: { 
  id: string; 
  latitude: number; 
  longitude: number 
}): Promise<Property> => {
  logger.log(`Updating coordinates for property ${id}:`, { latitude, longitude });

  const { data, error } = await supabase
    .from('properties')
    .update({ latitude, longitude })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating property coordinates:', error);
    throw new Error(error.message);
  }

  logger.log('Property coordinates updated successfully');

  return {
    ...data,
    status: data.status as PropertyStatus,
    furnished: data.furnished as FurnishedStatus,
    features: data.features as any,
    tags: data.tags || []
  };
};

/**
 * Deletes a property
 */
export const deleteProperty = async (id: string): Promise<void> => {
  const { error, count } = await supabase
    .from('properties')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    logger.error('Error deleting property:', error);
    throw new Error(error.message);
  }

  // RLS silently filters rows the user cannot delete (0 rows, no error).
  if (!count) {
    throw new Error('Você não tem permissão para excluir este imóvel.');
  }
};

/**
 * Uploads an image for a property using the new property_images bucket
 */
export const uploadPropertyImage = async ({ id, imageFile }: { id: string; imageFile: File }): Promise<string> => {
  try {
    // Create a unique file name
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    logger.log(`Uploading image for property ${id} to property_images bucket`);

    const { error: uploadError } = await supabase
      .storage
      .from('property_images')
      .upload(filePath, imageFile);

    if (uploadError) {
      logger.error('Error uploading image:', uploadError);
      throw new Error(uploadError.message);
    }

    // Get the public URL
    const { data } = supabase
      .storage
      .from('property_images')
      .getPublicUrl(filePath);

    logger.log('Image uploaded successfully, URL:', data.publicUrl);

    // Update the property with the image URL
    const { error: updateError } = await supabase
      .from('properties')
      .update({ image_url: data.publicUrl })
      .eq('id', id);

    if (updateError) {
      logger.error('Error updating property with image URL:', updateError);
      throw new Error(updateError.message);
    }

    return data.publicUrl;
  } catch (err) {
    logger.error('Failed to upload property image:', err);
    throw err;
  }
};

/**
 * Get coordinates from an address using the Mapbox Geocoding API.
 *
 * Returns the exact coordinates for the address, or `null` when the address
 * cannot be geocoded. We intentionally do NOT fall back to a city center with a
 * random offset: that produced pins on the wrong street. A `null` result lets
 * the caller tell the user the address could not be located instead of storing
 * a bogus coordinate.
 */
export const geocodeAddress = async (
  address: string,
  propertyNumber?: string,
  city?: string,
  state?: string,
  postalCode?: string
): Promise<{ lat: number, lng: number } | null> => {
  try {
    logger.log('Geocoding address:', address);

    // Build the most specific address string we can. The postal code greatly
    // improves accuracy for Brazilian addresses.
    const fullAddress = [
      propertyNumber ? `${address}, ${propertyNumber}` : address,
      city,
      state,
      postalCode,
      'Brasil',
    ]
      .filter(Boolean)
      .join(', ');

    // Cache key for this address (sessionStorage avoids repeat API calls).
    const cacheKey = `geocode_${fullAddress.replace(/\s+/g, '_').toLowerCase()}`;
    const cachedResult = sessionStorage.getItem(cacheKey);
    if (cachedResult) {
      logger.log('Using cached geocode result for:', fullAddress);
      return JSON.parse(cachedResult);
    }

    // Use the same token source as the map (env var), falling back to any
    // legacy token stored in localStorage.
    const mapboxToken =
      (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ||
      localStorage.getItem('mapbox_token');

    if (!mapboxToken) {
      logger.error('Geocoding skipped: no Mapbox token configured');
      return null;
    }

    const encodedAddress = encodeURIComponent(fullAddress);
    const params = new URLSearchParams({
      access_token: mapboxToken,
      limit: '1',
      country: 'br',
      language: 'pt',
      types: 'address',
    });

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Mapbox returns coordinates as [longitude, latitude].
      const [lng, lat] = data.features[0].center;
      const result = { lat, lng };

      sessionStorage.setItem(cacheKey, JSON.stringify(result));
      logger.log('Geocoded using Mapbox API:', result);
      return result;
    }

    logger.log('No features returned from Mapbox Geocoding API for:', fullAddress);
    return null;
  } catch (error) {
    logger.error('Error geocoding address:', error);
    return null;
  }
};
