import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ContactKind = 'pf' | 'pj';

export type ContactStatus = 'active' | 'inactive' | 'review' | 'blocked';

export type ContactDocumentType = 'cpf' | 'cnpj' | 'other';

export type ContactRoleType =
  | 'tenant'
  | 'guarantor'
  | 'owner'
  | 'partner'
  | 'supplier'
  | 'service_provider'
  | 'real_estate_agency'
  | 'broker'
  | 'accountant'
  | 'lawyer'
  | 'building_manager'
  | 'condominium_administrator'
  | 'insurance_company'
  | 'bank'
  | 'financial_responsible'
  | 'other';

export type ContactRoleRow = Tables<'contact_roles'>;

export interface ContactRole extends Omit<ContactRoleRow, 'role_type'> {
  role_type: ContactRoleType;
}

export type ContactRow = Tables<'contacts'>;

export interface Contact extends Omit<ContactRow, 'kind' | 'status' | 'document_type'> {
  kind: ContactKind;
  status: ContactStatus;
  document_type: ContactDocumentType | null;
  roles?: ContactRole[];
}

export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

/** Payload usado pelo formulário (um papel + observação por papel). */
export interface ContactRoleInput {
  role_type: ContactRoleType;
  is_primary?: boolean;
  notes?: string | null;
}

export interface ContactFormData {
  kind: ContactKind;
  display_name: string;
  legal_name?: string | null;
  trade_name?: string | null;
  document_type?: ContactDocumentType | null;
  document_number?: string | null;
  rg?: string | null;
  state_registration?: string | null;
  municipal_registration?: string | null;
  birth_date?: string | null;
  foundation_date?: string | null;
  nationality?: string | null;
  marital_status?: string | null;
  profession?: string | null;
  primary_whatsapp?: string | null;
  primary_phone?: string | null;
  secondary_phone?: string | null;
  primary_email?: string | null;
  secondary_email?: string | null;
  website?: string | null;
  social_url?: string | null;
  zip_code?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status?: ContactStatus;
  notes?: string | null;
  tags?: string[];
  roles: ContactRoleInput[];
}

// ---------------------------------------------------------------------------
// Vínculos e interações
// ---------------------------------------------------------------------------

export type PropertyLinkRole =
  | 'owner'
  | 'partner'
  | 'current_tenant'
  | 'former_tenant'
  | 'recurring_provider'
  | 'building_manager'
  | 'condominium_administrator'
  | 'responsible'
  | 'other';

export type ContractLinkRole =
  | 'tenant'
  | 'guarantor'
  | 'owner'
  | 'financial_responsible'
  | 'real_estate_agency'
  | 'broker'
  | 'witness'
  | 'other';

export type InteractionType =
  | 'call'
  | 'whatsapp'
  | 'email'
  | 'meeting'
  | 'visit'
  | 'charge'
  | 'negotiation'
  | 'maintenance'
  | 'occurrence'
  | 'note';

export type ContactPropertyLinkRow = Tables<'contact_property_links'>;
export type ContactContractLinkRow = Tables<'contact_contract_links'>;
export type ContactInteractionRow = Tables<'contact_interactions'>;

export interface ContactPropertyLink extends Omit<ContactPropertyLinkRow, 'link_role'> {
  link_role: PropertyLinkRole;
  contact?: Pick<ContactRow, 'id' | 'display_name' | 'trade_name' | 'kind' | 'status'> | null;
  property?: { id: string; title: string | null; address: string | null; city: string | null } | null;
}

export interface ContactContractLink extends Omit<ContactContractLinkRow, 'link_role'> {
  link_role: ContractLinkRole;
  contact?: Pick<ContactRow, 'id' | 'display_name' | 'trade_name' | 'kind' | 'status'> | null;
  contract?: { id: string; title: string | null } | null;
}

export interface ContactInteraction extends Omit<ContactInteractionRow, 'interaction_type'> {
  interaction_type: InteractionType;
}

export const PROPERTY_LINK_ROLE_LABELS: Record<PropertyLinkRole, string> = {
  owner: 'Proprietário',
  partner: 'Sócio',
  current_tenant: 'Inquilino atual',
  former_tenant: 'Ex-inquilino',
  recurring_provider: 'Prestador recorrente',
  building_manager: 'Síndico',
  condominium_administrator: 'Administradora de condomínio',
  responsible: 'Responsável pelo imóvel',
  other: 'Outro',
};

export const CONTRACT_LINK_ROLE_LABELS: Record<ContractLinkRole, string> = {
  tenant: 'Inquilino',
  guarantor: 'Fiador',
  owner: 'Proprietário',
  financial_responsible: 'Responsável financeiro',
  real_estate_agency: 'Imobiliária intermediadora',
  broker: 'Corretor',
  witness: 'Testemunha',
  other: 'Outro',
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  meeting: 'Reunião',
  visit: 'Visita',
  charge: 'Cobrança',
  negotiation: 'Negociação',
  maintenance: 'Manutenção',
  occurrence: 'Ocorrência',
  note: 'Observação',
};

