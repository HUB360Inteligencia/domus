
import { supabase } from "@/integrations/supabase/client";
import { FurnishedStatus, Property, PropertyFormData, PropertyStatus } from "@/types/property";

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
  console.log(`Updating coordinates for property ${id}:`, { latitude, longitude });

  const { data, error } = await supabase
    .from('properties')
    .update({ latitude, longitude })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating property coordinates:', error);
    throw new Error(error.message);
  }

  console.log('Property coordinates updated successfully');

  return {
    ...data,
    status: data.status as PropertyStatus
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
 * Get coordinates from an address using Mapbox Geocoding API
 */
export const geocodeAddress = async (
  address: string,
  propertyNumber?: string,
  city?: string,
  state?: string
): Promise<{ lat: number, lng: number } | null> => {
  try {
    console.log('Geocoding address:', address);
    
    // Create a full address string
    const fullAddress = `${address}${propertyNumber ? `, ${propertyNumber}` : ''}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}`;
    
    // Create a cache key for this address
    const cacheKey = `geocode_${fullAddress.replace(/\s+/g, '_').toLowerCase()}`;
    
    // Check if we have cached results
    const cachedResult = sessionStorage.getItem(cacheKey);
    if (cachedResult) {
      console.log('Using cached geocode result for:', fullAddress);
      return JSON.parse(cachedResult);
    }
    
    // Get user's Mapbox token from context
    const mapboxToken = localStorage.getItem('mapbox_token');
    
    if (mapboxToken) {
      try {
        // Use Mapbox Geocoding API
        const encodedAddress = encodeURIComponent(fullAddress);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1`
        );
        
        if (!response.ok) {
          throw new Error(`Mapbox API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // Mapbox returns coordinates as [longitude, latitude]
          const [lng, lat] = data.features[0].center;
          
          const result = { lat, lng };
          
          // Cache the result
          sessionStorage.setItem(cacheKey, JSON.stringify(result));
          console.log('Geocoded using Mapbox API:', result);
          return result;
        } else {
          console.log('No features returned from Mapbox Geocoding API');
        }
      } catch (error) {
        console.error('Error using Mapbox Geocoding API:', error);
        // Continue to fallback method if Mapbox fails
      }
    }
    
    // Fallback: Use our predefined list of city coordinates with random offset
    console.log('Using fallback geocoding with predefined coordinates');
    
    // Map of cities to their approximate coordinates
    const cityCoordinates: Record<string, { lat: number, lng: number }> = {
      'são paulo': { lat: -23.550520, lng: -46.633308 },
      'rio de janeiro': { lat: -22.906847, lng: -43.172896 },
      'brasília': { lat: -15.7942, lng: -47.8822 },
      'salvador': { lat: -12.9714, lng: -38.5014 },
      'fortaleza': { lat: -3.7319, lng: -38.5267 },
      'belo horizonte': { lat: -19.9167, lng: -43.9345 },
      'manaus': { lat: -3.1190, lng: -60.0217 },
      'curitiba': { lat: -25.4284, lng: -49.2733 },
      'recife': { lat: -8.0476, lng: -34.8770 },
      'porto alegre': { lat: -30.0346, lng: -51.2177 },
    };
    
    // Try to find the city in our address and return its coordinates
    const lowercaseAddress = fullAddress.toLowerCase();
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (lowercaseAddress.includes(city)) {
        // Add small random offset to make properties in the same city appear slightly different
        const randomLat = (Math.random() - 0.5) * 0.01;
        const randomLng = (Math.random() - 0.5) * 0.01;
        
        const result = { 
          lat: coords.lat + randomLat, 
          lng: coords.lng + randomLng
        };
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
      }
    }
    
    // If city not found in our list, return default coordinates with random offset
    const defaultCoords = { lat: -23.550520 + (Math.random() - 0.5) * 0.05, lng: -46.633308 + (Math.random() - 0.5) * 0.05 };
    
    // Cache the result
    sessionStorage.setItem(cacheKey, JSON.stringify(defaultCoords));
    return defaultCoords;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};
