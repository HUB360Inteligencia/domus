
import { supabase } from '@/integrations/supabase/client';
import { PropertyOccupancyPeriod, PropertyOccupancyFormData, OccupancyType } from '@/types/property-occupancy';

export const fetchPropertyOccupancyPeriods = async (propertyId: string): Promise<PropertyOccupancyPeriod[]> => {
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

    return (data || []).map(item => ({
      ...item,
      occupancy_type: item.occupancy_type as OccupancyType
    }));
  } catch (err) {
    console.error('Failed to fetch property occupancy periods:', err);
    throw err;
  }
};

export const createPropertyOccupancyPeriod = async (
  occupancyData: PropertyOccupancyFormData
): Promise<PropertyOccupancyPeriod> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('property_occupancy_periods')
      .insert([{
        ...occupancyData,
        user_id: session.data.session.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating property occupancy period:', error);
      throw error;
    }

    return {
      ...data,
      occupancy_type: data.occupancy_type as OccupancyType
    };
  } catch (err) {
    console.error('Failed to create property occupancy period:', err);
    throw err;
  }
};

export const updatePropertyOccupancyPeriod = async (
  id: string,
  occupancyData: Partial<PropertyOccupancyFormData>
): Promise<PropertyOccupancyPeriod> => {
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

    return {
      ...data,
      occupancy_type: data.occupancy_type as OccupancyType
    };
  } catch (err) {
    console.error('Failed to update property occupancy period:', err);
    throw err;
  }
};

export const deletePropertyOccupancyPeriod = async (periodId: string): Promise<void> => {
  const { error } = await supabase
    .from('property_occupancy_periods')
    .delete()
    .eq('id', periodId);

  if (error) {
    console.error('Error deleting property occupancy period:', error);
    throw error;
  }
};

export const calculateVacancyRate = async (propertyId: string): Promise<number> => {
  try {
    // Get all occupancy periods for the property
    const { data, error } = await supabase
      .from('property_occupancy_periods')
      .select('*')
      .eq('property_id', propertyId);

    if (error) {
      console.error('Error fetching property occupancy periods for vacancy calculation:', error);
      throw error;
    }
    
    // Calculate vacancy rate - Use the last 12 months
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const totalDays = 365;
    let occupiedDays = 0;
    
    // Count days that were occupied (not vacant) in the last year
    (data || []).forEach(period => {
      const occupancyType = period.occupancy_type as OccupancyType;
      if (occupancyType === 'vacant' || occupancyType === 'maintenance') {
        return; // Skip vacant and maintenance periods
      }
      
      const startDate = new Date(period.start_date);
      const endDate = period.end_date ? new Date(period.end_date) : today;
      
      // Only consider the part of the period that falls within the last year
      const effectiveStartDate = startDate > oneYearAgo ? startDate : oneYearAgo;
      const effectiveEndDate = endDate < today ? endDate : today;
      
      if (effectiveStartDate <= effectiveEndDate) {
        // Calculate days in this period
        const daysInPeriod = Math.floor((effectiveEndDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        occupiedDays += daysInPeriod;
      }
    });
    
    // Calculate vacancy rate
    const vacancyRate = ((totalDays - occupiedDays) / totalDays) * 100;
    
    // Update the property with the calculated vacancy rate
    const { error: updateError } = await supabase
      .from('properties')
      .update({ vacancy_rate: vacancyRate })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Error updating property vacancy rate:', updateError);
    }
    
    return vacancyRate;
  } catch (err) {
    console.error('Failed to calculate vacancy rate:', err);
    throw err;
  }
};
