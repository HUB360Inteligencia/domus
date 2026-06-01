
import { supabase } from "@/integrations/supabase/client";
import { PropertyValuation } from "@/types/property";

import { logger } from "@/lib/logger";
/**
 * Fetches all valuations for a property
 */
export const fetchPropertyValuations = async (propertyId: string): Promise<PropertyValuation[]> => {
  try {
    const { data, error } = await supabase
      .from('property_valuations')
      .select('*')
      .eq('property_id', propertyId)
      .order('valuation_date', { ascending: true });

    if (error) {
      logger.error('Error fetching property valuations:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (err) {
    logger.error('Failed to fetch property valuations:', err);
    throw err;
  }
};

/**
 * Creates a new property valuation
 */
export const createPropertyValuation = async (
  propertyId: string, 
  value: number, 
  valuationDate: string = new Date().toISOString().split('T')[0], 
  notes?: string
): Promise<PropertyValuation> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');
  
  try {
    const { data, error } = await supabase
      .from('property_valuations')
      .insert([{
        property_id: propertyId,
        value,
        valuation_date: valuationDate,
        notes,
        user_id: user.data.user.id
      }])
      .select()
      .single();

    if (error) {
      logger.error('Error creating property valuation:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    logger.error('Failed to create property valuation:', err);
    throw err;
  }
};

/**
 * Updates an existing property valuation
 */
export const updatePropertyValuation = async (
  id: string,
  updates: Partial<Omit<PropertyValuation, 'id' | 'property_id' | 'created_at' | 'user_id'>>
): Promise<PropertyValuation> => {
  try {
    const { data, error } = await supabase
      .from('property_valuations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating property valuation:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    logger.error('Failed to update property valuation:', err);
    throw err;
  }
};

/**
 * Deletes a property valuation
 */
export const deletePropertyValuation = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('property_valuations')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting property valuation:', error);
      throw new Error(error.message);
    }
  } catch (err) {
    logger.error('Failed to delete property valuation:', err);
    throw err;
  }
};
