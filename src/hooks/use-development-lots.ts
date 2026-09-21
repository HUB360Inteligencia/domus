import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createLotBatch,
  fetchDevelopmentLotTotals,
  fetchDevelopmentLots,
  setPropertyDevelopment,
  updateLotStatus,
} from '@/api/development-lots';
import { invalidateFinancialData } from '@/lib/query-invalidation';
import type { Development } from '@/types/development';
import type { PropertyStatus } from '@/types/property';
import type { DevelopmentLot, LotBatchInput } from '@/types/development-lot';

const lotsKey = (developmentId: string) => ['development-lots', developmentId];
const totalsKey = (developmentId: string) => ['development-lot-totals', developmentId];

export interface LotGroup {
  /** null = lotes sem quadra informada. */
  block: string | null;
  lots: DevelopmentLot[];
}

/** Agrupa por quadra e ordena os lotes numericamente dentro de cada uma. */
export const groupLotsByBlock = (lots: DevelopmentLot[]): LotGroup[] => {
  const groups = new Map<string, DevelopmentLot[]>();

  for (const lot of lots) {
    const key = lot.block?.trim() || '';
    const bucket = groups.get(key);
    if (bucket) bucket.push(lot);
    else groups.set(key, [lot]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      // Lotes sem quadra vão para o fim.
      if (a === '') return 1;
      if (b === '') return -1;
      return a.localeCompare(b, 'pt-BR', { numeric: true });
    })
    .map(([block, lots]) => ({
      block: block === '' ? null : block,
      lots: lots
        .slice()
        .sort((x, y) =>
          String(x.property_number ?? '').localeCompare(String(y.property_number ?? ''), 'pt-BR', {
            numeric: true,
          })
        ),
    }));
};

export const useDevelopmentLots = (developmentId?: string) => {
  const queryClient = useQueryClient();

  const lotsQuery = useQuery({
    queryKey: lotsKey(developmentId || ''),
    queryFn: () => fetchDevelopmentLots(developmentId!),
    enabled: !!developmentId,
  });

  const totalsQuery = useQuery({
    queryKey: totalsKey(developmentId || ''),
    queryFn: () => fetchDevelopmentLotTotals(developmentId!),
    enabled: !!developmentId,
  });

  const invalidate = () => {
    if (developmentId) {
      queryClient.invalidateQueries({ queryKey: lotsKey(developmentId) });
      queryClient.invalidateQueries({ queryKey: totalsKey(developmentId) });
    }
    // Lotes são imóveis: a lista, o mapa e os números do portfólio mudam.
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    invalidateFinancialData(queryClient);
  };

  const generateLots = useMutation({
    mutationFn: ({ development, input }: { development: Development; input: LotBatchInput }) =>
      createLotBatch(development, input),
    onSuccess: ({ created, skipped }) => {
      invalidate();
      if (created === 0) {
        toast.info('Nenhum lote novo: a numeração informada já existe.');
        return;
      }
      toast.success(
        skipped.length === 0
          ? `${created} ${created === 1 ? 'lote criado' : 'lotes criados'}.`
          : `${created} lotes criados. ${skipped.length} já existiam e foram mantidos.`
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeLotStatus = useMutation({
    mutationFn: ({ propertyId, status }: { propertyId: string; status: PropertyStatus }) =>
      updateLotStatus(propertyId, status),
    onSuccess: () => {
      invalidate();
      toast.success('Situação do lote atualizada.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const unlinkLot = useMutation({
    mutationFn: (propertyId: string) => setPropertyDevelopment(propertyId, null),
    onSuccess: () => {
      invalidate();
      toast.success('Imóvel desvinculado do loteamento.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const linkProperty = useMutation({
    mutationFn: (propertyId: string) => setPropertyDevelopment(propertyId, developmentId!),
    onSuccess: () => {
      invalidate();
      toast.success('Imóvel vinculado ao loteamento.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const lots = useMemo(() => lotsQuery.data ?? [], [lotsQuery.data]);
  const groups = useMemo(() => groupLotsByBlock(lots), [lots]);

  return {
    lots,
    groups,
    totals: totalsQuery.data,
    isLoading: lotsQuery.isLoading,
    error: lotsQuery.error,
    generateLots: generateLots.mutateAsync,
    isGenerating: generateLots.isPending,
    changeLotStatus: changeLotStatus.mutateAsync,
    isChangingStatus: changeLotStatus.isPending,
    unlinkLot: unlinkLot.mutateAsync,
    linkProperty: linkProperty.mutateAsync,
    isLinking: linkProperty.isPending,
  };
};
