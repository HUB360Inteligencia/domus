import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserClientId } from '@/api/client-users';
import { logger } from '@/lib/logger';
import { toPurchaseTerms } from '@/types/property-purchase';
import type { Property, PropertyStatus } from '@/types/property';
import type { Development } from '@/types/development';
import {
  lotTitle,
  lotValueFrom,
  validateLotBatch,
  type DevelopmentLot,
  type DevelopmentLotTotals,
  type LotBatchInput,
} from '@/types/development-lot';

/**
 * A migration 20260921000200 pode não ter sido aplicada ao banco remoto ainda
 * (ver docs de migrations manuais); nesse caso a UI avisa em vez de estourar.
 */
const MISSING_SCHEMA_CODES = ['42703', '42P01', 'PGRST202', 'PGRST204', 'PGRST205'];

export const isMissingLotSchema = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code && MISSING_SCHEMA_CODES.includes(err.code)) return true;
  return /development_id|development_lot_totals|\bblock\b/.test(err.message || '');
};

export const MISSING_LOT_SCHEMA_MESSAGE =
  'A migration de loteamentos ainda não foi aplicada ao banco.';

const toLot = (row: Record<string, unknown>): DevelopmentLot =>
  ({
    ...row,
    ...toPurchaseTerms(row as { payment_type?: string | null }),
    status: row.status as PropertyStatus,
  }) as DevelopmentLot;

export async function fetchDevelopmentLots(developmentId: string): Promise<DevelopmentLot[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('development_id', developmentId)
    .order('block', { ascending: true, nullsFirst: true })
    .order('property_number', { ascending: true });

  if (error) {
    if (isMissingLotSchema(error)) {
      logger.warn('properties.development_id ausente no banco:', error.message);
      return [];
    }
    logger.error('Erro ao buscar lotes do loteamento:', error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => toLot(row as Record<string, unknown>));
}

const emptyTotals: DevelopmentLotTotals = {
  totalLots: 0,
  soldLots: 0,
  reservedLots: 0,
  availableLots: 0,
  totalLandArea: 0,
  totalMarketValue: 0,
  soldValue: 0,
  soldPercentage: 0,
};

/** Totais somados no banco, para não trazer todos os lotes só para contar. */
export async function fetchDevelopmentLotTotals(developmentId: string): Promise<DevelopmentLotTotals> {
  const { data, error } = await supabase.rpc('development_lot_totals', {
    p_development_id: developmentId,
  });

  if (error) {
    if (isMissingLotSchema(error)) {
      logger.warn('development_lot_totals ausente no banco:', error.message);
      return emptyTotals;
    }
    logger.error('Erro ao buscar totais do loteamento:', error);
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return emptyTotals;

  const totalMarketValue = Number(row.total_market_value) || 0;
  const soldValue = Number(row.sold_value) || 0;

  return {
    totalLots: Number(row.total_lots) || 0,
    soldLots: Number(row.sold_lots) || 0,
    reservedLots: Number(row.reserved_lots) || 0,
    availableLots: Number(row.available_lots) || 0,
    totalLandArea: Number(row.total_land_area) || 0,
    totalMarketValue,
    soldValue,
    soldPercentage: totalMarketValue > 0 ? (soldValue / totalMarketValue) * 100 : 0,
  };
}

/**
 * Cria vários lotes de uma vez a partir dos dados do loteamento.
 *
 * Endereço, cidade, estado, CEP e coordenadas vêm do loteamento — é o que faz o
 * cadastro em lote valer a pena. Números já usados na mesma quadra são pulados,
 * então reexecutar para ampliar o intervalo é seguro.
 */
export async function createLotBatch(
  development: Development,
  input: LotBatchInput
): Promise<{ created: number; skipped: number[] }> {
  const { errors } = validateLotBatch(input);
  if (errors.length) throw new Error(errors[0]);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const existing = await fetchDevelopmentLots(development.id);
  const block = input.block?.trim() || null;
  const taken = new Set(
    existing
      .filter((lot) => (lot.block?.trim() || null) === block)
      .map((lot) => String(lot.property_number ?? '').trim())
  );

  const clientId = development.client_id ?? (await getCurrentUserClientId());
  const value = lotValueFrom(input);
  const rows: Record<string, unknown>[] = [];
  const skipped: number[] = [];

  for (let n = input.firstNumber; n <= input.lastNumber; n += 1) {
    if (taken.has(String(n))) {
      skipped.push(n);
      continue;
    }

    rows.push({
      user_id: user.id,
      client_id: clientId,
      development_id: development.id,
      title: lotTitle(block, n),
      type: 'land',
      status: input.status,
      block,
      property_number: String(n),
      address: development.address,
      city: development.city,
      state: development.state,
      zip_code: development.zip_code ?? null,
      latitude: development.latitude ?? null,
      longitude: development.longitude ?? null,
      land_area: input.landArea,
      value,
      square_meter_value:
        input.pricingMode === 'per_square_meter'
          ? input.squareMeterValue ?? null
          : input.landArea > 0
            ? Math.round((value / input.landArea) * 100) / 100
            : null,
    });
  }

  if (rows.length === 0) return { created: 0, skipped };

  const { error } = await supabase.from('properties').insert(rows as never);

  if (error) {
    logger.error('Erro ao criar lotes:', error);
    throw new Error(isMissingLotSchema(error) ? MISSING_LOT_SCHEMA_MESSAGE : error.message);
  }

  return { created: rows.length, skipped };
}

/** Vincula um imóvel já existente ao loteamento, ou desvincula com null. */
export async function setPropertyDevelopment(
  propertyId: string,
  developmentId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ development_id: developmentId })
    .eq('id', propertyId);

  if (error) {
    logger.error('Erro ao vincular imóvel ao loteamento:', error);
    throw new Error(isMissingLotSchema(error) ? MISSING_LOT_SCHEMA_MESSAGE : error.message);
  }
}

export async function updateLotStatus(propertyId: string, status: PropertyStatus): Promise<void> {
  const { error } = await supabase.from('properties').update({ status }).eq('id', propertyId);

  if (error) {
    logger.error('Erro ao atualizar status do lote:', error);
    throw new Error(error.message);
  }
}

/** Imóveis sem loteamento, para o seletor de vínculo. */
export async function fetchUnassignedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id,title,type,status,city,state,value,development_id')
    .is('development_id', null)
    .order('title', { ascending: true });

  if (error) {
    if (isMissingLotSchema(error)) return [];
    logger.error('Erro ao buscar imóveis sem loteamento:', error);
    throw new Error(error.message);
  }

  return (data || []) as unknown as Property[];
}
