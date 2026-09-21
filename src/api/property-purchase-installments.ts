import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toDateOnlyString } from '@/lib/dates';
import type {
  PropertyPurchaseInstallment,
  PurchaseInstallmentStatus,
} from '@/types/property-purchase';

/**
 * A migration 20260921000100 pode não ter sido aplicada ao banco remoto ainda
 * (ver docs de migrations manuais). Nesse caso a UI mostra um aviso em vez de
 * um erro genérico.
 */
const MISSING_SCHEMA_CODES = ['42P01', 'PGRST202', 'PGRST205'];

export const isMissingPurchaseSchema = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code && MISSING_SCHEMA_CODES.includes(err.code)) return true;
  return /property_purchase_installments|generate_property_purchase_installments|record_property_purchase_installment/.test(
    err.message || ''
  );
};

export const MISSING_SCHEMA_MESSAGE =
  'A migration das parcelas de compra ainda não foi aplicada ao banco.';

export async function fetchPurchaseInstallments(
  propertyId: string
): Promise<PropertyPurchaseInstallment[]> {
  const { data, error } = await supabase
    .from('property_purchase_installments')
    .select('*')
    .eq('property_id', propertyId)
    .order('installment_number', { ascending: true });

  if (error) {
    if (isMissingPurchaseSchema(error)) {
      logger.warn('property_purchase_installments ausente no banco:', error.message);
      return [];
    }
    logger.error('Erro ao buscar parcelas da compra:', error);
    throw new Error(error.message);
  }

  return (data || []) as PropertyPurchaseInstallment[];
}

/** Regera o cronograma a partir das condições do imóvel, preservando parcelas pagas. */
export async function generatePurchaseInstallments(propertyId: string): Promise<number> {
  const { data, error } = await supabase.rpc('generate_property_purchase_installments', {
    p_property_id: propertyId,
  });

  if (error) {
    logger.error('Erro ao gerar parcelas da compra:', error);
    throw new Error(isMissingPurchaseSchema(error) ? MISSING_SCHEMA_MESSAGE : error.message);
  }

  return data ?? 0;
}

/** Dá baixa na parcela criando a despesa correspondente. Retorna o id da transação. */
export async function recordPurchaseInstallment(
  installmentId: string,
  options: { paidDate?: string; paymentMethod?: string | null } = {}
): Promise<string> {
  const { data, error } = await supabase.rpc('record_property_purchase_installment', {
    p_installment_id: installmentId,
    p_paid_date: options.paidDate ?? toDateOnlyString(),
    p_payment_method: options.paymentMethod ?? null,
  });

  if (error) {
    logger.error('Erro ao dar baixa na parcela da compra:', error);
    throw new Error(isMissingPurchaseSchema(error) ? MISSING_SCHEMA_MESSAGE : error.message);
  }

  return data as string;
}

export async function updatePurchaseInstallment(
  id: string,
  changes: Partial<Pick<PropertyPurchaseInstallment, 'amount' | 'due_date' | 'notes' | 'status'>>
): Promise<PropertyPurchaseInstallment> {
  const { data, error } = await supabase
    .from('property_purchase_installments')
    .update(changes)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logger.error('Erro ao atualizar parcela da compra:', error);
    throw new Error(error.message);
  }

  return data as PropertyPurchaseInstallment;
}

/**
 * Cancela ou reativa uma parcela. Não desfaz baixa: uma parcela paga já tem
 * despesa lançada, que precisa ser excluída no módulo financeiro.
 */
export async function setPurchaseInstallmentStatus(
  id: string,
  status: Extract<PurchaseInstallmentStatus, 'pending' | 'cancelled'>
): Promise<PropertyPurchaseInstallment> {
  return updatePurchaseInstallment(id, { status });
}

export async function deletePurchaseSchedule(propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('property_purchase_installments')
    .delete()
    .eq('property_id', propertyId);

  if (error) {
    logger.error('Erro ao excluir cronograma da compra:', error);
    throw new Error(error.message);
  }
}
