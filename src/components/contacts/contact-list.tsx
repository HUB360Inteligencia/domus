import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Home,
  Wrench,
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth';
import { useContacts } from '@/hooks/use-contacts';
import {
  Contact,
  KIND_LABELS,
  KIND_OPTIONS,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  formatContactPhone,
} from '@/types/contact';
import { ContactStatusBadge } from './contact-status-badge';
import { ContactRoleChips } from './contact-role-chips';

function SummaryCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <Card className="premium-panel dark:premium-panel-dark rounded-[1.5rem]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-10" />
          ) : (
            <p className="text-xl font-semibold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ContactList() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const {
    contacts,
    isLoadingContacts,
    summary,
    isLoadingSummary,
    filters,
    setFilters,
    deleteContact,
  } = useContacts();

  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);

  const canCreate = hasPermission('contacts.create');
  const canEdit = hasPermission('contacts.edit');
  const canDelete = hasPermission('contacts.delete');

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contatos</h1>
          <p className="text-sm text-muted-foreground">
            Pessoas e empresas relacionadas ao seu patrimônio
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/contacts/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo contato
          </Button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryCard icon={Users} label="Total" value={summary?.total ?? 0} loading={isLoadingSummary} />
        <SummaryCard icon={UserCheck} label="Ativos" value={summary?.active ?? 0} loading={isLoadingSummary} />
        <SummaryCard icon={Home} label="Inquilinos" value={summary?.tenants ?? 0} loading={isLoadingSummary} />
        <SummaryCard icon={Wrench} label="Fornecedores" value={summary?.suppliers ?? 0} loading={isLoadingSummary} />
        <SummaryCard icon={Building2} label="Proprietários" value={summary?.owners ?? 0} loading={isLoadingSummary} />
      </div>

      {/* Busca e filtros */}
      <Card className="premium-panel dark:premium-panel-dark rounded-[1.5rem]">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Buscar por nome, CPF/CNPJ, e-mail, telefone, cidade..."
              className="pl-9"
            />
          </div>
          <Select
            value={filters.kind ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, kind: v as typeof f.kind }))}
          >
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.role ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, role: v as typeof f.role }))}
          >
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              {ROLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v as typeof f.status }))}
          >
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista */}
      {isLoadingContacts ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="premium-panel dark:premium-panel-dark rounded-[1.5rem]">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Nenhum contato encontrado</p>
              <p className="text-sm text-muted-foreground">
                Cadastre pessoas e empresas para centralizar seus relacionamentos.
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => navigate('/contacts/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Novo contato
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabela (desktop) */}
          <Card className="premium-panel dark:premium-panel-dark hidden rounded-[1.5rem] md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <TableCell className="font-medium">
                        {contact.trade_name || contact.display_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {KIND_LABELS[contact.kind]}
                      </TableCell>
                      <TableCell>
                        <ContactRoleChips roles={contact.roles} max={3} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatContactPhone(contact.primary_whatsapp || contact.primary_phone) ||
                          contact.primary_email ||
                          '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contact.city || '—'}
                      </TableCell>
                      <TableCell>
                        <ContactStatusBadge status={contact.status} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          contact={contact}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          onView={() => navigate(`/contacts/${contact.id}`)}
                          onEdit={() => navigate(`/contacts/edit/${contact.id}`)}
                          onDelete={() => setPendingDelete(contact)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cards (mobile) */}
          <div className="space-y-3 md:hidden">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="premium-panel dark:premium-panel-dark cursor-pointer rounded-[1.5rem]"
                onClick={() => navigate(`/contacts/${contact.id}`)}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{contact.trade_name || contact.display_name}</p>
                      <p className="text-xs text-muted-foreground">{KIND_LABELS[contact.kind]}</p>
                    </div>
                    <ContactStatusBadge status={contact.status} />
                  </div>
                  <ContactRoleChips roles={contact.roles} max={3} />
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {(contact.primary_whatsapp || contact.primary_phone) && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatContactPhone(contact.primary_whatsapp || contact.primary_phone)}
                      </span>
                    )}
                    {contact.primary_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.primary_email}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Confirmação de inativação */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inativar contato?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.display_name} será inativado e removido das listagens, mas seu
              histórico e vínculos serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDelete) await deleteContact(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Inativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RowActions({
  contact,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ações para ${contact.display_name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Ver ficha
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Inativar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
