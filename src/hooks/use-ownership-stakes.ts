import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createStake,
  deleteStake,
  fetchAllStakes,
  fetchStakes,
  updateStake,
  type StakeInput,
} from '@/api/ownership-stakes';
import { invalidateFinancialData } from '@/lib/query-invalidation';
import { stakeBalanceOf, type OwnershipStake, type StakeTarget } from '@/lib/ownership';

const targetKey = (target?: StakeTarget) => [
  'ownership-stakes',
  target?.kind ?? 'none',
  target?.id ?? 'none',
];

const allStakesKey = ['ownership-stakes-all'];

/** Participações de um imóvel ou loteamento, com o saldo já calculado. */
export const useOwnershipStakes = (target?: StakeTarget) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: targetKey(target),
    queryFn: () => fetchStakes(target!),
    enabled: !!target,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: targetKey(target) });
    // O mapa de cotas do portfólio e tudo que deriva dele mudam.
    queryClient.invalidateQueries({ queryKey: allStakesKey });
    invalidateFinancialData(queryClient);
  };

  const create = useMutation({
    mutationFn: (input: StakeInput) => createStake(target!, input),
    onSuccess: () => {
      invalidate();
      toast.success('Participação adicionada.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      changes,
    }: {
      id: string;
      changes: Partial<Pick<OwnershipStake, 'percentage' | 'role' | 'notes'>>;
    }) => updateStake(id, changes),
    onSuccess: () => {
      invalidate();
      toast.success('Participação atualizada.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStake(id),
    onSuccess: () => {
      invalidate();
      toast.success('Participação removida.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stakes = useMemo(() => query.data ?? [], [query.data]);
  const balance = useMemo(() => stakeBalanceOf(stakes), [stakes]);

  return {
    stakes,
    balance,
    isLoading: query.isLoading,
    addStake: create.mutateAsync,
    isAdding: create.isPending,
    updateStake: update.mutateAsync,
    isUpdating: update.isPending,
    removeStake: remove.mutateAsync,
    isRemoving: remove.isPending,
  };
};

/** Todas as participações do portfólio, base do mapa de cotas. */
export const useAllOwnershipStakes = (enabled = true) =>
  useQuery({
    queryKey: allStakesKey,
    queryFn: fetchAllStakes,
    enabled,
    // Muda pouco e é lido por vários painéis ao mesmo tempo.
    staleTime: 5 * 60 * 1000,
  });
