
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { developmentsApi } from '@/api/developments';
import { DevelopmentFormData } from '@/types/development';
import { toast } from 'sonner';

import { logger } from "@/lib/logger";
export const useDevelopments = () => {
  return useQuery({
    queryKey: ['developments'],
    queryFn: developmentsApi.getDevelopments,
  });
};

export const useDevelopment = (id: string) => {
  return useQuery({
    queryKey: ['development', id],
    queryFn: () => developmentsApi.getDevelopment(id),
    enabled: !!id,
  });
};

export const useCreateDevelopment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: developmentsApi.createDevelopment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developments'] });
      toast.success('Empreendimento criado com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao criar empreendimento:', error);
      toast.error('Erro ao criar empreendimento');
    },
  });
};

export const useUpdateDevelopment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DevelopmentFormData> }) =>
      developmentsApi.updateDevelopment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['developments'] });
      queryClient.invalidateQueries({ queryKey: ['development', id] });
      toast.success('Empreendimento atualizado com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao atualizar empreendimento:', error);
      toast.error('Erro ao atualizar empreendimento');
    },
  });
};

export const useDeleteDevelopment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: developmentsApi.deleteDevelopment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developments'] });
      toast.success('Empreendimento excluído com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao excluir empreendimento:', error);
      toast.error('Erro ao excluir empreendimento');
    },
  });
};
