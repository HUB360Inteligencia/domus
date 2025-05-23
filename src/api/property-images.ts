
import { supabase } from '@/integrations/supabase/client';
import { PropertyImage, PropertyImageFormData } from '@/types/property-image';

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

export const uploadPropertyImage = async (
  propertyId: string, 
  imageFile: File, 
  imageData: Omit<PropertyImageFormData, 'property_id'> = {}
): Promise<PropertyImage> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${propertyId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('property_images')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('property_images')
      .getPublicUrl(filePath);

    // Get the count of existing images to determine if this is the first one
    const { count, error: countError } = await supabase
      .from('property_images')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId);

    if (countError) {
      console.error('Error getting image count:', countError);
    }

    // Set primary flag automatically if this is the first image
    const isPrimary = imageData.is_primary ?? (count === 0);

    // Get next available display order
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from('property_images')
      .select('display_order')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: false })
      .limit(1);

    if (maxOrderError) {
      console.error('Error getting max display order:', maxOrderError);
    }

    const nextOrder = maxOrderData && maxOrderData.length > 0
      ? maxOrderData[0].display_order + 1
      : 0;

    // Insert record in database
    const { data, error } = await supabase
      .from('property_images')
      .insert([{
        property_id: propertyId,
        user_id: user.data.user.id,
        image_url: publicUrlData.publicUrl,
        description: imageData.description || null,
        is_primary: isPrimary,
        display_order: imageData.display_order ?? nextOrder
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating property image record:', error);
      throw error;
    }

    // If this is marked as primary, update other images to not be primary
    if (isPrimary) {
      await supabase
        .from('property_images')
        .update({ is_primary: false })
        .eq('property_id', propertyId)
        .neq('id', data.id);
        
      // Also update the main property image_url
      await supabase
        .from('properties')
        .update({ image_url: publicUrlData.publicUrl })
        .eq('id', propertyId);
    }

    return data;
  } catch (err) {
    console.error('Failed to upload property image:', err);
    throw err;
  }
};

export const setPropertyImageAsPrimary = async (imageId: string, propertyId: string): Promise<void> => {
  try {
    // Get image URL first
    const { data: image, error: getError } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('id', imageId)
      .single();

    if (getError) {
      console.error('Error getting image details:', getError);
      throw getError;
    }

    // First, update this image as primary
    const { error: updateError } = await supabase
      .from('property_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (updateError) {
      console.error('Error setting image as primary:', updateError);
      throw updateError;
    }

    // Then, update all other images to not be primary
    const { error: updateOthersError } = await supabase
      .from('property_images')
      .update({ is_primary: false })
      .eq('property_id', propertyId)
      .neq('id', imageId);

    if (updateOthersError) {
      console.error('Error updating other images:', updateOthersError);
      throw updateOthersError;
    }

    // Update the property's main image
    if (image && image.image_url) {
      const { error: updatePropertyError } = await supabase
        .from('properties')
        .update({ image_url: image.image_url })
        .eq('id', propertyId);

      if (updatePropertyError) {
        console.error('Error updating property image_url:', updatePropertyError);
        throw updatePropertyError;
      }
    }
  } catch (err) {
    console.error('Failed to set primary image:', err);
    throw err;
  }
};

export const updatePropertyImageOrder = async (
  images: Array<{ id: string; display_order: number }>
): Promise<void> => {
  try {
    // Use transaction to update all images at once
    const { error } = await supabase.rpc('update_image_orders', { 
      image_orders: images 
    });

    if (error) {
      console.error('Error updating image order:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to update image order:', err);
    throw err;
  }
};

export const updatePropertyImageDescription = async (
  imageId: string, 
  description: string
): Promise<PropertyImage> => {
  try {
    const { data, error } = await supabase
      .from('property_images')
      .update({ description })
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating image description:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Failed to update image description:', err);
    throw err;
  }
};

export const deletePropertyImage = async (
  imageId: string, 
  propertyId: string
): Promise<void> => {
  try {
    // Check if this is the primary image
    const { data: image, error: getError } = await supabase
      .from('property_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (getError) {
      console.error('Error getting image details:', getError);
      throw getError;
    }

    // Delete from the database
    const { error: deleteError } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Error deleting image:', deleteError);
      throw deleteError;
    }

    // If deleted image was primary, set another image as primary
    if (image.is_primary) {
      const { data: nextImage, error: nextImageError } = await supabase
        .from('property_images')
        .select('id, image_url')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (nextImageError && nextImageError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error getting next image:', nextImageError);
      }

      if (nextImage) {
        // Set this image as primary
        await supabase
          .from('property_images')
          .update({ is_primary: true })
          .eq('id', nextImage.id);

        // Update the property's main image
        await supabase
          .from('properties')
          .update({ image_url: nextImage.image_url })
          .eq('id', propertyId);
      } else {
        // No images left, clear the property's main image
        await supabase
          .from('properties')
          .update({ image_url: null })
          .eq('id', propertyId);
      }
    }

    // Extract filename from URL to delete from storage
    // This assumes the URL format contains the filename at the end
    const urlParts = image.image_url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('property_images')
      .remove([fileName]);

    if (storageError) {
      console.error('Error deleting image from storage:', storageError);
      // Don't throw here, as the database record is already deleted
    }
  } catch (err) {
    console.error('Failed to delete property image:', err);
    throw err;
  }
};
