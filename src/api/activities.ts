
import { supabase } from '@/integrations/supabase/client';
import { Activity, ActivityFormData, ActivityStatus } from '@/types/activity';

import { logger } from "@/lib/logger";
// Fetch all activities for the current user
export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching activities:', error);
    throw new Error(error.message);
  }

  return data as Activity[];
}

// Fetch a single activity by id
export async function fetchActivityById(id: string): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error(`Error fetching activity with id ${id}:`, error);
    throw new Error(error.message);
  }

  return data as Activity;
}

// Fetch activities for a specific property
export async function fetchActivitiesByProperty(propertyId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error(`Error fetching activities for property ${propertyId}:`, error);
    throw new Error(error.message);
  }

  return data as Activity[];
}

// Fetch activities for a specific contract
export async function fetchActivitiesByContract(contractId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error(`Error fetching activities for contract ${contractId}:`, error);
    throw new Error(error.message);
  }

  return data as Activity[];
}

// Create a new activity
export async function createActivity(data: ActivityFormData): Promise<Activity> {
  // Get the current user's ID
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    logger.error('Error getting current user:', userError);
    throw new Error(userError.message);
  }
  
  // Add the user_id to the data
  const activityData = {
    ...data,
    user_id: userData.user.id
  };
  
  const { data: newActivity, error } = await supabase
    .from('activities')
    .insert(activityData)
    .select()
    .single();

  if (error) {
    logger.error('Error creating activity:', error);
    throw new Error(error.message);
  }

  return newActivity as Activity;
}

// Update an existing activity
export async function updateActivity({ id, data }: { id: string; data: Partial<ActivityFormData> }): Promise<Activity> {
  const { data: updatedActivity, error } = await supabase
    .from('activities')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Error updating activity ${id}:`, error);
    throw new Error(error.message);
  }

  return updatedActivity as Activity;
}

// Update only the status of an activity
export async function updateActivityStatus(id: string, status: ActivityStatus): Promise<Activity> {
  const { data: updatedActivity, error } = await supabase
    .from('activities')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Error updating activity status ${id}:`, error);
    throw new Error(error.message);
  }

  return updatedActivity as Activity;
}

// Delete an activity
export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error(`Error deleting activity ${id}:`, error);
    throw new Error(error.message);
  }
}

// Convert an activity to an expense
export async function convertActivityToExpense(activityId: string): Promise<{ expenseId: string }> {
  // This would typically be a server-side function, but for now we'll simulate it
  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .single();

  if (!activity) {
    throw new Error('Activity not found');
  }

  // Create an expense from the activity data
  const { data: expense, error } = await supabase
    .from('property_expenses')
    .insert([{
      property_id: activity.property_id,
      amount: activity.actual_cost || activity.estimated_cost || 0,
      expense_type: 'maintenance',
      description: `${activity.title} - ${activity.description || ''}`,
      paid_at: new Date().toISOString().split('T')[0],
      maintenance_details: activity.responsible_notes
    }])
    .select()
    .single();

  if (error) {
    logger.error('Error creating expense from activity:', error);
    throw new Error(error.message);
  }

  // Update the activity with the expense_id
  await supabase
    .from('activities')
    .update({ 
      expense_id: expense.id,
      status: 'completed' as ActivityStatus,
      completed_at: new Date().toISOString()
    })
    .eq('id', activityId);

  return { expenseId: expense.id };
}
