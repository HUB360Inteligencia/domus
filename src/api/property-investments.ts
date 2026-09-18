
import { supabase } from '@/integrations/supabase/client';
import { uploadReceiptFile } from '@/api/receipts';
import { PropertyInvestment, PropertyInvestmentFormData, InvestmentType } from '@/types/property-investment';

import { logger } from "@/lib/logger";
export const fetchPropertyInvestments = async (propertyId: string): Promise<PropertyInvestment[]> => {
  try {
    const { data, error } = await supabase
      .from('property_investments')
      .select('*')
      .eq('property_id', propertyId)
      .order('investment_date', { ascending: false });

    if (error) {
      logger.error('Error fetching property investments:', error);
      throw error;
    }

    // Ensure investment_type is properly typed
    return (data || []).map(item => ({
      ...item,
      investment_type: item.investment_type as InvestmentType
    }));
  } catch (err) {
    logger.error('Failed to fetch property investments:', err);
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
      logger.error('Error creating property investment:', error);
      throw error;
    }

    return {
      ...data,
      investment_type: data.investment_type as InvestmentType
    };
  } catch (err) {
    logger.error('Failed to create property investment:', err);
    throw err;
  }
};

export const uploadInvestmentReceipt = (file: File): Promise<string> => uploadReceiptFile(file, 'investments');

export const deletePropertyInvestment = async (investmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('property_investments')
    .delete()
    .eq('id', investmentId);

  if (error) {
    logger.error('Error deleting property investment:', error);
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
      logger.error('Error fetching property data:', propertyError);
      throw propertyError;
    }

    // Get all investments for the property
    const { data: investments, error: investmentsError } = await supabase
      .from('property_investments')
      .select('amount')
      .eq('property_id', propertyId);

    if (investmentsError) {
      logger.error('Error fetching property investments:', investmentsError);
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
      logger.error('Error updating property total investment:', updateError);
    }

    return totalInvestment;
  } catch (err) {
    logger.error('Failed to calculate total investment:', err);
    throw err;
  }
};
