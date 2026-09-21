import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserClientId } from '@/api/client-users';
import { logger } from '@/lib/logger';
import type { OwnershipStake, StakeTarget } from '@/lib/ownership';

/**
 * A migration 20260921000300 pode não ter sido aplicada ao banco remoto ainda
 * (ver docs de migrations manuais). Sem a tabela, o app segue em modo bruto em
 * vez de estourar — é por isso que as leituras devolvem lista vazia.
 */
const MISSING_SCHEMA_CODES = ['42P01', 'PGRST202', 'PGRST205'];

export const isMissingStakeSchema = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string } | null;
  if (!err) return false;
  if (err.code && MISSING_SCHEMA_CODES.includes(err.code)) return true;
  return /ownership_stakes/.test(err.message || '');
};

export const MISSING_STAKE_SCHEMA_MESSAGE =
  'A migration de sociedade ainda não foi aplicada ao banco.';

/** Participação com o nome do sócio já resolvido, para a UI não fazer N+1. */
export interface OwnershipStakeWithContact extends OwnershipStake {
  contact?: { id: string; display_name: string } | null;
}

const SELECT_WITH_CONTACT = '*,contact:contacts(id,display_name)';

export async function fetchStakes(target: StakeTarget): Promise<OwnershipStakeWithContact[]> {
  const column = target.kind === 'property' ? 'property_id' : 'development_id';

  const { data, error } = await supabase
    .from('ownership_stakes')
    .select(SELECT_WITH_CONTACT)
    .eq(column, target.id)
    .order('is_self', { ascending: false })
    .order('percentage', { ascending: false });

  if (error) {
    if (isMissingStakeSchema(error)) {
      logger.warn('ownership_stakes ausente no banco:', error.message);
      return [];
    }
    logger.error('Erro ao buscar participações:', error);
    throw new Error(error.message);
  }

  return (data || []) as unknown as OwnershipStakeWithContact[];
}

/**
 * Todas as participações visíveis, para montar o mapa de cotas do portfólio.
 * A tabela é pequena (poucas linhas por alvo), então uma consulta serve tudo.
 */
export async function fetchAllStakes(): Promise<OwnershipStake[]> {
  const { data, error } = await supabase
    .from('ownership_stakes')
    .select('id,user_id,client_id,property_id,development_id,contact_id,is_self,percentage,role,notes,created_at,updated_at');

  if (error) {
    if (isMissingStakeSchema(error)) {
      logger.warn('ownership_stakes ausente no banco:', error.message);
      return [];
    }
    logger.error('Erro ao buscar participações do portfólio:', error);
    throw new Error(error.message);
  }

  return (data || []) as unknown as OwnershipStake[];
}

export interface StakeInput {
  /** null cria a fatia própria (is_self). */
  contactId: string | null;
  percentage: number;
  role?: string | null;
  notes?: string | null;
}

export async function createStake(target: StakeTarget, input: StakeInput): Promise<OwnershipStake> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('ownership_stakes')
    .insert({
      user_id: user.id,
      client_id: await getCurrentUserClientId(),
      property_id: target.kind === 'property' ? target.id : null,
      development_id: target.kind === 'development' ? target.id : null,
      contact_id: input.contactId,
      is_self: input.contactId === null,
      percentage: input.percentage,
      role: input.role ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Erro ao criar participação:', error);
    throw new Error(isMissingStakeSchema(error) ? MISSING_STAKE_SCHEMA_MESSAGE : error.message);
  }

  return data as unknown as OwnershipStake;
}

export async function updateStake(
  id: string,
  changes: Partial<Pick<OwnershipStake, 'percentage' | 'role' | 'notes'>>
): Promise<OwnershipStake> {
  const { data, error } = await supabase
    .from('ownership_stakes')
    .update(changes)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    logger.error('Erro ao atualizar participação:', error);
    throw new Error(error.message);
  }

  return data as unknown as OwnershipStake;
}

export async function deleteStake(id: string): Promise<void> {
  const { error } = await supabase.from('ownership_stakes').delete().eq('id', id);

  if (error) {
    logger.error('Erro ao excluir participação:', error);
    throw new Error(error.message);
  }
}
