import type { Property, PropertyStatus } from '@/types/property';

/**
 * Lote de loteamento.
 *
 * Um lote é uma linha de `properties` (tipo `land`) com `development_id`
 * preenchido — e não uma linha de `development_units`. Assim herda foto,
 * documento, contrato, avaliação, mapa e financeiro já existentes para imóveis.
 */
export type DevelopmentLot = Property;

/** Status que um lote assume no ciclo de venda. */
export const LOT_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'reserved', label: 'Reservado' },
  { value: 'sold', label: 'Vendido' },
];

export interface DevelopmentLotTotals {
  totalLots: number;
  soldLots: number;
  reservedLots: number;
  availableLots: number;
  totalLandArea: number;
  /** VGV: soma do valor de mercado de todos os lotes. */
  totalMarketValue: number;
  soldValue: number;
  /** Percentual do VGV já vendido. */
  soldPercentage: number;
}

export type LotPricingMode = 'per_square_meter' | 'fixed';

/** Parâmetros do assistente que cria vários lotes de uma vez. */
export interface LotBatchInput {
  /** Quadra, ex.: "A". Opcional para loteamentos sem quadras. */
  block?: string | null;
  firstNumber: number;
  lastNumber: number;
  landArea: number;
  pricingMode: LotPricingMode;
  /** Valor por m² quando pricingMode = 'per_square_meter'. */
  squareMeterValue?: number | null;
  /** Valor fechado do lote quando pricingMode = 'fixed'. */
  fixedValue?: number | null;
  status: PropertyStatus;
}

export const MAX_LOTS_PER_BATCH = 200;

/** Valor de mercado de um lote a partir dos parâmetros do assistente. */
export const lotValueFrom = (input: Pick<LotBatchInput, 'pricingMode' | 'squareMeterValue' | 'fixedValue' | 'landArea'>): number => {
  if (input.pricingMode === 'fixed') return Number(input.fixedValue) || 0;
  return (Number(input.squareMeterValue) || 0) * (Number(input.landArea) || 0);
};

/** Nome do lote, usado como título do imóvel: "Quadra A, Lote 12" ou "Lote 12". */
export const lotTitle = (block: string | null | undefined, number: number | string): string =>
  block ? `Quadra ${block}, Lote ${number}` : `Lote ${number}`;

export interface LotBatchValidation {
  errors: string[];
  count: number;
  unitValue: number;
  totalValue: number;
}

/** Valida o intervalo e devolve o que o formulário precisa mostrar na prévia. */
export const validateLotBatch = (input: LotBatchInput): LotBatchValidation => {
  const errors: string[] = [];
  const first = Number(input.firstNumber);
  const last = Number(input.lastNumber);

  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1) {
    errors.push('Informe a numeração inicial e final dos lotes.');
  } else if (last < first) {
    errors.push('A numeração final deve ser maior ou igual à inicial.');
  }

  const count = errors.length === 0 ? last - first + 1 : 0;
  if (count > MAX_LOTS_PER_BATCH) {
    errors.push(`Máximo de ${MAX_LOTS_PER_BATCH} lotes por vez (pedido: ${count}).`);
  }

  if (!(Number(input.landArea) > 0)) {
    errors.push('Informe a área padrão do lote.');
  }

  const unitValue = lotValueFrom(input);
  if (!(unitValue > 0)) {
    errors.push(
      input.pricingMode === 'fixed'
        ? 'Informe o valor do lote.'
        : 'Informe o valor por m².'
    );
  }

  return { errors, count, unitValue, totalValue: unitValue * count };
};
