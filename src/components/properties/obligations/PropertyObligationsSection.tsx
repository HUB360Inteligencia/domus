import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Repeat,
  Trash2,
  Undo2,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePropertyObligations } from '@/hooks/use-property-obligations';
import {
  buildRenewalInput,
  canRenew,
  installmentLabelOf,
  isObligationInstallmentOverdue,
  planOf,
} from '@/lib/property-obligations';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/payment-methods';
import { formatCurrency } from '@/lib/format';
import { formatDateBR, toDateOnlyString } from '@/lib/dates';
import { cn } from '@/lib/utils';
import {
  OBLIGATION_FREQUENCY_LABELS,
  OBLIGATION_STATUS_LABELS,
  OBLIGATION_TYPE_LABELS,
  type ObligationInput,
  type ObligationType,
  type PropertyObligation,
  type PropertyObligationInstallment,
  type PropertyObligationWithInstallments,
} from '@/types/property-obligation';
import type { Property } from '@/types/property';
import { ObligationFormDialog } from './ObligationFormDialog';

interface PropertyObligationsSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

const QUICK_TYPES: ObligationType[] = ['iptu', 'condo', 'insurance'];

/** Ações disparadas sem esperar: o hook já mostra o erro em toast. */
const fireAndForget = (promise: Promise<unknown>) => {
  promise.catch(() => undefined);
};

const StatTile: React.FC<{ label: string; value: string; hint?: string; tone?: 'default' | 'warning' }> = ({
  label,
  value,
  hint,
  tone = 'default',
}) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn('mt-1 text-lg font-bold', tone === 'warning' && 'text-amber-600 dark:text-amber-500')}>{value}</p>
    {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const describePlan = (obligation: PropertyObligation) => {
  const plan = planOf(obligation);
  if (plan === 'single') return 'Pagamento único';
  const frequency =
    obligation.frequency === 'once' ? '' : OBLIGATION_FREQUENCY_LABELS[obligation.frequency].toLowerCase();
  if (plan === 'installments') return `${obligation.installments_count}x ${frequency}`;
  return `${OBLIGATION_FREQUENCY_LABELS[obligation.frequency as keyof typeof OBLIGATION_FREQUENCY_LABELS]}, sem fim${
    obligation.end_date ? ` (até ${formatDateBR(obligation.end_date)})` : ''
  }`;
};

const statusBadge = (installment: PropertyObligationInstallment, tenantPays: boolean) => {
  if (installment.status === 'paid') {
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{tenantPays ? 'Confirmado' : 'Pago'}</Badge>
    );
  }
  if (installment.status === 'cancelled') return <Badge variant="outline">Cancelado</Badge>;
  if (isObligationInstallmentOverdue(installment)) return <Badge variant="destructive">Vencido</Badge>;
  return <Badge variant="secondary">Em aberto</Badge>;
};

interface PayingState {
  obligation: PropertyObligationWithInstallments;
  installment: PropertyObligationInstallment;
}

type ConfirmAction =
  | { kind: 'delete'; obligation: PropertyObligationWithInstallments }
  | { kind: 'pause' | 'close'; obligation: PropertyObligationWithInstallments }
  | { kind: 'settle'; obligation: PropertyObligationWithInstallments };

