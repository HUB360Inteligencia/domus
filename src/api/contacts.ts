import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserClientId } from '@/api/client-users';
import { logger } from '@/lib/logger';
import {
  Contact,
  ContactFilters,
  ContactFormData,
  ContactRole,
  ContactRoleInput,
  ContactRoleType,
  onlyDigits,
  normalizeEmail,
} from '@/types/contact';

type RawContact = Record<string, unknown> & { contact_roles?: unknown[] };

const mapRawToContact = (raw: RawContact): Contact => {
  const { contact_roles, ...rest } = raw;
  return {
    ...(rest as Contact),
    roles: (contact_roles as ContactRole[] | undefined)?.filter((r) => !r.deleted_at) ?? [],
  };
};

const SELECT_WITH_ROLES = `*, contact_roles(*)`;

/**
 * Lista contatos da organização/usuário, com filtros opcionais.
 */
export const fetchContacts = async (filters: ContactFilters = {}): Promise<Contact[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  let query = supabase
    .from('contacts')
    .select(SELECT_WITH_ROLES)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (filters.kind && filters.kind !== 'all') {
    query = query.eq('kind', filters.kind);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const search = filters.search?.trim();
  if (search) {
    const digits = onlyDigits(search);
    const ors = [
      `display_name.ilike.%${search}%`,
      `legal_name.ilike.%${search}%`,
      `trade_name.ilike.%${search}%`,
      `primary_email.ilike.%${search}%`,
      `city.ilike.%${search}%`,
      `notes.ilike.%${search}%`,
    ];
    if (digits) {
      ors.push(`document_number.ilike.%${digits}%`);
      ors.push(`primary_phone.ilike.%${digits}%`);
      ors.push(`primary_whatsapp.ilike.%${digits}%`);
    }
    query = query.or(ors.join(','));
  }

  const { data, error } = await query;
  if (error) {
    logger.error('Error fetching contacts:', error);
    throw new Error(error.message);
  }

  let contacts = (data ?? []).map((row) => mapRawToContact(row as RawContact));

  // Filtro por papel é aplicado no cliente para não perder os demais papéis do contato
  if (filters.role && filters.role !== 'all') {
    contacts = contacts.filter((c) => c.roles?.some((r) => r.role_type === filters.role));
  }

  return contacts;
};

/**
 * Busca um contato pelo id, com seus papéis.
 */
export const fetchContactById = async (id: string): Promise<Contact | null> => {
  if (!id) return null;

  const { data, error } = await supabase
    .from('contacts')
    .select(SELECT_WITH_ROLES)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    logger.error(`Error fetching contact ${id}:`, error);
    throw new Error(error.message);
  }

  return data ? mapRawToContact(data as RawContact) : null;
};

/**
 * Cards de resumo da página de contatos.
 */
export interface ContactSummary {
  total: number;
  active: number;
  tenants: number;
  suppliers: number;
  owners: number;
}

export const fetchContactsSummary = async (): Promise<ContactSummary> => {
  const contacts = await fetchContacts();
  const hasRole = (c: Contact, roles: ContactRoleType[]) =>
    c.roles?.some((r) => roles.includes(r.role_type));

  return {
    total: contacts.length,
    active: contacts.filter((c) => c.status === 'active').length,
    tenants: contacts.filter((c) => hasRole(c, ['tenant'])).length,
    suppliers: contacts.filter((c) => hasRole(c, ['supplier', 'service_provider'])).length,
    owners: contacts.filter((c) => hasRole(c, ['owner', 'partner'])).length,
  };
};

const buildInsertPayload = (form: ContactFormData) => ({
  kind: form.kind,
  display_name: form.display_name,
  legal_name: form.legal_name || null,
  trade_name: form.trade_name || null,
  document_type: form.document_type || (form.kind === 'pj' ? 'cnpj' : 'cpf'),
  document_number: form.document_number ? onlyDigits(form.document_number) : null,
  rg: form.rg || null,
  state_registration: form.state_registration || null,
  municipal_registration: form.municipal_registration || null,
  birth_date: form.birth_date || null,
  foundation_date: form.foundation_date || null,
  nationality: form.nationality || null,
  marital_status: form.marital_status || null,
  profession: form.profession || null,
  primary_whatsapp: form.primary_whatsapp ? onlyDigits(form.primary_whatsapp) : null,
  primary_phone: form.primary_phone ? onlyDigits(form.primary_phone) : null,
  secondary_phone: form.secondary_phone ? onlyDigits(form.secondary_phone) : null,
  primary_email: form.primary_email ? normalizeEmail(form.primary_email) : null,
  secondary_email: form.secondary_email ? normalizeEmail(form.secondary_email) : null,
  website: form.website || null,
  social_url: form.social_url || null,
  zip_code: form.zip_code || null,
  street: form.street || null,
  number: form.number || null,
  complement: form.complement || null,
  neighborhood: form.neighborhood || null,
  city: form.city || null,
  state: form.state || null,
  country: form.country || null,
  status: form.status || 'active',
  notes: form.notes || null,
  tags: form.tags ?? [],
});

