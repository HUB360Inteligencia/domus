
import { supabase } from '@/integrations/supabase/client';
import { PropertyOccupancy, PropertyOccupancyFormData } from '@/types/property-occupancy';
import { differenceInCalendarDays } from 'date-fns';

/**
 * Fetches occupancy periods for a specific property
 */
export const fetchPropertyOccupancy = async (propertyId: string): Promise<PropertyOccupancy[]> => {
  try {
    const { data, error } = await supabase
      .from('property_occupancy_periods')
      .select('*')
      .eq('property_id', propertyId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching property occupancy periods:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch property occupancy periods:', err);
    throw err;
  }
};

/**
 * Creates a new occupancy period for a property
 */
export const createPropertyOccupancy = async (
  occupancyData: PropertyOccupancyFormData
): Promise<PropertyOccupancy> => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('property_occupancy_periods')
      .insert([
        {
          ...occupancyData,
          user_id: user.data.user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating property occupancy period:', error);
      throw error;
    }

    // After creating a new occupancy period, update the property's vacancy rate
    await updatePropertyVacancyRate(occupancyData.property_id);

    return data;
  } catch (err) {
    console.error('Failed to create property occupancy period:', err);
    throw err;
  }
};

/**
 * Updates an existing occupancy period
 */
export const updatePropertyOccupancy = async (
  id: string, 
  occupancyData: Partial<PropertyOccupancyFormData>
): Promise<PropertyOccupancy> => {
  try {
    const { data, error } = await supabase
      .from('property_occupancy_periods')
      .update(occupancyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property occupancy period:', error);
      throw error;
    }

    // After updating an occupancy period, update the property's vacancy rate
    await updatePropertyVacancyRate(data.property_id);

    return data;
  } catch (err) {
    console.error('Failed to update property occupancy period:', err);
    throw err;
  }
};

/**
 * Deletes an occupancy period
 */
export const deletePropertyOccupancy = async (id: string, propertyId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('property_occupancy_periods')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting property occupancy period:', error);
      throw error;
    }

    // After deleting an occupancy period, update the property's vacancy rate
    await updatePropertyVacancyRate(propertyId);
  } catch (err) {
    console.error('Failed to delete property occupancy period:', err);
    throw err;
  }
};

/**
 * Calculates and updates a property's vacancy rate based on occupancy records
 */
export const updatePropertyVacancyRate = async (propertyId: string): Promise<number> => {
  try {
    // First, get the property to check purchase date
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('purchase_date')
      .eq('id', propertyId)
      .single();
    
    if (propertyError) {
      console.error('Error fetching property for vacancy calculation:', propertyError);
      return 0;
    }
    
    // Determine the start date for vacancy calculation - either purchase date or 365 days ago
    const purchaseDate = property.purchase_date 
      ? new Date(property.purchase_date) 
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Default to 1 year ago
      
    const today = new Date();
    const totalDays = Math.max(differenceInCalendarDays(today, purchaseDate), 1);
    
    // Fetch all occupancy periods for this property
    const { data: occupancyPeriods, error: occupancyError } = await supabase
      .from('property_occupancy_periods')
      .select('*')
      .eq('property_id', propertyId)
      .gte('start_date', purchaseDate.toISOString());
    
    if (occupancyError) {
      console.error('Error fetching occupancy periods for vacancy calculation:', occupancyError);
      return 0;
    }
    
    // Calculate days with occupancy
    let occupiedDays = 0;
    occupancyPeriods?.forEach(period => {
      if (period.occupancy_type !== 'vacant') {
        const startDate = new Date(period.start_date);
        const endDate = period.end_date ? new Date(period.end_date) : today;
        
        // Make sure dates are within our calculation period
        const effectiveStartDate = startDate > purchaseDate ? startDate : purchaseDate;
        const effectiveEndDate = endDate < today ? endDate : today;
        
        // Add the days to our count
        if (effectiveEndDate >= effectiveStartDate) {
          occupiedDays += differenceInCalendarDays(effectiveEndDate, effectiveStartDate) + 1;
        }
      }
    });
    
    // Calculate vacancy rate (percentage of time vacant)
    const vacancyRate = Math.round(((totalDays - occupiedDays) / totalDays) * 100);
    
    // Update the property record with the calculated vacancy rate
    const { error: updateError } = await supabase
      .from('properties')
      .update({ vacancy_rate: vacancyRate })
      .eq('id', propertyId);
    
    if (updateError) {
      console.error('Error updating property vacancy rate:', updateError);
    }
    
    return vacancyRate;
  } catch (err) {
    console.error('Failed to update property vacancy rate:', err);
    return 0;
  }
};

/**
 * Creates a new occupancy period from a contract
 */
export const createOccupancyFromContract = async (contract: any): Promise<void> => {
  try {
    if (!contract.property_id || contract.status !== 'active') return;
    
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;
    
    // Check if there's already an occupancy period for this contract
    const { data: existingOccupancy } = await supabase
      .from('property_occupancy_periods')
      .select('id')
      .eq('contract_id', contract.id)
      .maybeSingle();
    
    if (existingOccupancy) {
      // Update existing occupancy
      await supabase
        .from('property_occupancy_periods')
        .update({
          start_date: contract.start_date,
          end_date: contract.end_date,
          tenant_name: contract.tenant_name
        })
        .eq('id', existingOccupancy.id);
    } else {
      // Create new occupancy
      await supabase
        .from('property_occupancy_periods')
        .insert([{
          property_id: contract.property_id,
          start_date: contract.start_date,
          end_date: contract.end_date,
          occupancy_type: 'rented',
          tenant_name: contract.tenant_name,
          contract_id: contract.id,
          user_id: user.data.user.id
        }]);
    }
    
    // Update vacancy rate
    await updatePropertyVacancyRate(contract.property_id);
  } catch (err) {
    console.error('Failed to create occupancy from contract:', err);
  }
};
