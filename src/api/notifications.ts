
import { supabase } from "@/integrations/supabase/client";
import { Notification } from "@/types/contract";

/**
 * Fetches all notifications for the current user
 */
export const fetchNotifications = async (limit: number = 20): Promise<Notification[]> => {
  try {
    console.log(`Fetching up to ${limit} notifications...`);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.message);
    }

    console.log(`Notifications fetched successfully: ${data?.length || 0}`);
    return data || [];
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    throw err;
  }
};

/**
 * Creates a new notification
 */
export const createNotification = async (notification: {
  title: string;
  message: string;
  type: string;
  related_to?: string;
  related_id?: string;
}): Promise<Notification> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      ...notification,
      user_id: user.data.user.id,
      is_read: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error(error.message);
  }

  console.log('Notification created successfully:', data);
  return data;
};

/**
 * Marks a notification as read
 */
export const markNotificationAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error(error.message);
  }

  console.log(`Notification ${id} marked as read`);
};

/**
 * Marks all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error(error.message);
  }

  console.log('All notifications marked as read');
};

/**
 * Deletes a notification
 */
export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw new Error(error.message);
  }

  console.log(`Notification ${id} deleted`);
};