const syncRoles = async (
  contactId: string,
  userId: string,
  clientId: string | null,
  roles: ContactRoleInput[],
): Promise<void> => {
  // Estratégia simples e previsível: zera (soft) e regrava os papéis enviados.
  const { error: clearError } = await supabase
    .from('contact_roles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('contact_id', contactId)
    .is('deleted_at', null);

  if (clearError) {
    logger.error('Error clearing contact roles:', clearError);
    throw new Error(clearError.message);
  }

  if (!roles.length) return;

  const rows = roles.map((r) => ({
    contact_id: contactId,
    user_id: userId,
    client_id: clientId,
    role_type: r.role_type,
    is_primary: r.is_primary ?? false,
    notes: r.notes || null,
    deleted_at: null,
  }));

  const { error: insertError } = await supabase.from('contact_roles').insert(rows);
  if (insertError) {
    logger.error('Error inserting contact roles:', insertError);
    throw new Error(insertError.message);
  }
};

/**
 * Cria um contato e seus papéis.
 */
export const createContact = async (form: ContactFormData): Promise<Contact> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const clientId = await getCurrentUserClientId();

  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...buildInsertPayload(form), user_id: user.id, client_id: clientId })
    .select('*')
    .single();

  if (error) {
    logger.error('Error creating contact:', error);
    throw new Error(error.message);
  }

  await syncRoles(data.id, user.id, clientId, form.roles);

  const created = await fetchContactById(data.id);
  if (!created) throw new Error('Falha ao carregar contato criado');
  return created;
};

/**
 * Atualiza um contato e (opcionalmente) seus papéis.
 */
export const updateContact = async (
  id: string,
  form: ContactFormData,
): Promise<Contact> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('contacts')
    .update(buildInsertPayload(form))
    .eq('id', id);

  if (error) {
    logger.error(`Error updating contact ${id}:`, error);
    throw new Error(error.message);
  }

  // client_id é imutável pós-criação; reutiliza o do usuário para novas linhas de papel
  const clientId = await getCurrentUserClientId();
  await syncRoles(id, user.id, clientId, form.roles);

  const updated = await fetchContactById(id);
  if (!updated) throw new Error('Falha ao carregar contato atualizado');
  return updated;
};

/**
 * Atualiza apenas o status do contato (inclui inativação).
 */
export const updateContactStatus = async (
  id: string,
  status: Contact['status'],
): Promise<void> => {
  const { error } = await supabase.from('contacts').update({ status }).eq('id', id);
  if (error) {
    logger.error(`Error updating contact status ${id}:`, error);
    throw new Error(error.message);
  }
};

/**
 * Soft delete: preserva vínculos/histórico. Nunca usa DELETE físico.
 */
export const softDeleteContact = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error(`Error soft-deleting contact ${id}:`, error);
    throw new Error(error.message);
  }
};

export interface DuplicateCheckParams {
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  excludeId?: string;
}

/**
 * Detecção de duplicidade — avisa, não bloqueia.
 * Compara CPF/CNPJ, e-mail e telefone normalizados (RLS garante o escopo).
 */
export const findDuplicateContacts = async (
  params: DuplicateCheckParams,
): Promise<Contact[]> => {
  const document = params.documentNumber ? onlyDigits(params.documentNumber) : '';
  const email = params.email ? normalizeEmail(params.email) : '';
  const phone = params.phone ? onlyDigits(params.phone) : '';

  const ors: string[] = [];
  if (document) ors.push(`document_number.eq.${document}`);
  if (email) ors.push(`primary_email.eq.${email}`);
  if (phone) {
    ors.push(`primary_phone.eq.${phone}`);
    ors.push(`primary_whatsapp.eq.${phone}`);
  }
  if (!ors.length) return [];

  let query = supabase
    .from('contacts')
    .select('*')
    .is('deleted_at', null)
    .or(ors.join(','));

  if (params.excludeId) {
    query = query.neq('id', params.excludeId);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('Error checking duplicate contacts:', error);
    return [];
  }

  return (data ?? []).map((row) => mapRawToContact(row as RawContact));
};
