import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserClientId } from '@/api/client-users';
import { logger } from '@/lib/logger';
import {
  ContactContractLink,
  ContactPropertyLink,
  ContractLinkRole,
  PropertyLinkRole,
} from '@/types/contact';

const CONTACT_FIELDS = 'id, display_name, trade_name, kind, status';

// ---------------------------------------------------------------------------
// Imóveis
// ---------------------------------------------------------------------------

export interface PropertyLinkInput {
  contactId: string;
  propertyId: string;
  linkRole: PropertyLinkRole;
  participationPercentage?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

export const linkContactToProperty = async (
  input: PropertyLinkInput,
): Promise<ContactPropertyLink> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const clientId = await getCurrentUserClientId();

  const { data, error } = await supabase
    .from('contact_property_links')
    .insert({
      contact_id: input.contactId,
      property_id: input.propertyId,
      user_id: user.id,
      client_id: clientId,
      link_role: input.linkRole,
      participation_percentage: input.participationPercentage ?? null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      notes: input.notes || null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Error linking contact to property:', error);
    throw new Error(error.message);
  }
  return data as ContactPropertyLink;
};

export const unlinkContactFromProperty = async (linkId: string): Promise<void> => {
  const { error } = await supabase
    .from('contact_property_links')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', linkId);
  if (error) {
    logger.error('Error unlinking contact from property:', error);
    throw new Error(error.message);
  }
};

/** Contatos vinculados a um imóvel (para a ficha do imóvel). */
export const fetchPropertyContacts = async (
  propertyId: string,
): Promise<ContactPropertyLink[]> => {
  const { data, error } = await supabase
    .from('contact_property_links')
    .select(`*, contact:contacts(${CONTACT_FIELDS})`)
    .eq('property_id', propertyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching property contacts:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as unknown as ContactPropertyLink[];
};

/** Imóveis vinculados a um contato (para a ficha do contato). */
export const fetchContactPropertyLinks = async (
  contactId: string,
): Promise<ContactPropertyLink[]> => {
  const { data, error } = await supabase
    .from('contact_property_links')
    .select(`*, property:properties(id, title, address, city)`)
    .eq('contact_id', contactId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching contact property links:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as unknown as ContactPropertyLink[];
};

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------

export interface ContractLinkInput {
  contactId: string;
  contractId: string;
  linkRole: ContractLinkRole;
  isPaymentResponsible?: boolean;
  isReceivingResponsible?: boolean;
  notes?: string | null;
}

export const linkContactToContract = async (
  input: ContractLinkInput,
): Promise<ContactContractLink> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const clientId = await getCurrentUserClientId();

  const { data, error } = await supabase
    .from('contact_contract_links')
    .insert({
      contact_id: input.contactId,
      contract_id: input.contractId,
      user_id: user.id,
      client_id: clientId,
      link_role: input.linkRole,
      is_payment_responsible: input.isPaymentResponsible ?? false,
      is_receiving_responsible: input.isReceivingResponsible ?? false,
      notes: input.notes || null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Error linking contact to contract:', error);
    throw new Error(error.message);
  }
  return data as ContactContractLink;
};

export const unlinkContactFromContract = async (linkId: string): Promise<void> => {
  const { error } = await supabase
    .from('contact_contract_links')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', linkId);
  if (error) {
    logger.error('Error unlinking contact from contract:', error);
    throw new Error(error.message);
  }
};

/** Contatos vinculados a um contrato (para a ficha do contrato). */
export const fetchContractContacts = async (
  contractId: string,
): Promise<ContactContractLink[]> => {
  const { data, error } = await supabase
    .from('contact_contract_links')
    .select(`*, contact:contacts(${CONTACT_FIELDS})`)
    .eq('contract_id', contractId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching contract contacts:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as unknown as ContactContractLink[];
};

/** Contratos vinculados a um contato (para a ficha do contato). */
export const fetchContactContractLinks = async (
  contactId: string,
): Promise<ContactContractLink[]> => {
  const { data, error } = await supabase
    .from('contact_contract_links')
    .select(`*, contract:contracts(id, title)`)
    .eq('contact_id', contactId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching contact contract links:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as unknown as ContactContractLink[];
};

// ---------------------------------------------------------------------------
// Vínculos diretos (FK contact_id) em documentos, transações e agenda
// ---------------------------------------------------------------------------

export const linkContactToDocument = async (
  documentId: string,
  contactId: string | null,
): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .update({ contact_id: contactId })
    .eq('id', documentId);
  if (error) {
    logger.error('Error linking contact to document:', error);
    throw new Error(error.message);
  }
};

export const linkContactToTransaction = async (
  transactionId: string,
  contactId: string | null,
): Promise<void> => {
  const { error } = await supabase
    .from('financial_transactions')
    .update({ contact_id: contactId })
    .eq('id', transactionId);
  if (error) {
    logger.error('Error linking contact to transaction:', error);
    throw new Error(error.message);
  }
};

export interface ContactTransactionRow {
  id: string;
  name: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  category: string;
}

/**
 * Transações financeiras relacionadas a um contato.
 * Observação: financial_transactions é escopada por USUÁRIO (sem client_id),
 * portanto retorna apenas os lançamentos do próprio usuário (ver aviso na UI).
 */
export const fetchContactTransactions = async (
  contactId: string,
): Promise<ContactTransactionRow[]> => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('id, name, amount, transaction_type, transaction_date, category')
    .eq('contact_id', contactId)
    .order('transaction_date', { ascending: false });

  if (error) {
    logger.error('Error fetching contact transactions:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as ContactTransactionRow[];
};

export interface ContactDocumentRow {
  id: string;
  name: string;
  category: string;
  file_path: string;
  created_at: string;
}

export const fetchContactDocuments = async (
  contactId: string,
): Promise<ContactDocumentRow[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, category, file_path, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching contact documents:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as ContactDocumentRow[];
};

export interface ContactAgendaRow {
  id: string;
  title: string;
  event_type: string;
  status: string;
  starts_at: string;
}

export const fetchContactAgendaEvents = async (
  contactId: string,
): Promise<ContactAgendaRow[]> => {
  const { data, error } = await supabase
    .from('agenda_events')
    .select('id, title, event_type, status, starts_at')
    .eq('contact_id', contactId)
    .order('starts_at', { ascending: false });

  if (error) {
    logger.error('Error fetching contact agenda events:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as ContactAgendaRow[];
};
