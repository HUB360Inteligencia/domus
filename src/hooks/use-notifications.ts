
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";
import { 
  fetchNotifications, 
  createNotification, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  checkContractExpirations,
  Notification,
  CreateNotificationData
} from '@/api/notifications';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createNotificationMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação criada com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Error creating notification:', error);
      toast.error(`Erro ao criar notificação: ${error.message}`);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      logger.error('Error marking notification as read:', error);
      toast.error(`Erro ao marcar como lida: ${error.message}`);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações foram marcadas como lidas!');
    },
    onError: (error: Error) => {
      logger.error('Error marking all notifications as read:', error);
      toast.error(`Erro ao marcar todas como lidas: ${error.message}`);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação excluída com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Error deleting notification:', error);
      toast.error(`Erro ao excluir notificação: ${error.message}`);
    },
  });

  const checkExpirationsMutation = useMutation({
    mutationFn: checkContractExpirations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      logger.error('Error checking contract expirations:', error);
    },
  });

  const addNotification = useCallback(
    async (data: CreateNotificationData) => {
      try {
        await createNotificationMutation.mutateAsync(data);
        return true;
      } catch (error) {
        logger.error('Error adding notification:', error);
        return false;
      }
    },
    [createNotificationMutation]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsReadMutation.mutateAsync(notificationId);
        return true;
      } catch (error) {
        logger.error('Error marking as read:', error);
        return false;
      }
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(
    async () => {
      try {
        await markAllAsReadMutation.mutateAsync();
        return true;
      } catch (error) {
        logger.error('Error marking all as read:', error);
        return false;
      }
    },
    [markAllAsReadMutation]
  );

  const deleteNotificationById = useCallback(
    async (notificationId: string) => {
      try {
        await deleteNotificationMutation.mutateAsync(notificationId);
        return true;
      } catch (error) {
        logger.error('Error deleting notification:', error);
        return false;
      }
    },
    [deleteNotificationMutation]
  );

  const checkExpirations = useCallback(
    async () => {
      try {
        await checkExpirationsMutation.mutateAsync();
        return true;
      } catch (error) {
        logger.error('Error checking expirations:', error);
        return false;
      }
    },
    [checkExpirationsMutation]
  );

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    isCreating: createNotificationMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isCheckingExpirations: checkExpirationsMutation.isPending,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationById,
    checkExpirations,
    refetchNotifications,
  };
};
