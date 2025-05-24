
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  related_to?: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  related_to?: string;
  related_id?: string;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.data.session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    throw err;
  }
};

export const createNotification = async (notificationData: CreateNotificationData): Promise<Notification> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notificationData,
        user_id: session.data.session.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Failed to create notification:', err);
    throw err;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    throw err;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.data.session.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
    throw err;
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to delete notification:', err);
    throw err;
  }
};

// Check for contract expiration and create notifications
export const checkContractExpirations = async (): Promise<void> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    // Get contracts expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, title, end_date, property_id')
      .eq('user_id', session.data.session.user.id)
      .eq('status', 'active')
      .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0]);

    if (error) throw error;

    // Create notifications for each expiring contract
    for (const contract of contracts || []) {
      const daysUntilExpiration = Math.ceil(
        (new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        // Check if notification already exists
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', session.data.session.user.id)
          .eq('related_to', 'contract')
          .eq('related_id', contract.id)
          .eq('type', 'warning')
          .single();

        if (!existingNotification) {
          await createNotification({
            title: 'Contrato próximo do vencimento',
            message: `O contrato "${contract.title}" vence em ${daysUntilExpiration} dias.`,
            type: 'warning',
            related_to: 'contract',
            related_id: contract.id
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to check contract expirations:', err);
    throw err;
  }
};
