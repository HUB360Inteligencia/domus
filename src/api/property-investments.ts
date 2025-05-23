
import { supabase } from '@/integrations/supabase/client';
import { PropertyInvestment, PropertyInvestmentFormData, InvestmentType } from '@/types/property-investment';

/**
 * Fetches investments for a specific property
 */
export const fetchPropertyInvestments = async (propertyId: string): Promise<PropertyInvestment[]> => {
  try {
    const { data, error } = await supabase
      .from('property_investments')
      .select('*')
      .eq('property_id', propertyId)
      .order('investment_date', { ascending: false });

    if (error) {
      console.error('Error fetching property investments:', error);
      throw error;
    }

    // Cast the data to ensure it matches the PropertyInvestment[] type
    return data as PropertyInvestment[] || [];
  } catch (err) {
    console.error('Failed to fetch property investments:', err);
    throw err;
  }
};

/**
 * Creates a new property investment record
 */
export const createPropertyInvestment = async (investmentData: PropertyInvestmentFormData): Promise<PropertyInvestment> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('property_investments')
      .insert([
        {
          ...investmentData,
          user_id: user.data.user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating property investment:', error);
      throw error;
    }

    // After adding an investment, update the property's total investment
    await updatePropertyTotalInvestment(investmentData.property_id);

    // Cast the data to ensure it matches the PropertyInvestment type
    return data as PropertyInvestment;
  } catch (err) {
    console.error('Failed to create property investment:', err);
    throw err;
  }
};

/**
 * Updates an existing property investment record
 */
export const updatePropertyInvestment = async (id: string, investmentData: Partial<PropertyInvestmentFormData>): Promise<PropertyInvestment> => {
  try {
    const { data, error } = await supabase
      .from('property_investments')
      .update(investmentData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property investment:', error);
      throw error;
    }

    // After updating an investment, update the property's total investment
    await updatePropertyTotalInvestment(data.property_id);

    // Cast the data to ensure it matches the PropertyInvestment type
    return data as PropertyInvestment;
  } catch (err) {
    console.error('Failed to update property investment:', err);
    throw err;
  }
};

/**
 * Deletes a property investment record
 */
export const deletePropertyInvestment = async (id: string, propertyId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('property_investments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property investment:', error);
      throw error;
    }

    // After deleting an investment, update the property's total investment
    await updatePropertyTotalInvestment(propertyId);
  } catch (err) {
    console.error('Failed to delete property investment:', err);
    throw err;
  }
};

/**
 * Updates a property's total investment based on all investment records
 */
export const updatePropertyTotalInvestment = async (propertyId: string): Promise<void> => {
  try {
    // Get all investments for this property
    const { data: investments, error: fetchError } = await supabase
      .from('property_investments')
      .select('amount')
      .eq('property_id', propertyId);
    
    if (fetchError) {
      console.error('Error fetching investments for total calculation:', fetchError);
      return;
    }
    
    // Calculate total investment
    const totalInvestment = investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    
    // Update the property record
    const { error: updateError } = await supabase
      .from('properties')
      .update({ total_investment: totalInvestment })
      .eq('id', propertyId);
    
    if (updateError) {
      console.error('Error updating property total investment:', updateError);
    }
  } catch (err) {
    console.error('Failed to update property total investment:', err);
  }
};

/**
 * Uploads a receipt for a property investment
 */
export const uploadInvestmentReceipt = async (
  file: File, 
  investmentId: string, 
  propertyId: string
): Promise<string> => {
  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${investmentId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('investment_receipts')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading receipt:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data } = supabase
      .storage
      .from('investment_receipts')
      .getPublicUrl(filePath);

    // Update the investment with the receipt URL
    const { error: updateError } = await supabase
      .from('property_investments')
      .update({ receipt_url: data.publicUrl })
      .eq('id', investmentId);

    if (updateError) {
      console.error('Error updating investment with receipt URL:', updateError);
      throw updateError;
    }

    return data.publicUrl;
  } catch (err) {
    console.error('Failed to upload investment receipt:', err);
    throw err;
  }
};
