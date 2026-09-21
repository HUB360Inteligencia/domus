/**
 * Participação societária: quanto de cada imóvel é realmente do titular.
 *
 * Esta é a única fonte da regra — a migration 20260921000300 guarda as linhas
 * cruas e deixa o cálculo aqui, para não haver duas versões da mesma conta.
 *
 * Regras, em ordem:
 *   1. Se o imóvel tem participações próprias, elas valem.
 *   2. Senão, valem as do loteamento a que ele pertence (herança).
 *   3. Sem nenhuma participação registrada, o imóvel é 100% do titular — assim
 *      ligar a visão "minha cota" não muda número nenhum até alguém cadastrar
 *      sócios.
 *
 * Dentro de um alvo:
 *   - Existe linha `is_self`: a fatia própria é o percentual dela.
 *   - Não existe: a fatia própria é 100 menos a soma das de terceiros. É o que
 *     as pessoas esperam ao cadastrar só "sócio João 50%" — sem isso a fatia
 *     própria daria 0 e zeraria todos os números do usuário.
 */

export interface OwnershipStake {
  id: string;
  user_id: string;
  client_id?: string | null;
  property_id?: string | null;
  development_id?: string | null;
  contact_id?: string | null;
  is_self: boolean;
  percentage: number;
  role?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/** Alvos possíveis de uma participação. */
export type StakeTarget =
  | { kind: 'property'; id: string }
  | { kind: 'development'; id: string };

export const FULL_SHARE = 100;

const sum = (stakes: OwnershipStake[]) =>
  stakes.reduce((total, stake) => total + (Number(stake.percentage) || 0), 0);

/**
 * Fatia própria (0–100) dentro de um conjunto de participações de um mesmo alvo.
 * Devolve null quando não há nenhuma — cabe a quem chama decidir herdar ou usar 100.
 */
export const selfPercentageOf = (stakes: OwnershipStake[]): number | null => {
  if (stakes.length === 0) return null;

  const own = stakes.filter((stake) => stake.is_self);
  if (own.length > 0) {
    return Math.min(sum(own), FULL_SHARE);
  }

  return Math.max(FULL_SHARE - sum(stakes), 0);
};

/** Soma das participações de terceiros, para a UI mostrar o que falta distribuir. */
export const partnersPercentageOf = (stakes: OwnershipStake[]): number =>
  sum(stakes.filter((stake) => !stake.is_self));

export interface StakeBalance {
  selfPercentage: number;
  partnersPercentage: number;
  total: number;
  /** true quando a soma passa de 100 — a UI avisa em vez de gravar algo inconsistente. */
  isOverAllocated: boolean;
  /** Quanto ainda pode ser distribuído. */
  remaining: number;
}

export const stakeBalanceOf = (stakes: OwnershipStake[]): StakeBalance => {
  const partnersPercentage = partnersPercentageOf(stakes);
  const selfPercentage = selfPercentageOf(stakes) ?? FULL_SHARE;
  const explicitTotal = sum(stakes);

  return {
    selfPercentage,
    partnersPercentage,
    total: explicitTotal,
    isOverAllocated: explicitTotal > FULL_SHARE,
    remaining: Math.max(FULL_SHARE - explicitTotal, 0),
  };
};

interface PropertyShareInput {
  id: string;
  development_id?: string | null;
}

/**
 * Fração (0–1) de cada imóvel que pertence ao titular, já resolvida a herança.
 * Uma consulta de participações serve todo o portfólio; não há N+1.
 */
export const buildShareMap = (
  properties: PropertyShareInput[],
  stakes: OwnershipStake[]
): Map<string, number> => {
  const byProperty = new Map<string, OwnershipStake[]>();
  const byDevelopment = new Map<string, OwnershipStake[]>();

  for (const stake of stakes) {
    const [key, bucket] = stake.property_id
      ? [stake.property_id, byProperty]
      : stake.development_id
        ? [stake.development_id, byDevelopment]
        : [null, null];

    if (!key || !bucket) continue;
    const existing = bucket.get(key);
    if (existing) existing.push(stake);
    else bucket.set(key, [stake]);
  }

  const shares = new Map<string, number>();

  for (const property of properties) {
    const own = selfPercentageOf(byProperty.get(property.id) ?? []);
    const inherited = property.development_id
      ? selfPercentageOf(byDevelopment.get(property.development_id) ?? [])
      : null;

    shares.set(property.id, (own ?? inherited ?? FULL_SHARE) / FULL_SHARE);
  }

  return shares;
};

export type OwnershipViewMode = 'gross' | 'mine';

/** Fração aplicável a um imóvel no modo escolhido. 1 no modo bruto. */
export const shareFactor = (
  mode: OwnershipViewMode,
  shares: Map<string, number>,
  propertyId?: string | null
): number => {
  if (mode === 'gross') return 1;
  if (!propertyId) return 1;
  return shares.get(propertyId) ?? 1;
};

/** true quando existe ao menos uma participação de terceiro — só então o alternador importa. */
export const hasPartners = (stakes: OwnershipStake[]): boolean =>
  stakes.some((stake) => !stake.is_self);
