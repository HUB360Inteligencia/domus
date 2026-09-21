import { describe, expect, it } from 'vitest';
import {
  MAX_LOTS_PER_BATCH,
  lotTitle,
  lotValueFrom,
  validateLotBatch,
  type LotBatchInput,
} from './development-lot';

const base: LotBatchInput = {
  block: 'A',
  firstNumber: 1,
  lastNumber: 10,
  landArea: 300,
  pricingMode: 'per_square_meter',
  squareMeterValue: 500,
  fixedValue: null,
  status: 'available',
};

describe('lotValueFrom', () => {
  it('multiplica área por valor do m²', () => {
    expect(lotValueFrom(base)).toBe(150_000);
  });

  it('usa o valor fechado quando o modo é fixo, ignorando o valor por m²', () => {
    expect(lotValueFrom({ ...base, pricingMode: 'fixed', fixedValue: 120_000 })).toBe(120_000);
  });

  it('devolve 0 quando falta o valor, em vez de NaN', () => {
    expect(lotValueFrom({ ...base, squareMeterValue: null })).toBe(0);
    expect(lotValueFrom({ ...base, pricingMode: 'fixed', fixedValue: null })).toBe(0);
  });
});

describe('lotTitle', () => {
  it('inclui a quadra quando informada', () => {
    expect(lotTitle('A', 12)).toBe('Quadra A, Lote 12');
  });

  it('omite a quadra quando ausente', () => {
    expect(lotTitle(null, 12)).toBe('Lote 12');
    expect(lotTitle('', 12)).toBe('Lote 12');
  });
});

describe('validateLotBatch', () => {
  it('aceita um intervalo válido e calcula a prévia', () => {
    const result = validateLotBatch(base);

    expect(result.errors).toEqual([]);
    expect(result.count).toBe(10);
    expect(result.unitValue).toBe(150_000);
    expect(result.totalValue).toBe(1_500_000);
  });

  it('conta intervalo de um único lote', () => {
    const result = validateLotBatch({ ...base, firstNumber: 7, lastNumber: 7 });

    expect(result.errors).toEqual([]);
    expect(result.count).toBe(1);
  });

  it('recusa intervalo invertido', () => {
    const result = validateLotBatch({ ...base, firstNumber: 20, lastNumber: 5 });

    expect(result.errors).toContain('A numeração final deve ser maior ou igual à inicial.');
    expect(result.count).toBe(0);
  });

  it('recusa intervalo acima do limite por vez', () => {
    const result = validateLotBatch({ ...base, firstNumber: 1, lastNumber: MAX_LOTS_PER_BATCH + 1 });

    expect(result.errors.some((message) => message.includes(String(MAX_LOTS_PER_BATCH)))).toBe(true);
  });

  it('exige área e preço', () => {
    const result = validateLotBatch({ ...base, landArea: 0, squareMeterValue: 0 });

    expect(result.errors).toContain('Informe a área padrão do lote.');
    expect(result.errors).toContain('Informe o valor por m².');
  });

  it('cobra o valor do lote, não o do m², quando o modo é fixo', () => {
    const result = validateLotBatch({ ...base, pricingMode: 'fixed', fixedValue: 0 });

    expect(result.errors).toContain('Informe o valor do lote.');
  });
});
