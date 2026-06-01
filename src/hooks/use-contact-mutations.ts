import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createContact,
  updateContact,
  updateContactStatus,
  softDeleteContact,
} from '@/api/contacts';
import { Contact, ContactFormData, ContactStatus, STATUS_LABELS } from '@/types/contact';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useContactMutations = () => {
  const queryClient = useQueryClient();

  const invalidateAll = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['contact', id] });
  };

  const { mutateAsync: create, isPending: isCreating } = useMutation({
    mutationFn: (form: ContactFormData) => createContact(form),
    onSuccess: (contact: Contact) => {
      invalidateAll(contact.id);
      toast.success('Contato criado com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao criar contato: ${errorMessage(error)}`);
    },
  });

  const { mutateAsync: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, form }: { id: string; form: ContactFormData }) =>
      updateContact(id, form),
    onSuccess: (contact: Contact) => {
      invalidateAll(contact.id);
      toast.success('Contato atualizado com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao atualizar contato: ${errorMessage(error)}`);
    },
  });

  const { mutateAsync: changeStatus, isPending: isChangingStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      updateContactStatus(id, status),
    onSuccess: (_, variables) => {
      invalidateAll(variables.id);
      toast.success(`Status alterado para: ${STATUS_LABELS[variables.status]}`);
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao alterar status: ${errorMessage(error)}`);
    },
  });

  const { mutateAsync: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => softDeleteContact(id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Contato inativado com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao inativar contato: ${errorMessage(error)}`);
    },
  });

  return {
    createContact: create,
    updateContact: update,
    changeContactStatus: changeStatus,
    deleteContact: remove,
    isCreating,
    isUpdating,
    isChangingStatus,
    isDeleting,
    isLoading: isCreating || isUpdating || isChangingStatus || isDeleting,
  };
};
