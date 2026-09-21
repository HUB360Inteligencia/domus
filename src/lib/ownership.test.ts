import { describe, expect, it } from 'vitest';
import {
  buildShareMap,
  hasPartners,
  partnersPercentageOf,
  selfPercentageOf,
  shareFactor,
  stakeBalanceOf,
  type OwnershipStake,
} from './ownership';

let seq = 0;
const stake = (overrides: Partial<OwnershipStake>): OwnershipStake => ({
  id: `stake-${(seq += 1)}`,
  user_id: 'user-1',
  is_self: false,
  percentage: 50,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('selfPercentageOf', () => {
  it('devolve null sem participações, para quem chama decidir herdar', () => {
    expect(selfPercentageOf([])).toBeNull();
  });

  it('usa a linha própria quando ela existe', () => {
    const result = selfPercentageOf([
      stake({ is_self: true, percentage: 60 }),
      stake({ contact_id: 'c1', percentage: 40 }),
    ]);

    expect(result).toBe(60);
  });

  it('deduz a fatia própria quando só os sócios foram cadastrados', () => {
    // Caso real: a pessoa cadastra "sócio João 50%" e nada mais.
    expect(selfPercentageOf([stake({ contact_id: 'c1', percentage: 50 })])).toBe(50);
  });

  it('deduz corretamente com vários sócios', () => {
    const result = selfPercentageOf([
      stake({ contact_id: 'c1', percentage: 30 }),
      stake({ contact_id: 'c2', percentage: 25 }),
    ]);

    expect(result).toBe(45);
  });

  it('não devolve fatia negativa quando os sócios passam de 100', () => {
    const result = selfPercentageOf([
      stake({ contact_id: 'c1', percentage: 80 }),
      stake({ contact_id: 'c2', percentage: 50 }),
    ]);

    expect(result).toBe(0);
  });

  it('limita a fatia própria a 100', () => {
    expect(selfPercentageOf([stake({ is_self: true, percentage: 100 })])).toBe(100);
  });
});

describe('partnersPercentageOf', () => {
  it('soma só as participações de terceiros', () => {
    const total = partnersPercentageOf([
      stake({ is_self: true, percentage: 40 }),
      stake({ contact_id: 'c1', percentage: 35 }),
      stake({ contact_id: 'c2', percentage: 25 }),
    ]);

    expect(total).toBe(60);
  });
});

describe('stakeBalanceOf', () => {
  it('aponta excesso quando a soma passa de 100', () => {
    const balance = stakeBalanceOf([
      stake({ is_self: true, percentage: 70 }),
      stake({ contact_id: 'c1', percentage: 50 }),
    ]);

    expect(balance.total).toBe(120);
    expect(balance.isOverAllocated).toBe(true);
    expect(balance.remaining).toBe(0);
  });

  it('informa quanto falta distribuir', () => {
    const balance = stakeBalanceOf([
      stake({ is_self: true, percentage: 50 }),
      stake({ contact_id: 'c1', percentage: 20 }),
    ]);

    expect(balance.remaining).toBe(30);
    expect(balance.isOverAllocated).toBe(false);
    expect(balance.selfPercentage).toBe(50);
  });

  it('trata alvo sem participações como 100% próprio', () => {
    const balance = stakeBalanceOf([]);

    expect(balance.selfPercentage).toBe(100);
    expect(balance.partnersPercentage).toBe(0);
    expect(balance.isOverAllocated).toBe(false);
  });
});

describe('buildShareMap', () => {
  const properties = [
    { id: 'p-solo' },
    { id: 'p-lote-1', development_id: 'dev-1' },
    { id: 'p-lote-2', development_id: 'dev-1' },
    { id: 'p-lote-3', development_id: 'dev-2' },
  ];

  it('usa 100% para imóvel sem nenhuma participação registrada', () => {
    const shares = buildShareMap(properties, []);

    expect(shares.get('p-solo')).toBe(1);
    expect(shares.get('p-lote-1')).toBe(1);
  });

  it('herda a participação do loteamento nos lotes', () => {
    const shares = buildShareMap(properties, [
      stake({ development_id: 'dev-1', contact_id: 'c1', percentage: 50 }),
    ]);

    expect(shares.get('p-lote-1')).toBe(0.5);
    expect(shares.get('p-lote-2')).toBe(0.5);
    // Outro loteamento e imóvel solto não são afetados.
    expect(shares.get('p-lote-3')).toBe(1);
    expect(shares.get('p-solo')).toBe(1);
  });

  it('participação do próprio lote prevalece sobre a herdada', () => {
    const shares = buildShareMap(properties, [
      stake({ development_id: 'dev-1', contact_id: 'c1', percentage: 50 }),
      stake({ property_id: 'p-lote-2', is_self: true, percentage: 100 }),
    ]);

    expect(shares.get('p-lote-1')).toBe(0.5);
    expect(shares.get('p-lote-2')).toBe(1);
  });

  it('ignora participações sem alvo', () => {
    const shares = buildShareMap(properties, [stake({ contact_id: 'c1', percentage: 50 })]);

    expect(shares.get('p-solo')).toBe(1);
  });
});

describe('shareFactor', () => {
  const shares = new Map([['p-1', 0.5]]);

  it('não escala nada no modo bruto', () => {
    expect(shareFactor('gross', shares, 'p-1')).toBe(1);
  });

  it('aplica a fração no modo minha cota', () => {
    expect(shareFactor('mine', shares, 'p-1')).toBe(0.5);
  });

  it('usa 1 para imóvel desconhecido ou transação sem imóvel', () => {
    expect(shareFactor('mine', shares, 'p-desconhecido')).toBe(1);
    expect(shareFactor('mine', shares, null)).toBe(1);
  });
});

describe('hasPartners', () => {
  it('só considera sócio de terceiro', () => {
    expect(hasPartners([stake({ is_self: true, percentage: 100 })])).toBe(false);
    expect(hasPartners([stake({ contact_id: 'c1', percentage: 10 })])).toBe(true);
    expect(hasPartners([])).toBe(false);
  });
});
