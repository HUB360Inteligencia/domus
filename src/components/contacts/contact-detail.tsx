import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Info,
  Building,
  FileText,
  FolderOpen,
  Banknote,
  CalendarDays,
  History,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';
import { useContactQueries } from '@/hooks/use-contact-queries';
import { useContactLinks, useContactRelatedData } from '@/hooks/use-contact-links';
import { ContactHistoryTab } from './contact-history-tab';
import {
  Contact,
  KIND_LABELS,
  ROLE_LABELS,
  PROPERTY_LINK_ROLE_LABELS,
  CONTRACT_LINK_ROLE_LABELS,
  PropertyLinkRole,
  ContractLinkRole,
  formatContactPhone,
} from '@/types/contact';
import { ContactStatusBadge } from './contact-status-badge';
import { ContactRoleChips } from './contact-role-chips';

interface ContactDetailProps {
  contactId: string;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}

export function ContactDetail({ contactId }: ContactDetailProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canViewFinancial = hasPermission('contacts.financial.view');
  const canViewDocuments = hasPermission('contacts.documents.view');
  const canEdit = hasPermission('contacts.edit');

  const { selectedContact, isLoadingSelectedContact } = useContactQueries({}, contactId);
  const { properties: propertyLinks, contracts: contractLinks } = useContactLinks(contactId);
  const { transactions, documents, agenda } = useContactRelatedData(contactId, {
    financial: canViewFinancial,
    documents: canViewDocuments,
  });

  if (isLoadingSelectedContact) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-[2rem]" />
        <Skeleton className="h-12 w-full rounded-[2rem]" />
        <Skeleton className="h-64 w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!selectedContact) {
    return (
      <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
        <CardContent className="py-16 text-center">
          <p className="font-medium">Contato não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/contacts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para contatos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const contact = selectedContact as Contact;
  const address = [
    contact.street,
    contact.number,
    contact.neighborhood,
    contact.city,
    contact.state,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Contatos
      </Button>

      {/* Hero */}
      <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">
                  {contact.trade_name || contact.display_name}
                </h1>
                <ContactStatusBadge status={contact.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {KIND_LABELS[contact.kind]}
                {contact.document_number ? ` · ${contact.document_number}` : ''}
              </p>
              <ContactRoleChips roles={contact.roles} />
            </div>
          </div>
          {canEdit && (
            <Button onClick={() => navigate(`/contacts/edit/${contact.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Abas */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="premium-panel dark:premium-panel-dark grid h-auto grid-cols-2 gap-1 rounded-[2rem] p-1 md:grid-cols-7">
          <TabsTrigger value="overview" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Imóveis</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contratos</span>
          </TabsTrigger>
          {canViewDocuments && (
            <TabsTrigger value="documents" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
          )}
          {canViewFinancial && (
            <TabsTrigger value="financial" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
              <Banknote className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="agenda" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex h-11 items-center gap-2 rounded-[1.5rem]">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-lg">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={MessageCircle} label="WhatsApp" value={formatContactPhone(contact.primary_whatsapp)} />
                <InfoRow icon={Phone} label="Telefone" value={formatContactPhone(contact.primary_phone)} />
                <InfoRow icon={Phone} label="Telefone secundário" value={formatContactPhone(contact.secondary_phone)} />
                <InfoRow icon={Mail} label="E-mail" value={contact.primary_email} />
                <InfoRow icon={Mail} label="E-mail secundário" value={contact.secondary_email} />
                <InfoRow icon={MapPin} label="Endereço" value={address} />
                {!contact.primary_whatsapp &&
                  !contact.primary_phone &&
                  !contact.primary_email &&
                  !address && (
                    <p className="text-sm text-muted-foreground">Nenhuma informação de contato cadastrada.</p>
                  )}
              </CardContent>
            </Card>

            <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-lg">Papéis e observações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(contact.roles ?? []).filter((r) => !r.deleted_at).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum papel atribuído.</p>
                ) : (
                  (contact.roles ?? [])
                    .filter((r) => !r.deleted_at)
                    .map((role) => (
                      <div key={role.id} className="rounded-xl border border-border/60 p-3">
                        <p className="text-sm font-medium">{ROLE_LABELS[role.role_type]}</p>
                        {role.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">{role.notes}</p>
                        )}
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {(contact.notes || (contact.tags && contact.tags.length > 0)) && (
              <Card className="premium-panel dark:premium-panel-dark rounded-[2rem] lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Observações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contact.notes && <p className="text-sm">{contact.notes}</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg">Imóveis vinculados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {propertyLinks.isLoading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : (propertyLinks.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum imóvel vinculado.</p>
              ) : (
                (propertyLinks.data ?? []).map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => link.property && navigate(`/properties/${link.property.id}`)}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 p-3 text-left hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{link.property?.title || 'Imóvel'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[link.property?.address, link.property?.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {PROPERTY_LINK_ROLE_LABELS[link.link_role as PropertyLinkRole]}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contracts">
          <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg">Contratos vinculados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contractLinks.isLoading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : (contractLinks.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum contrato vinculado.</p>
              ) : (
                (contractLinks.data ?? []).map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => link.contract && navigate(`/contracts/${link.contract.id}`)}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 p-3 text-left hover:bg-muted/40"
                  >
                    <p className="truncate font-medium">{link.contract?.title || 'Contrato'}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {CONTRACT_LINK_ROLE_LABELS[link.link_role as ContractLinkRole]}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {canViewDocuments && (
          <TabsContent value="documents">
            <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-lg">Documentos vinculados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documents.isLoading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : (documents.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum documento vinculado.</p>
                ) : (
                  (documents.data ?? []).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                    >
                      <span className="truncate font-medium">{doc.name}</span>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {doc.category}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {canViewFinancial && (
          <TabsContent value="financial" className="space-y-3">
            <Alert>
              <Banknote className="h-4 w-4" />
              <AlertDescription>
                O financeiro do Domus é por usuário: esta aba mostra apenas os seus lançamentos
                vinculados a este contato.
              </AlertDescription>
            </Alert>
            <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
              <CardHeader>
                <CardTitle className="text-lg">Transações relacionadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {transactions.isLoading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : (transactions.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma transação vinculada.</p>
                ) : (
                  (transactions.data ?? []).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{tx.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                          {' · '}
                          {tx.category}
                        </p>
                      </div>
                      <span
                        className={
                          tx.transaction_type === 'expense'
                            ? 'font-semibold text-red-600'
                            : 'font-semibold text-emerald-600'
                        }
                      >
                        {tx.transaction_type === 'expense' ? '- ' : '+ '}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        <TabsContent value="agenda">
          <Card className="premium-panel dark:premium-panel-dark rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg">Agenda e tarefas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agenda.isLoading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : (agenda.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento ou tarefa vinculado.</p>
              ) : (
                (agenda.data ?? []).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ev.starts_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {ev.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <ContactHistoryTab contactId={contactId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
