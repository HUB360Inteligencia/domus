
import { supabase } from '@/integrations/supabase/client';
import { PropertyImage, PropertyImageFormData } from '@/types/property-image';

/**
 * Fetches images for a specific property
 */
export const fetchPropertyImages = async (propertyId: string): Promise<PropertyImage[]> => {
  try {
    const { data, error } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching property images:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch property images:', err);
    throw err;
  }
};

/**
 * Uploads and creates a new property image
 */
export const uploadPropertyImageMulti = async ({ 
  propertyId, 
  imageFile, 
  description = '', 
  isPrimary = false 
}: { 
  propertyId: string; 
  imageFile: File; 
  description?: string; 
  isPrimary?: boolean;
}): Promise<PropertyImage> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Create a unique file name
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${propertyId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the image to storage
    const { error: uploadError } = await supabase
      .storage
      .from('property_images')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('property_images')
      .getPublicUrl(filePath);

    // Get current highest display order
    const { data: currentImages, error: orderError } = await supabase
      .from('property_images')
      .select('display_order')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: false })
      .limit(1);

    if (orderError) {
      console.error('Error getting current display order:', orderError);
    }

    const nextOrder = currentImages && currentImages.length > 0 
      ? (currentImages[0].display_order || 0) + 1 
      : 0;

    // If this is set to be the primary image, unset any existing primary image
    if (isPrimary) {
      await supabase
        .from('property_images')
        .update({ is_primary: false })
        .eq('property_id', propertyId);
    }

    // If this is the first image, automatically make it the primary image
    const shouldBePrimary = isPrimary || (currentImages?.length === 0);

    // Insert the image record
    const { data: imageRecord, error: insertError } = await supabase
      .from('property_images')
      .insert([{
        property_id: propertyId,
        image_url: urlData.publicUrl,
        description,
        is_primary: shouldBePrimary,
        display_order: nextOrder,
        user_id: user.data.user.id
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating property image record:', insertError);
      throw insertError;
    }

    // If this is the first or primary image, update the main image_url in the properties table
    if (shouldBePrimary) {
      await updateMainPropertyImage(propertyId, urlData.publicUrl);
    }

    return imageRecord;
  } catch (err) {
    console.error('Failed to upload property image:', err);
    throw err;
  }
};

/**
 * Updates the main image URL in the properties table
 */
export const updateMainPropertyImage = async (propertyId: string, imageUrl: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ image_url: imageUrl })
      .eq('id', propertyId);

    if (error) {
      console.error('Error updating main property image:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to update main property image:', err);
    throw err;
  }
};

/**
 * Sets an image as the primary image
 */
export const setPrimaryPropertyImage = async (imageId: string, propertyId: string): Promise<void> => {
  try {
    // First, get the image URL
    const { data: image, error: fetchError } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      console.error('Error fetching image:', fetchError);
      throw fetchError;
    }

    // Reset all images for this property
    const { error: resetError } = await supabase
      .from('property_images')
      .update({ is_primary: false })
      .eq('property_id', propertyId);

    if (resetError) {
      console.error('Error resetting primary images:', resetError);
      throw resetError;
    }

    // Set this image as primary
    const { error: updateError } = await supabase
      .from('property_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (updateError) {
      console.error('Error setting primary image:', updateError);
      throw updateError;
    }

    // Update the main property image
    await updateMainPropertyImage(propertyId, image.image_url);
  } catch (err) {
    console.error('Failed to set primary property image:', err);
    throw err;
  }
};

/**
 * Updates an image's description or order
 */
export const updatePropertyImage = async (id: string, data: Partial<PropertyImageFormData>): Promise<PropertyImage> => {
  try {
    const { data: updatedImage, error } = await supabase
      .from('property_images')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property image:', error);
      throw error;
    }

    return updatedImage;
  } catch (err) {
    console.error('Failed to update property image:', err);
    throw err;
  }
};

/**
 * Updates the display order of multiple images
 */
export const reorderPropertyImages = async (images: { id: string; display_order: number }[]): Promise<void> => {
  try {
    // Use Promise.all to handle multiple updates
    await Promise.all(
      images.map(img => 
        supabase
          .from('property_images')
          .update({ display_order: img.display_order })
          .eq('id', img.id)
      )
    );
  } catch (err) {
    console.error('Failed to reorder property images:', err);
    throw err;
  }
};

/**
 * Deletes a property image
 */
export const deletePropertyImage = async (id: string, propertyId: string): Promise<void> => {
  try {
    // Check if this is the primary image
    const { data: image, error: fetchError } = await supabase
      .from('property_images')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching image before delete:', fetchError);
      throw fetchError;
    }

    // Delete the image record
    const { error: deleteError } = await supabase
      .from('property_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting property image:', deleteError);
      throw deleteError;
    }

    // If this was the primary image, set a new primary image
    if (image.is_primary) {
      const { data: nextImage, error: nextError } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (nextError && nextError.code !== 'PGRST116') { // Not found error code
        console.error('Error finding next primary image:', nextError);
      } else if (nextImage) {
        await setPrimaryPropertyImage(nextImage.id, propertyId);
      } else {
        // No more images, clear the property image_url
        await updateMainPropertyImage(propertyId, null);
      }
    }
  } catch (err) {
    console.error('Failed to delete property image:', err);
    throw err;
  }
};
