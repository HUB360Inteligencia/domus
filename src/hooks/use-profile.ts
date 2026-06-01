import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useProfile() {
  const { user, updateProfile } = useAuth();

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Cache-bust so the browser reloads the new image
      const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      await updateProfile({ avatar_url: avatarUrl });
      return avatarUrl;
    },
    onSuccess: () => {
      toast.success('Foto de perfil atualizada!');
    },
    onError: (error: Error) => {
      logger.error('Error uploading avatar:', error);
      toast.error('Erro ao atualizar foto de perfil');
    },
  });

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data: files } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filePaths);
      }

      await updateProfile({ avatar_url: null });
    },
    onSuccess: () => {
      toast.success('Foto de perfil removida');
    },
    onError: (error: Error) => {
      logger.error('Error removing avatar:', error);
      toast.error('Erro ao remover foto de perfil');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { first_name: string; last_name: string }) => {
      await updateProfile(data);
    },
    onError: (error: Error) => {
      logger.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      if (!user?.email) throw new Error('Email não disponível');

      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Senha atual incorreta');

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
    },
    onError: (error: Error) => {
      logger.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    },
  });

  const sendResetEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email de redefinição enviado! Verifique sua caixa de entrada.');
    },
    onError: (error: Error) => {
      logger.error('Error sending reset email:', error);
      toast.error('Erro ao enviar email de redefinição');
    },
  });

  return {
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    removeAvatar: removeAvatarMutation.mutateAsync,
    isRemovingAvatar: removeAvatarMutation.isPending,
    updateProfileInfo: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    sendResetEmail: sendResetEmailMutation.mutateAsync,
    isSendingResetEmail: sendResetEmailMutation.isPending,
  };
}