export const PROPERTY_LINK_ROLE_OPTIONS = (
  Object.keys(PROPERTY_LINK_ROLE_LABELS) as PropertyLinkRole[]
).map((value) => ({ value, label: PROPERTY_LINK_ROLE_LABELS[value] }));

export const CONTRACT_LINK_ROLE_OPTIONS = (
  Object.keys(CONTRACT_LINK_ROLE_LABELS) as ContractLinkRole[]
).map((value) => ({ value, label: CONTRACT_LINK_ROLE_LABELS[value] }));

export const INTERACTION_TYPE_OPTIONS = (
  Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]
).map((value) => ({ value, label: INTERACTION_TYPE_LABELS[value] }));

export type ContactLinkEntity = 'property' | 'contract';

export interface ContactFilters {
  search?: string;
  kind?: ContactKind | 'all';
  status?: ContactStatus | 'all';
  role?: ContactRoleType | 'all';
}

// ---------------------------------------------------------------------------
// Rótulos (pt-BR) — centralizados para lista, ficha e vínculos
// ---------------------------------------------------------------------------

export const KIND_LABELS: Record<ContactKind, string> = {
  pf: 'Pessoa física',
  pj: 'Pessoa jurídica',
};

export const STATUS_LABELS: Record<ContactStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  review: 'Em análise',
  blocked: 'Bloqueado',
};

/** Classes Tailwind para o badge de status (sem roxo, segue tokens do app). */
export const STATUS_BADGE_CLASSES: Record<ContactStatus, string> = {
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  inactive: 'border-stone-400/30 bg-stone-400/10 text-stone-600 dark:text-stone-300',
  review: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
};

export const ROLE_LABELS: Record<ContactRoleType, string> = {
  tenant: 'Inquilino',
  guarantor: 'Fiador',
  owner: 'Proprietário',
  partner: 'Sócio',
  supplier: 'Fornecedor',
  service_provider: 'Prestador de serviço',
  real_estate_agency: 'Imobiliária',
  broker: 'Corretor',
  accountant: 'Contador',
  lawyer: 'Advogado',
  building_manager: 'Síndico',
  condominium_administrator: 'Administradora de condomínio',
  insurance_company: 'Seguradora',
  bank: 'Banco/instituição financeira',
  financial_responsible: 'Responsável financeiro',
  other: 'Outro',
};

export const ROLE_OPTIONS: { value: ContactRoleType; label: string }[] = (
  Object.keys(ROLE_LABELS) as ContactRoleType[]
).map((value) => ({ value, label: ROLE_LABELS[value] }));

export const KIND_OPTIONS: { value: ContactKind; label: string }[] = [
  { value: 'pf', label: KIND_LABELS.pf },
  { value: 'pj', label: KIND_LABELS.pj },
];

export const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: 'active', label: STATUS_LABELS.active },
  { value: 'inactive', label: STATUS_LABELS.inactive },
  { value: 'review', label: STATUS_LABELS.review },
  { value: 'blocked', label: STATUS_LABELS.blocked },
];

// ---------------------------------------------------------------------------
// Normalização (deduplicação: dígitos para documento/telefone, lower no e-mail)
// ---------------------------------------------------------------------------

export const onlyDigits = (value?: string | null): string =>
  (value ?? '').replace(/\D/g, '');

export const normalizeEmail = (value?: string | null): string =>
  (value ?? '').trim().toLowerCase();

/** Nome de exibição amigável para um contato (razão social cai em display_name). */
export const getContactDisplayName = (contact: Pick<Contact, 'display_name' | 'trade_name'>): string =>
  contact.trade_name?.trim() || contact.display_name;

/** Formata um telefone/whatsapp armazenado como dígitos para exibição. */
export const formatContactPhone = (value?: string | null): string => {
  const digits = onlyDigits(value);
  if (!digits) return '';
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value ?? digits;
};

/** Máscara de telefone/whatsapp aplicada enquanto o usuário digita. */
export const formatPhoneInput = (value: string): string => {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** Máscara de CPF (000.000.000-00) aplicada enquanto o usuário digita. */
export const formatCPF = (value: string): string => {
  const d = onlyDigits(value).slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length > 3) out += `.${d.slice(3, 6)}`;
  if (d.length > 6) out += `.${d.slice(6, 9)}`;
  if (d.length > 9) out += `-${d.slice(9, 11)}`;
  return out;
};

/** Máscara de CNPJ (00.000.000/0000-00) aplicada enquanto o usuário digita. */
export const formatCNPJ = (value: string): string => {
  const d = onlyDigits(value).slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `.${d.slice(2, 5)}`;
  if (d.length > 5) out += `.${d.slice(5, 8)}`;
  if (d.length > 8) out += `/${d.slice(8, 12)}`;
  if (d.length > 12) out += `-${d.slice(12, 14)}`;
  return out;
};

/** Máscara de documento conforme o tipo de pessoa. */
export const formatDocument = (kind: ContactKind, value: string): string =>
  kind === 'pj' ? formatCNPJ(value) : formatCPF(value);
