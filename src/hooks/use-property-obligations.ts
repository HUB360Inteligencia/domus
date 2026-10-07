import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createObligation,
  deleteObligation,
  fetchPropertyObligations,
  generateObligationInstallments,
  recordObligationPayment,
  setObligationStatus,
  updateObligation,
  updateObligationInstallment,
  type RecordObligationPaymentOptions,
} from '@/api/property-obligations';
import { invalidateFinancialData } from '@/lib/query-invalidation';
import { isObligationInstallmentOverdue, summarizeObligations } from '@/lib/property-obligations';
import type {
  ObligationInput,
  ObligationStatus,
  PropertyObligationWithInstallments,
} from '@/types/property-obligation';

const queryKey = (propertyId: string) => ['property-obligations', propertyId];

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const usePropertyObligations = (propertyId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKey(propertyId || ''),
    queryFn: () => fetchPropertyObligations(propertyId!),
    enabled: !!propertyId,
  });

  const invalidate = () => {
    if (propertyId) queryClient.invalidateQueries({ queryKey: queryKey(propertyId) });
    // Baixas criam despesa; vencimentos mudam a agenda, o painel e os avisos.
    invalidateFinancialData(queryClient);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const create = useMutation({
    mutationFn: (input: ObligationInput) => createObligation(propertyId!, input),
    onSuccess: ({ generated }) => {
      invalidate();
      toast.success(`Conta cadastrada. ${plural(generated, 'vencimento gerado', 'vencimentos gerados')}.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ObligationInput }) => updateObligation(id, input),
    onSuccess: () => {
      invalidate();
      toast.success('Conta atualizada. Vencimentos em aberto recalculados.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ObligationStatus }) => setObligationStatus(id, status),
    onSuccess: (_data, { status }) => {
      invalidate();
      toast.success(
        status === 'active' ? 'Conta reativada.' : status === 'paused' ? 'Conta pausada.' : 'Conta encerrada.'
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteObligation(id),
    onSuccess: () => {
      invalidate();
      toast.success('Conta excluída. Despesas já lançadas continuam no financeiro.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const regenerate = useMutation({
    mutationFn: (id: string) => generateObligationInstallments(id, true),
    onSuccess: (count) => {
      invalidate();
      toast.success(count === 0 ? 'Nada a gerar.' : `${plural(count, 'vencimento gerado', 'vencimentos gerados')}.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const record = useMutation({
    mutationFn: ({ id, ...options }: { id: string } & RecordObligationPaymentOptions) =>
      recordObligationPayment(id, options),
    onSuccess: (transactionId) => {
      invalidate();
      toast.success(transactionId ? 'Pagamento registrado. Despesa lançada no financeiro.' : 'Pagamento confirmado.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  /**
   * Baixa em lote dos vencidos, com a data do próprio vencimento. Serve para quem
   * cadastra uma conta no meio do ano e já pagou as parcelas anteriores.
   */
  const settleOverdue = useMutation({
    mutationFn: async ({
      obligation,
      createTransaction,
    }: {
      obligation: PropertyObligationWithInstallments;
      createTransaction: boolean;
    }) => {
      const overdue = obligation.installments.filter((installment) => isObligationInstallmentOverdue(installment));
      // Em sequência: cada baixa trava a linha e pode criar categoria — paralelo só arrisca duplicar.
      for (const installment of overdue) {
        await recordObligationPayment(installment.id, {
          paidDate: installment.due_date,
          createTransaction,
        });
      }
      return overdue.length;
    },
    onSuccess: (count) => {
      invalidate();
      toast.success(`${plural(count, 'vencimento baixado', 'vencimentos baixados')}.`);
    },
    onError: (error: Error) => {
      invalidate();
      toast.error(error.message);
    },
  });

  const changeInstallmentStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'cancelled' }) =>
      updateObligationInstallment(id, { status }),
    onSuccess: (_data, { status }) => {
      invalidate();
      toast.success(status === 'cancelled' ? 'Vencimento cancelado.' : 'Vencimento reativado.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const obligations = useMemo(() => query.data ?? [], [query.data]);
  const summary = useMemo(() => summarizeObligations(obligations), [obligations]);

  return {
    obligations,
    summary,
    isLoading: query.isLoading,
    error: query.error,
    createObligation: create.mutateAsync,
    isCreating: create.isPending,
    updateObligation: update.mutateAsync,
    isUpdating: update.isPending,
    changeStatus: changeStatus.mutateAsync,
    removeObligation: remove.mutateAsync,
    regenerate: regenerate.mutateAsync,
    isRegenerating: regenerate.isPending,
    recordPayment: record.mutateAsync,
    isRecording: record.isPending,
    settleOverdue: settleOverdue.mutateAsync,
    isSettlingOverdue: settleOverdue.isPending,
    changeInstallmentStatus: changeInstallmentStatus.mutateAsync,
  };
};
