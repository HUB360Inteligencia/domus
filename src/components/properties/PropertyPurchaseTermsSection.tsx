import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Handshake,
  Loader2,
  RefreshCw,
  Undo2,
  XCircle,
} from 'lucide-react';
import { Property } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  usePropertyPurchaseInstallments,
  isInstallmentOverdue,
} from '@/hooks/use-property-purchase-installments';
import {
  INSTALLMENT_FREQUENCY_LABELS,
  PAYMENT_TYPE_LABELS,
  PURCHASE_INDEX_LABELS,
  hasInstallmentSchedule,
  installmentLabel,
  type PropertyPurchaseInstallment,
} from '@/types/property-purchase';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/payment-methods';
import { formatCurrency } from '@/lib/format';
import { formatDateBR, toDateOnlyString } from '@/lib/dates';

interface PropertyPurchaseTermsSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right">{value}</span>
  </div>
);

const StatTile: React.FC<{ label: string; value: string; hint?: string; tone?: 'default' | 'warning' }> = ({
  label,
  value,
  hint,
  tone = 'default',
}) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 text-lg font-bold ${tone === 'warning' ? 'text-amber-600 dark:text-amber-500' : ''}`}>
      {value}
    </p>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const statusBadge = (installment: PropertyPurchaseInstallment) => {
  if (installment.status === 'paid') {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Paga</Badge>;
  }
  if (installment.status === 'cancelled') {
    return <Badge variant="outline">Cancelada</Badge>;
  }
  if (isInstallmentOverdue(installment)) {
    return <Badge variant="destructive">Vencida</Badge>;
  }
  return <Badge variant="secondary">Em aberto</Badge>;
};

export const PropertyPurchaseTermsSection: React.FC<PropertyPurchaseTermsSectionProps> = ({
  property,
  isLoading = false,
}) => {
  const {
    installments,
    summary,
    isLoading: isLoadingSchedule,
    generateSchedule,
    isGenerating,
    recordPayment,
    isRecording,
    changeStatus,
    clearSchedule,
    isClearing,
  } = usePropertyPurchaseInstallments(property?.id);

  const [payingInstallment, setPayingInstallment] = useState<PropertyPurchaseInstallment | null>(null);
  const [paidDate, setPaidDate] = useState(toDateOnlyString());
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  const openPaymentDialog = (installment: PropertyPurchaseInstallment) => {
    setPayingInstallment(installment);
    setPaidDate(toDateOnlyString());
    setPaymentMethod('');
  };

  const confirmPayment = async () => {
    if (!payingInstallment) return;
    try {
      await recordPayment({
        id: payingInstallment.id,
        paidDate,
        paymentMethod: paymentMethod || null,
      });
      setPayingInstallment(null);
    } catch {
      // O hook já notifica o erro; o diálogo fica aberto para nova tentativa.
    }
  };

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

  const showSchedule = hasInstallmentSchedule(property.payment_type);
  const totalInstallments = property.installments_count ?? undefined;

  // Sem forma de compra informada e sem parcelas: convida a preencher no cadastro.
  if (!property.payment_type && installments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Handshake className="h-5 w-5" />
            Forma de Compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma forma de compra registrada. Informe em <strong>Editar imóvel</strong> para
            acompanhar entrada, parcelas e vencimentos aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Handshake className="h-5 w-5" />
            Forma de Compra
          </CardTitle>
          {property.payment_type && (
            <Badge variant="outline" className="text-sm">
              {PAYMENT_TYPE_LABELS[property.payment_type] ?? property.payment_type}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 md:grid-cols-2">
            <div className="divide-y divide-border">
              <InfoRow label="Valor de compra" value={formatCurrency(property.purchase_value)} />
              <InfoRow
                label="Data da compra"
                value={property.purchase_date ? formatDateBR(property.purchase_date) : '—'}
              />
              <InfoRow
                label="Entrada / sinal"
                value={property.down_payment ? formatCurrency(property.down_payment) : '—'}
              />
              <InfoRow label="Credor" value={property.creditor_name || '—'} />
            </div>
            <div className="divide-y divide-border">
              <InfoRow
                label="Parcelas"
                value={
                  property.installments_count
                    ? `${property.installments_count}x ${
                        property.installment_amount ? formatCurrency(property.installment_amount) : ''
                      }`.trim()
                    : '—'
                }
              />
              <InfoRow
                label="Periodicidade"
                value={
                  property.installment_frequency
                    ? INSTALLMENT_FREQUENCY_LABELS[property.installment_frequency] ??
                      property.installment_frequency
                    : '—'
                }
              />
              <InfoRow
                label="1º vencimento"
                value={
                  property.first_installment_date ? formatDateBR(property.first_installment_date) : '—'
                }
              />
              <InfoRow
                label="Correção"
                value={
                  property.purchase_index
                    ? PURCHASE_INDEX_LABELS[property.purchase_index] ?? property.purchase_index
                    : '—'
                }
              />
            </div>
          </div>

          {property.purchase_notes && (
            <>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {property.purchase_notes}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {showSchedule && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5" />
              Cronograma de Parcelas
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateSchedule()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {installments.length === 0 ? 'Gerar parcelas' : 'Regerar em aberto'}
              </Button>
              {installments.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isClearing}>
                      <XCircle className="h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cronograma?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todas as {installments.length} parcelas serão removidas, inclusive as pagas.
                        As despesas já lançadas no financeiro permanecem.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearSchedule()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoadingSchedule ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : installments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma parcela gerada ainda. Use <strong>Gerar parcelas</strong> para montar o
                  cronograma a partir da condição de pagamento.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatTile label="Total do cronograma" value={formatCurrency(summary.total)} />
                  <StatTile
                    label="Pago"
                    value={formatCurrency(summary.paidAmount)}
                    hint={`${summary.paidCount} de ${summary.paidCount + summary.pendingCount}`}
                  />
                  <StatTile
                    label="Em aberto"
                    value={formatCurrency(summary.pendingAmount)}
                    hint={
                      summary.nextDue
                        ? `Próxima em ${formatDateBR(summary.nextDue.due_date)}`
                        : 'Nada a vencer'
                    }
                  />
                  <StatTile
                    label="Vencido"
                    value={formatCurrency(summary.overdueAmount)}
                    hint={summary.overdueCount > 0 ? `${summary.overdueCount} parcela(s)` : 'Em dia'}
                    tone={summary.overdueCount > 0 ? 'warning' : 'default'}
                  />
                </div>

                {summary.overdueCount > 0 && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                    <span>
                      {summary.overdueCount === 1
                        ? '1 parcela venceu e ainda não foi baixada.'
                        : `${summary.overdueCount} parcelas venceram e ainda não foram baixadas.`}
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto">
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
                      {installments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell className="font-medium">
                            {installmentLabel(installment, totalInstallments)}
                          </TableCell>
                          <TableCell>{formatDateBR(installment.due_date)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(installment.amount)}
                          </TableCell>
                          <TableCell>{statusBadge(installment)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {installment.paid_date ? formatDateBR(installment.paid_date) : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {installment.status === 'pending' && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPaymentDialog(installment)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Dar baixa
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    changeStatus({ id: installment.id, status: 'cancelled' })
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
                                onClick={() => changeStatus({ id: installment.id, status: 'pending' })}
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!payingInstallment} onOpenChange={(open) => !open && setPayingInstallment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Dar baixa —{' '}
              {payingInstallment ? installmentLabel(payingInstallment, totalInstallments) : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Será lançada uma despesa de{' '}
              <strong>{formatCurrency(payingInstallment?.amount ?? 0)}</strong> neste imóvel.
            </p>

            <div>
              <Label htmlFor="paid_date">Data do pagamento</Label>
              <Input
                id="paid_date"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="paid_method">Meio de pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paid_method">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingInstallment(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmPayment} disabled={isRecording || !paidDate}>
              {isRecording && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
