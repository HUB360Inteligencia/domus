
import { supabase } from '@/integrations/supabase/client';
import { PropertyInvestment, PropertyInvestmentFormData, InvestmentType } from '@/types/property-investment';

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

    // Ensure investment_type is properly typed
    return (data || []).map(item => ({
      ...item,
      investment_type: item.investment_type as InvestmentType
    }));
  } catch (err) {
    console.error('Failed to fetch property investments:', err);
    throw err;
  }
};

export const createPropertyInvestment = async (
  investmentData: PropertyInvestmentFormData
): Promise<PropertyInvestment> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('property_investments')
      .insert([{
        ...investmentData,
        user_id: session.data.session.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating property investment:', error);
      throw error;
    }

    return {
      ...data,
      investment_type: data.investment_type as InvestmentType
    };
  } catch (err) {
    console.error('Failed to create property investment:', err);
    throw err;
  }
};

export const uploadInvestmentReceipt = async (file: File): Promise<string> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${user.data.user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from('investment_receipts')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading investment receipt:', error);
    throw error;
  }

  // Get the public URL
  const { data } = supabase.storage
    .from('investment_receipts')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const deletePropertyInvestment = async (investmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('property_investments')
    .delete()
    .eq('id', investmentId);

  if (error) {
    console.error('Error deleting property investment:', error);
    throw error;
  }
};

export const calculateTotalInvestment = async (propertyId: string): Promise<number> => {
  try {
    // Get property data first to include purchase value
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('purchase_value')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('Error fetching property data:', propertyError);
      throw propertyError;
    }

    // Get all investments for the property
    const { data: investments, error: investmentsError } = await supabase
      .from('property_investments')
      .select('amount')
      .eq('property_id', propertyId);

    if (investmentsError) {
      console.error('Error fetching property investments:', investmentsError);
      throw investmentsError;
    }

    // Calculate total investments
    const purchaseValue = property?.purchase_value || 0;
    const additionalInvestments = investments?.reduce((total, inv) => total + (inv.amount || 0), 0) || 0;
    const totalInvestment = purchaseValue + additionalInvestments;

    // Update the property with the calculated total investment
    const { error: updateError } = await supabase
      .from('properties')
      .update({ total_investment: totalInvestment })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Error updating property total investment:', updateError);
    }

    return totalInvestment;
  } catch (err) {
    console.error('Failed to calculate total investment:', err);
    throw err;
  }
};