export const PropertyObligationsSection: React.FC<PropertyObligationsSectionProps> = ({
  property,
  isLoading = false,
}) => {
  const {
    obligations,
    summary,
    isLoading: isLoadingObligations,
    createObligation,
    isCreating,
    updateObligation,
    isUpdating,
    changeStatus,
    removeObligation,
    regenerate,
    isRegenerating,
    recordPayment,
    isRecording,
    settleOverdue,
    isSettlingOverdue,
    changeInstallmentStatus,
  } = usePropertyObligations(property?.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyObligation | null>(null);
  const [initialType, setInitialType] = useState<ObligationType>('iptu');
  const [renewalInput, setRenewalInput] = useState<ObligationInput | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [paying, setPaying] = useState<PayingState | null>(null);
  const [paidDate, setPaidDate] = useState(toDateOnlyString());
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [createTransaction, setCreateTransaction] = useState(true);

  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [settleWithTransactions, setSettleWithTransactions] = useState(false);

  const currentYear = new Date().getFullYear();

  const sortedObligations = useMemo(
    () =>
      [...obligations].sort((a, b) => {
        // Ativas primeiro; dentro do grupo, a que vence antes.
        if (a.status !== b.status) return a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0;
        const nextA = a.installments.find((item) => item.status === 'pending')?.due_date ?? '9999';
        const nextB = b.installments.find((item) => item.status === 'pending')?.due_date ?? '9999';
        return nextA.localeCompare(nextB);
      }),
    [obligations]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!property) return null;

  const openCreate = (type: ObligationType) => {
    setEditing(null);
    setRenewalInput(null);
    setInitialType(type);
    setFormOpen(true);
  };

  const openEdit = (obligation: PropertyObligation) => {
    setEditing(obligation);
    setRenewalInput(null);
    setFormOpen(true);
  };

  const openRenewal = (obligation: PropertyObligation) => {
    setEditing(null);
    setRenewalInput(buildRenewalInput(obligation));
    setInitialType(obligation.obligation_type);
    setFormOpen(true);
  };

  const handleSubmit = async (input: ObligationInput) => {
    if (editing) {
      await updateObligation({ id: editing.id, input });
      return;
    }
    await createObligation(input);
  };

  const openPayment = (obligation: PropertyObligationWithInstallments, installment: PropertyObligationInstallment) => {
    setPaying({ obligation, installment });
    setPaidDate(toDateOnlyString());
    setPaidAmount(Number(installment.amount) || 0);
    setPaymentMethod('');
    setCreateTransaction(obligation.paid_by === 'owner');
  };

  const confirmPayment = async () => {
    if (!paying) return;
    try {
      await recordPayment({
        id: paying.installment.id,
        paidDate,
        paidAmount,
        paymentMethod: paymentMethod || null,
        createTransaction,
      });
      setPaying(null);
    } catch {
      // O hook já notifica; o diálogo fica aberto para nova tentativa.
    }
  };

  const runConfirmedAction = async () => {
    if (!confirm) return;
    const { obligation } = confirm;
    try {
      if (confirm.kind === 'delete') await removeObligation(obligation.id);
      if (confirm.kind === 'pause') await changeStatus({ id: obligation.id, status: 'paused' });
      if (confirm.kind === 'close') await changeStatus({ id: obligation.id, status: 'closed' });
      if (confirm.kind === 'settle') {
        await settleOverdue({ obligation, createTransaction: settleWithTransactions && obligation.paid_by === 'owner' });
      }
    } catch {
      // O hook já notifica o erro.
    } finally {
      setConfirm(null);
    }
  };

  const toggleExpanded = (id: string) => setExpanded((previous) => ({ ...previous, [id]: !previous[id] }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ReceiptText className="h-5 w-5" />
              Contas do imóvel
            </CardTitle>
            <CardDescription className="mt-1">
              IPTU, condomínio, seguro e outras contas com vencimento. Tudo entra na Agenda e o sino avisa antes de
              vencer.
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Plus className="h-4 w-4" />
                Nova conta
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(OBLIGATION_TYPE_LABELS) as ObligationType[]).map((type) => (
                <DropdownMenuItem key={type} onClick={() => openCreate(type)}>
                  {OBLIGATION_TYPE_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoadingObligations ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : obligations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma conta cadastrada. Comece pelas mais comuns:
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {QUICK_TYPES.map((type) => (
                  <Button key={type} variant="outline" size="sm" onClick={() => openCreate(type)}>
                    <Plus className="h-3.5 w-3.5" />
                    {OBLIGATION_TYPE_LABELS[type]}
                    {type === 'condo' && Number(property.condo_fee) > 0 && (
                      <span className="text-muted-foreground">({formatCurrency(property.condo_fee)})</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Próximo vencimento"
                  value={summary.nextDue ? formatDateBR(summary.nextDue.due_date) : '—'}
                  hint={
                    summary.nextDue
                      ? `${summary.nextDue.obligation.title} · ${formatCurrency(summary.nextDue.amount)}`
                      : 'Nada em aberto'
                  }
                />
                <StatTile
                  label="A pagar em 12 meses"
                  value={formatCurrency(summary.next12MonthsAmount)}
                  hint={`${summary.pendingCount} vencimento(s) em aberto`}
                />
                <StatTile
                  label="Vencido"
                  value={formatCurrency(summary.overdueAmount)}
                  hint={summary.overdueCount > 0 ? `${summary.overdueCount} vencimento(s)` : 'Em dia'}
                  tone={summary.overdueCount > 0 ? 'warning' : 'default'}
                />
                <StatTile label={`Pago em ${currentYear}`} value={formatCurrency(summary.paidThisYearAmount)} />
              </div>

              {summary.overdueCount > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                  <span>
                    {summary.overdueCount === 1
                      ? '1 vencimento passou sem baixa.'
                      : `${summary.overdueCount} vencimentos passaram sem baixa.`}{' '}
                    Se já foram pagos, registre a baixa para os avisos pararem.
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {sortedObligations.map((obligation) => {
                  const tenantPays = obligation.paid_by === 'tenant';
                  const active = obligation.installments.filter((item) => item.status !== 'cancelled');
                  const paidCount = active.filter((item) => item.status === 'paid').length;
                  const overdue = obligation.installments.filter((item) => isObligationInstallmentOverdue(item));
                  const next = obligation.installments.find((item) => item.status === 'pending');
                  const isOpen = expanded[obligation.id] ?? false;
                  const plan = planOf(obligation);

                  return (
                    <div key={obligation.id} className="rounded-xl border border-border">
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{OBLIGATION_TYPE_LABELS[obligation.obligation_type]}</Badge>
                            <span className="font-semibold">{obligation.title}</span>
                            {tenantPays && (
                              <Badge variant="secondary" className="gap-1">
                                <UserRound className="h-3 w-3" />
                                Inquilino paga
                              </Badge>
                            )}
                            {obligation.status !== 'active' && (
                              <Badge variant="outline" className="text-muted-foreground">
                                {OBLIGATION_STATUS_LABELS[obligation.status]}
                              </Badge>
                            )}
                            {overdue.length > 0 && (
                              <Badge variant="destructive">
                                {overdue.length} vencido{overdue.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {describePlan(obligation)}
                            {plan !== 'recurring' && active.length > 0 && ` · ${paidCount}/${active.length} pagas`}
                            {next && ` · próximo ${formatDateBR(next.due_date)} (${formatCurrency(next.amount)})`}
                            {obligation.creditor_name && ` · ${obligation.creditor_name}`}
                          </p>
                          {obligation.reference_code && (
                            <p className="text-xs text-muted-foreground">Inscrição/código: {obligation.reference_code}</p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {next && (
                            <Button size="sm" variant="outline" onClick={() => openPayment(obligation, next)}>
                              <CheckCircle2 className="h-4 w-4" />
                              {tenantPays ? 'Confirmar' : 'Pagar'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpanded(obligation.id)}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="hidden sm:inline">Vencimentos</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" aria-label="Mais ações">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(obligation)}>
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {canRenew(obligation) && (
                                <DropdownMenuItem onClick={() => openRenewal(obligation)}>
                                  <Repeat className="h-4 w-4" />
                                  Renovar para {obligation.reference_year ? obligation.reference_year + 1 : 'o próximo ano'}
                                </DropdownMenuItem>
                              )}
                              {overdue.length > 0 && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSettleWithTransactions(false);
                                    setConfirm({ kind: 'settle', obligation });
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Baixar vencidos ({overdue.length})
                                </DropdownMenuItem>
                              )}
                              {obligation.status === 'active' && (
                                <DropdownMenuItem
                                  onClick={() => fireAndForget(regenerate(obligation.id))}
                                  disabled={isRegenerating}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  Recalcular em aberto
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {obligation.status === 'active' ? (
                                <>
                                  <DropdownMenuItem onClick={() => setConfirm({ kind: 'pause', obligation })}>
                                    Pausar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setConfirm({ kind: 'close', obligation })}>
                                    Encerrar
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => fireAndForget(changeStatus({ id: obligation.id, status: 'active' }))}
                                >
                                  <Undo2 className="h-4 w-4" />
                                  Reativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setConfirm({ kind: 'delete', obligation })}
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="max-h-[420px] overflow-auto border-t border-border">
                          {obligation.installments.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">
                              Nenhum vencimento gerado.{' '}
                              {obligation.status === 'active'
                                ? 'Use "Recalcular em aberto" no menu.'
                                : 'Reative a conta para gerar o calendário.'}
                            </p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Parcela</TableHead>
                                  <TableHead>Vencimento</TableHead>
                                  <TableHead className="text-right">Valor</TableHead>
                                  <TableHead>Situação</TableHead>
                                  <TableHead>Pagamento</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {obligation.installments.map((installment) => (
                                  <TableRow key={installment.id}>
                                    <TableCell className="font-medium capitalize">
                                      {installmentLabelOf(installment, obligation)}
                                    </TableCell>
                                    <TableCell>{formatDateBR(installment.due_date)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(installment.amount)}</TableCell>
                                    <TableCell>{statusBadge(installment, tenantPays)}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {installment.paid_date ? formatDateBR(installment.paid_date) : '—'}
                                      {installment.paid_amount != null &&
                                        Math.abs(installment.paid_amount - installment.amount) >= 0.01 && (
                                          <span className="block text-xs">{formatCurrency(installment.paid_amount)}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {installment.status === 'pending' && (
                                        <div className="flex justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openPayment(obligation, installment)}
                                          >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {tenantPays ? 'Confirmar' : 'Pagar'}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            aria-label="Cancelar vencimento"
                                            onClick={() =>
                                              fireAndForget(
                                                changeInstallmentStatus({ id: installment.id, status: 'cancelled' })
                                              )
                                            }
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                      {installment.status === 'cancelled' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            fireAndForget(
                                              changeInstallmentStatus({ id: installment.id, status: 'pending' })
                                            )
                                          }
                                        >
                                          <Undo2 className="h-4 w-4" />
                                          Reativar
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ObligationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        obligation={editing}
        initialType={initialType}
        initialInput={renewalInput}
        property={{ city: property.city, condo_fee: property.condo_fee }}
        isSaving={isCreating || isUpdating}
        onSubmit={handleSubmit}
      />

      <Dialog open={!!paying} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              {paying?.obligation.paid_by === 'tenant' ? 'Confirmar pagamento' : 'Registrar pagamento'}
            </DialogTitle>
            <DialogDescription>
              {paying &&
                `${paying.obligation.title} · ${installmentLabelOf(paying.installment, paying.obligation)} · vence ${formatDateBR(
                  paying.installment.due_date
                )}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="obligation_paid_date">Data do pagamento</Label>
                <Input
                  id="obligation_paid_date"
                  type="date"
                  value={paidDate}
                  onChange={(event) => setPaidDate(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="obligation_paid_amount">Valor pago</Label>
                <CurrencyInput
                  id="obligation_paid_amount"
                  value={paidAmount}
                  onValueChange={(value) => setPaidAmount(value || 0)}
                />
              </div>
            </div>
            {paying && Math.abs(paidAmount - paying.installment.amount) >= 0.01 && paidAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                {paidAmount > paying.installment.amount ? 'Juros/multa de ' : 'Desconto de '}
                {formatCurrency(Math.abs(paidAmount - paying.installment.amount))} sobre o previsto.
              </p>
            )}

            {paying?.obligation.paid_by === 'owner' ? (
              <>
                <div>
                  <Label htmlFor="obligation_paid_method">Meio de pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="obligation_paid_method">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={createTransaction}
                    onCheckedChange={(checked) => setCreateTransaction(checked === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Lançar despesa no financeiro
                    <span className="block text-xs text-muted-foreground">
                      Desmarque se esta despesa já foi lançada manualmente.
                    </span>
                  </span>
                </label>
              </>
            ) : (
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Conta paga pelo inquilino: a baixa só registra a confirmação, sem lançar despesa.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmPayment} disabled={isRecording || !paidDate || paidAmount <= 0}>
              {isRecording && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'delete' && 'Excluir conta?'}
              {confirm?.kind === 'pause' && 'Pausar conta?'}
              {confirm?.kind === 'close' && 'Encerrar conta?'}
              {confirm?.kind === 'settle' && 'Baixar vencimentos vencidos?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'delete' &&
                `"${confirm.obligation.title}" e todo o calendário serão removidos. Despesas já lançadas continuam no financeiro.`}
              {(confirm?.kind === 'pause' || confirm?.kind === 'close') &&
                'Os vencimentos em aberto saem do calendário e param de gerar avisos. Os já pagos ficam como histórico.'}
              {confirm?.kind === 'settle' &&
                'Cada vencimento vencido recebe baixa com a data do próprio vencimento. Use quando eles já foram pagos.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirm?.kind === 'settle' && confirm.obligation.paid_by === 'owner' && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={settleWithTransactions}
                onCheckedChange={(checked) => setSettleWithTransactions(checked === true)}
                className="mt-0.5"
              />
              <span>
                Lançar as despesas no financeiro
                <span className="block text-xs text-muted-foreground">
                  Marque só se elas ainda não foram lançadas, para não duplicar.
                </span>
              </span>
            </label>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void runConfirmedAction();
              }}
              disabled={isSettlingOverdue}
              className={cn(
                confirm?.kind === 'delete' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              {isSettlingOverdue && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirm?.kind === 'delete' && 'Excluir'}
              {confirm?.kind === 'pause' && 'Pausar'}
              {confirm?.kind === 'close' && 'Encerrar'}
              {confirm?.kind === 'settle' && 'Baixar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
