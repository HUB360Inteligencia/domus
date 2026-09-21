import { describe, expect, it, vi } from 'vitest';

// O hook importa a API, que carrega o client do Supabase (precisa de localStorage).
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { groupLotsByBlock } from './use-development-lots';
import type { DevelopmentLot } from '@/types/development-lot';

const lot = (block: string | null, number: string): DevelopmentLot =>
  ({
    id: `${block ?? 'sem'}-${number}`,
    block,
    property_number: number,
    title: `Lote ${number}`,
    status: 'available',
    type: 'land',
  }) as DevelopmentLot;

describe('groupLotsByBlock', () => {
  it('agrupa por quadra e ordena as quadras alfabeticamente', () => {
    const groups = groupLotsByBlock([lot('B', '1'), lot('A', '1'), lot('B', '2')]);

    expect(groups.map((group) => group.block)).toEqual(['A', 'B']);
    expect(groups[1].lots).toHaveLength(2);
  });

  it('ordena lotes numericamente, não como texto', () => {
    const groups = groupLotsByBlock([lot('A', '10'), lot('A', '2'), lot('A', '1')]);

    expect(groups[0].lots.map((l) => l.property_number)).toEqual(['1', '2', '10']);
  });

  it('ordena quadras com número embutido de forma natural', () => {
    const groups = groupLotsByBlock([lot('Q10', '1'), lot('Q2', '1')]);

    expect(groups.map((group) => group.block)).toEqual(['Q2', 'Q10']);
  });

  it('joga lotes sem quadra para o fim, num grupo próprio', () => {
    const groups = groupLotsByBlock([lot(null, '5'), lot('A', '1'), lot('', '6')]);

    expect(groups.map((group) => group.block)).toEqual(['A', null]);
    // Strings vazias e null caem no mesmo grupo "sem quadra".
    expect(groups[1].lots).toHaveLength(2);
  });

  it('devolve lista vazia sem lotes', () => {
    expect(groupLotsByBlock([])).toEqual([]);
  });
});
