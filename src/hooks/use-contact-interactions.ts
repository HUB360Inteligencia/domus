import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchContactInteractions,
  createContactInteraction,
  softDeleteContactInteraction,
  InteractionInput,
} from '@/api/contact-interactions';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useContactInteractions = (contactId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contact-interactions', contactId],
    queryFn: () => fetchContactInteractions(contactId || ''),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['contact-interactions', contactId] });

  const create = useMutation({
    mutationFn: (input: InteractionInput) => createContactInteraction(input),
    onSuccess: () => {
      invalidate();
      toast.success('Interação registrada!');
    },
    onError: (e: unknown) => toast.error(`Erro ao registrar interação: ${errorMessage(e)}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteContactInteraction(id),
    onSuccess: () => {
      invalidate();
      toast.success('Interação removida.');
    },
    onError: (e: unknown) => toast.error(`Erro ao remover interação: ${errorMessage(e)}`),
  });

  return {
    interactions: query.data ?? [],
    isLoading: query.isLoading,
    createInteraction: create.mutateAsync,
    isCreating: create.isPending,
    deleteInteraction: remove.mutateAsync,
  };
};
