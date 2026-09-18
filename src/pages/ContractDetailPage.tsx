import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  Edit,
  FileText,
  Phone,
  Receipt,
  User,
  WalletCards,
} from 'lucide-react';
import { fetchContractById } from '@/api/contracts';
import { ContractAdjustmentForm } from '@/components/contracts/contract-adjustment-form';
import { ContractAdjustmentHistory } from '@/components/contracts/contract-adjustment-history';
import { LinkedContactsSection } from '@/components/contacts/linked-contacts-section';
import { ContractDocumentsSection } from '@/components/documents/contract-documents-section';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { formatCurrency } from '@/lib/format';
import { formatDateBR, parseDateOnly } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { isContractOverdueForRenewal } from '@/lib/contract-status';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  pending: { label: 'Pendente', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  expired: { label: 'Expirado', className: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  canceled: { label: 'Cancelado', className: 'border-border bg-muted text-muted-foreground' },
  draft: { label: 'Rascunho', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
};

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{children}</div>
    </div>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useBackNavigation('/contracts');

  const { data: contract, isLoading, isError } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => fetchContractById(id || ''),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24 rounded-2xl" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1].map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!contract || isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-muted">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Contrato não encontrado</h3>
        <p className="mb-6 max-w-md text-muted-foreground">
          O contrato solicitado não existe, foi excluído ou você não tem permissão para visualizá-lo.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => navigate('/contracts')}>Ver todos os contratos</Button>
        </div>
      </div>
    );
  }

  const needsRenewal = isContractOverdueForRenewal(contract);
  const status = needsRenewal
    ? { label: 'Vencido — renovar', className: STATUS_STYLES.expired.className }
    : STATUS_STYLES[contract.status] || { label: contract.status, className: 'border-border bg-muted' };
  const endDate = parseDateOnly(contract.end_date);
  const daysToEnd = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const paymentDay = contract.payment_due_day || contract.payment_day;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="outline" size="sm" onClick={goBack} className="mt-1 shrink-0">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold md:text-3xl">{contract.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('border', status.className)}>
                {status.label}
              </Badge>
              {contract.status === 'active' && daysToEnd >= 0 && daysToEnd <= 60 && (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  Vence em {daysToEnd} {daysToEnd === 1 ? 'dia' : 'dias'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/contracts/edit/${contract.id}`)} className="self-start">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {needsRenewal && (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          A vigência terminou em {formatDateBR(contract.end_date)}, mas o contrato continua marcado como ativo. Edite o contrato para
          registrar a renovação (nova data de término) ou altere o status para encerrado.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <WalletCards className="h-5 w-5" />
              Condições da locação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Valor mensal">
              <span className="text-lg font-semibold">{formatCurrency(contract.value)}</span>
            </InfoItem>
            <InfoItem label="Vencimento">Todo dia {paymentDay}</InfoItem>
            {contract.deposit_value ? (
              <InfoItem label="Caução / depósito">{formatCurrency(contract.deposit_value)}</InfoItem>
            ) : null}
            <InfoItem label="Início">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDateBR(contract.start_date)}
              </span>
            </InfoItem>
            <InfoItem label="Término">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDateBR(contract.end_date)}
              </span>
            </InfoItem>
            {contract.adjustment_index && (
              <InfoItem label="Reajuste">
                {contract.adjustment_index}
                {contract.adjustment_date ? ` · ${formatDateBR(contract.adjustment_date)}` : ''}
              </InfoItem>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Locatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem label="Nome">
              <span className="text-base font-semibold">{contract.tenant_name}</span>
            </InfoItem>
            {contract.tenant_contact && (
              <InfoItem label="Contato">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contract.tenant_contact}
                </span>
              </InfoItem>
            )}
            {contract.tenant_document && <InfoItem label="Documento">{contract.tenant_document}</InfoItem>}
          </CardContent>
        </Card>

        {contract.property && contract.property_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Imóvel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                to={`/properties/${contract.property_id}`}
                className="group block rounded-3xl border border-border/70 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{contract.property.title}</p>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                {contract.property.address && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[contract.property.address, contract.property.city, contract.property.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </Link>
            </CardContent>
          </Card>
        )}

        {(contract.terms || contract.special_conditions) && (
          <Card className={contract.property ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <CardHeader>
              <CardTitle className="text-lg">Termos e condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.terms && (
                <InfoItem label="Termos">
                  <p className="whitespace-pre-wrap font-normal">{contract.terms}</p>
                </InfoItem>
              )}
              {contract.special_conditions && (
                <InfoItem label="Condições especiais">
                  <p className="whitespace-pre-wrap font-normal">{contract.special_conditions}</p>
                </InfoItem>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ContractDocumentsSection contractId={contract.id} />

      <LinkedContactsSection entity="contract" entityId={contract.id} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Reajustes do contrato
            </CardTitle>
            <ContractAdjustmentForm contractId={contract.id} currentValue={contract.value} />
          </div>
        </CardHeader>
        <CardContent>
          <ContractAdjustmentHistory contractId={contract.id} />
        </CardContent>
      </Card>
    </div>
  );
}
