import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserClientId } from '@/api/client-users';
import { logger } from '@/lib/logger';
import { toDateOnlyString } from '@/lib/dates';
import {
  toObligationInstallment,
  toPropertyObligation,
  type ObligationInput,
  type ObligationStatus,
  type PropertyObligation,
  type PropertyObligationInstallment,
  type PropertyObligationWithInstallments,
} from '@/types/property-obligation';

/**
 * A migration 20261007000100 pode não ter sido aplicada ao banco remoto ainda
 * (ele é atualizado manualmente). Sem as tabelas, as leituras devolvem lista
 * vazia e as escritas explicam o motivo, em vez de um erro genérico.
 */
const MISSING_SCHEMA_CODES = ['42P01', '42883', 'PGRST202', 'PGRST205'];

export const isMissingObligationSchema = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code && MISSING_SCHEMA_CODES.includes(err.code)) return true;
  return /property_obligation|record_property_obligation_payment|process_property_due_alerts/.test(
    err.message || ''
  );
};

export const MISSING_OBLIGATION_SCHEMA_MESSAGE =
  'A migration das contas do imóvel ainda não foi aplicada ao banco.';

const fail = (context: string, error: { message: string }): never => {
  logger.error(context, error);
  throw new Error(isMissingObligationSchema(error) ? MISSING_OBLIGATION_SCHEMA_MESSAGE : error.message);
};

/** Colunas gravadas a partir do formulário — o resto (autoria, datas) o banco resolve. */
const toRow = (input: ObligationInput) => ({
  obligation_type: input.obligation_type,
  title: input.title.trim(),
  reference_year: input.reference_year ?? null,
  frequency: input.frequency,
  installments_count: input.frequency === 'once' ? 1 : input.installments_count ?? null,
  installment_amount: input.installment_amount || null,
  total_amount: input.total_amount || null,
  first_due_date: input.first_due_date,
  end_date: input.end_date || null,
  paid_by: input.paid_by,
  reminder_days: input.reminder_days,
  creditor_name: input.creditor_name?.trim() || null,
  reference_code: input.reference_code?.trim() || null,
  notes: input.notes?.trim() || null,
  ...(input.status ? { status: input.status } : {}),
});

export async function fetchPropertyObligations(
  propertyId: string
): Promise<PropertyObligationWithInstallments[]> {
  const { data, error } = await supabase
    .from('property_obligations')
    .select('*, installments:property_obligation_installments(*)')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingObligationSchema(error)) {
      logger.warn('property_obligations ausente no banco:', error.message);
      return [];
    }
    return fail('Erro ao buscar contas do imóvel:', error);
  }

  return (data || []).map((row) => {
    const { installments = [], ...obligation } = row as Record<string, unknown> & {
      installments?: Record<string, unknown>[];
    };

    return {
      ...toPropertyObligation(obligation),
      installments: installments
        .map(toObligationInstallment)
        .sort((a, b) => a.installment_number - b.installment_number),
    };
  });
}

/** Regera o calendário. `rebuild` descarta e remonta os em aberto; sem ele, só completa. */
export async function generateObligationInstallments(
  obligationId: string,
  rebuild = true
): Promise<number> {
  const { data, error } = await supabase.rpc('generate_property_obligation_installments', {
    p_obligation_id: obligationId,
    p_rebuild: rebuild,
  });

  if (error) return fail('Erro ao gerar vencimentos da conta:', error);
  return data ?? 0;
}

/** Cria a conta e já monta o calendário. */
export async function createObligation(
  propertyId: string,
  input: ObligationInput
): Promise<{ obligation: PropertyObligation; generated: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('property_obligations')
    .insert({
      ...toRow(input),
      user_id: user.id,
      client_id: await getCurrentUserClientId(),
      property_id: propertyId,
    })
    .select('*')
    .single();

  if (error) return fail('Erro ao criar conta do imóvel:', error);

  const obligation = toPropertyObligation(data as Record<string, unknown>);
  const generated = await generateObligationInstallments(obligation.id, true);
  return { obligation, generated };
}

/** Atualiza a conta e remonta os vencimentos em aberto (os pagos ficam). */
export async function updateObligation(id: string, input: ObligationInput): Promise<number> {
  const { error } = await supabase.from('property_obligations').update(toRow(input)).eq('id', id);
  if (error) return fail('Erro ao atualizar conta do imóvel:', error);
  return generateObligationInstallments(id, true);
}

/**
 * Pausar ou encerrar remove os vencimentos em aberto (os pagos ficam como histórico);
 * reativar remonta o calendário.
 */
export async function setObligationStatus(id: string, status: ObligationStatus): Promise<void> {
  const { error } = await supabase.from('property_obligations').update({ status }).eq('id', id);
  if (error) return fail('Erro ao alterar a situação da conta:', error);
  await generateObligationInstallments(id, true);
}

export async function deleteObligation(id: string): Promise<void> {
  const { error } = await supabase.from('property_obligations').delete().eq('id', id);
  if (error) return fail('Erro ao excluir conta do imóvel:', error);
}

export interface RecordObligationPaymentOptions {
  paidDate?: string;
  paidAmount?: number | null;
  paymentMethod?: string | null;
  /** false só confirma o pagamento, sem lançar despesa (ex.: já lançada à mão). */
  createTransaction?: boolean;
}

/** Dá baixa no vencimento. Retorna o id da despesa criada, ou null quando não lança. */
export async function recordObligationPayment(
  installmentId: string,
  options: RecordObligationPaymentOptions = {}
): Promise<string | null> {
  const { data, error } = await supabase.rpc('record_property_obligation_payment', {
    p_installment_id: installmentId,
    p_paid_date: options.paidDate ?? toDateOnlyString(),
    p_paid_amount: options.paidAmount ?? null,
    p_payment_method: options.paymentMethod ?? null,
    p_create_transaction: options.createTransaction ?? true,
  });

  if (error) return fail('Erro ao dar baixa na conta do imóvel:', error);
  return (data as string | null) ?? null;
}

export async function updateObligationInstallment(
  id: string,
  changes: Partial<Pick<PropertyObligationInstallment, 'amount' | 'due_date' | 'notes' | 'status'>>
): Promise<void> {
  const { error } = await supabase.from('property_obligation_installments').update(changes).eq('id', id);
  if (error) return fail('Erro ao atualizar vencimento:', error);
}
