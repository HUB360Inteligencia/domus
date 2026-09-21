import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deletePurchaseSchedule,
  fetchPurchaseInstallments,
  generatePurchaseInstallments,
  recordPurchaseInstallment,
  setPurchaseInstallmentStatus,
  updatePurchaseInstallment,
} from '@/api/property-purchase-installments';
import { invalidateFinancialData } from '@/lib/query-invalidation';
import { parseDateOnly, toDateOnlyString } from '@/lib/dates';
import type {
  PropertyPurchaseInstallment,
  PurchaseScheduleSummary,
} from '@/types/property-purchase';

const queryKey = (propertyId: string) => ['property-purchase-installments', propertyId];

/** Vencida = pendente com vencimento anterior a hoje. O status no banco não expira sozinho. */
export const isInstallmentOverdue = (installment: PropertyPurchaseInstallment): boolean => {
  if (installment.status !== 'pending') return false;
  return toDateOnlyString(parseDateOnly(installment.due_date)) < toDateOnlyString();
};

export const summarizeSchedule = (
  installments: PropertyPurchaseInstallment[]
): PurchaseScheduleSummary => {
  const summary: PurchaseScheduleSummary = {
    total: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  };

  const pending: PropertyPurchaseInstallment[] = [];

  for (const item of installments) {
    if (item.status === 'cancelled') continue;

    summary.total += Number(item.amount) || 0;

    if (item.status === 'paid') {
      summary.paidAmount += Number(item.amount) || 0;
      summary.paidCount += 1;
      continue;
    }

    summary.pendingAmount += Number(item.amount) || 0;
    summary.pendingCount += 1;
    pending.push(item);

    if (isInstallmentOverdue(item)) {
      summary.overdueAmount += Number(item.amount) || 0;
      summary.overdueCount += 1;
    }
  }

  summary.nextDue = pending
    .slice()
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  return summary;
};

export const usePropertyPurchaseInstallments = (propertyId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKey(propertyId || ''),
    queryFn: () => fetchPurchaseInstallments(propertyId!),
    enabled: !!propertyId,
  });

  const invalidate = () => {
    if (propertyId) {
      queryClient.invalidateQueries({ queryKey: queryKey(propertyId) });
    }
    // A baixa cria despesa: dashboard, analytics do imóvel e agenda mudam também.
    invalidateFinancialData(queryClient);
  };

  const generate = useMutation({
    mutationFn: () => generatePurchaseInstallments(propertyId!),
    onSuccess: (count) => {
      invalidate();
      toast.success(
        count === 0
          ? 'Nenhuma parcela a gerar. Confira a condição de pagamento.'
          : `${count} ${count === 1 ? 'parcela gerada' : 'parcelas geradas'}.`
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const record = useMutation({
    mutationFn: ({
      id,
      paidDate,
      paymentMethod,
    }: {
      id: string;
      paidDate?: string;
      paymentMethod?: string | null;
    }) => recordPurchaseInstallment(id, { paidDate, paymentMethod }),
    onSuccess: () => {
      invalidate();
      toast.success('Parcela paga. Despesa lançada no financeiro.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      changes,
    }: {
      id: string;
      changes: Partial<Pick<PropertyPurchaseInstallment, 'amount' | 'due_date' | 'notes'>>;
    }) => updatePurchaseInstallment(id, changes),
    onSuccess: () => {
      invalidate();
      toast.success('Parcela atualizada.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'cancelled' }) =>
      setPurchaseInstallmentStatus(id, status),
    onSuccess: (_data, { status }) => {
      invalidate();
      toast.success(status === 'cancelled' ? 'Parcela cancelada.' : 'Parcela reativada.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clear = useMutation({
    mutationFn: () => deletePurchaseSchedule(propertyId!),
    onSuccess: () => {
      invalidate();
      toast.success('Cronograma excluído.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const installments = useMemo(() => query.data ?? [], [query.data]);
  const summary = useMemo(() => summarizeSchedule(installments), [installments]);

  return {
    installments,
    summary,
    isLoading: query.isLoading,
    error: query.error,
    generateSchedule: generate.mutateAsync,
    isGenerating: generate.isPending,
    recordPayment: record.mutateAsync,
    isRecording: record.isPending,
    updateInstallment: update.mutateAsync,
    isUpdating: update.isPending,
    changeStatus: changeStatus.mutateAsync,
    isChangingStatus: changeStatus.isPending,
    clearSchedule: clear.mutateAsync,
    isClearing: clear.isPending,
  };
};
