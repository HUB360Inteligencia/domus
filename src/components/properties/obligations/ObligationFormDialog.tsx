import React, { useEffect, useMemo, useState } from 'react';
import { addMonths, setDate } from 'date-fns';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatCurrency } from '@/lib/format';
import { formatDateBR, toDateOnlyString } from '@/lib/dates';
import {
  isYearlyType,
  planOf,
  previewObligationSchedule,
  validateObligationInput,
} from '@/lib/property-obligations';
import {
  OBLIGATION_FREQUENCY_LABELS,
  OBLIGATION_PAID_BY_LABELS,
  OBLIGATION_PLAN_LABELS,
  OBLIGATION_TYPE_LABELS,
  type ObligationFrequency,
  type ObligationInput,
  type ObligationPaidBy,
  type ObligationPlan,
  type ObligationType,
  type PropertyObligation,
} from '@/types/property-obligation';

type RepeatingFrequency = Exclude<ObligationFrequency, 'once'>;

interface FormState {
  obligation_type: ObligationType;
  title: string;
  reference_year: string;
  plan: ObligationPlan;
  frequency: RepeatingFrequency;
  installments_count: string;
  /** Numa série parcelada, o valor digitado pode ser o total ou o de cada parcela. */
  amount_mode: 'total' | 'installment';
  amount: number;
  first_due_date: string;
  end_date: string;
  paid_by: ObligationPaidBy;
  reminder_days: string;
  creditor_name: string;
  reference_code: string;
  notes: string;
}

export interface ObligationPropertyContext {
  city?: string | null;
  condo_fee?: number | null;
}

/** Dia 10 do mês que vem: um primeiro vencimento plausível para quase toda conta. */
const defaultFirstDueDate = () => toDateOnlyString(setDate(addMonths(new Date(), 1), 10));

/** Valores iniciais de cada tipo de conta — o que a maioria dos imóveis tem. */
const presetFor = (type: ObligationType, property?: ObligationPropertyContext): Partial<FormState> => {
  const year = new Date().getFullYear();

  switch (type) {
    case 'iptu':
      return {
        title: `IPTU ${year}`,
        reference_year: String(year),
        plan: 'installments',
        frequency: 'monthly',
        installments_count: '10',
        amount_mode: 'total',
        creditor_name: property?.city ? `Prefeitura de ${property.city}` : '',
        reminder_days: '5',
      };
    case 'condo':
      return {
        title: 'Condomínio',
        reference_year: '',
        plan: 'recurring',
        frequency: 'monthly',
        installments_count: '',
        amount_mode: 'installment',
        amount: Number(property?.condo_fee) || 0,
        reminder_days: '5',
      };
    case 'insurance':
      return {
        title: 'Seguro do imóvel',
        reference_year: '',
        plan: 'single',
        frequency: 'annual',
        installments_count: '',
        amount_mode: 'total',
        reminder_days: '15',
      };
    case 'itr':
      return {
        title: `ITR ${year}`,
        reference_year: String(year),
        plan: 'single',
        frequency: 'monthly',
        installments_count: '',
        amount_mode: 'total',
        creditor_name: 'Receita Federal',
        reminder_days: '10',
      };
    case 'waste_fee':
      return {
        title: `Taxa de lixo ${year}`,
        reference_year: String(year),
        plan: 'single',
        frequency: 'monthly',
        installments_count: '',
        amount_mode: 'total',
        creditor_name: property?.city ? `Prefeitura de ${property.city}` : '',
        reminder_days: '5',
      };
    case 'utility':
      return {
        title: 'Água / luz',
        reference_year: '',
        plan: 'recurring',
        frequency: 'monthly',
        installments_count: '',
        amount_mode: 'installment',
        reminder_days: '3',
      };
    default:
      return {
        title: '',
        reference_year: '',
        plan: 'recurring',
        frequency: 'monthly',
        installments_count: '',
        amount_mode: 'installment',
        reminder_days: '5',
      };
  }
};

const emptyState = (type: ObligationType, property?: ObligationPropertyContext): FormState => ({
  obligation_type: type,
  title: '',
  reference_year: '',
  plan: 'recurring',
  frequency: 'monthly',
  installments_count: '',
  amount_mode: 'installment',
  amount: 0,
  first_due_date: defaultFirstDueDate(),
  end_date: '',
  paid_by: 'owner',
  reminder_days: '5',
  creditor_name: '',
  reference_code: '',
  notes: '',
  ...presetFor(type, property),
});

const stateFromObligation = (obligation: PropertyObligation): FormState => {
  const plan = planOf(obligation);
  const usesInstallmentAmount = Number(obligation.installment_amount) > 0;

  return {
    obligation_type: obligation.obligation_type,
    title: obligation.title,
    reference_year: obligation.reference_year ? String(obligation.reference_year) : '',
    plan,
    frequency: obligation.frequency === 'once' ? 'monthly' : obligation.frequency,
    installments_count: plan === 'installments' ? String(obligation.installments_count ?? '') : '',
    amount_mode: usesInstallmentAmount ? 'installment' : 'total',
    amount: Number(usesInstallmentAmount ? obligation.installment_amount : obligation.total_amount) || 0,
    first_due_date: obligation.first_due_date,
    end_date: obligation.end_date ?? '',
    paid_by: obligation.paid_by,
    reminder_days: String(obligation.reminder_days ?? 5),
    creditor_name: obligation.creditor_name ?? '',
    reference_code: obligation.reference_code ?? '',
    notes: obligation.notes ?? '',
  };
};

const toInput = (state: FormState): ObligationInput => {
  const base = {
    obligation_type: state.obligation_type,
    title: state.title,
    reference_year: state.reference_year ? Number(state.reference_year) : null,
    first_due_date: state.first_due_date,
    paid_by: state.paid_by,
    reminder_days: Number(state.reminder_days) || 0,
    creditor_name: state.creditor_name,
    reference_code: state.reference_code,
    notes: state.notes,
  };

  if (state.plan === 'single') {
    return {
      ...base,
      frequency: 'once',
      installments_count: 1,
      installment_amount: state.amount || null,
      total_amount: state.amount || null,
      end_date: null,
    };
  }

  if (state.plan === 'installments') {
    return {
      ...base,
      frequency: state.frequency,
      installments_count: Number(state.installments_count) || null,
      installment_amount: state.amount_mode === 'installment' ? state.amount || null : null,
      total_amount: state.amount_mode === 'total' ? state.amount || null : null,
      end_date: null,
    };
  }

  return {
    ...base,
    frequency: state.frequency,
    installments_count: null,
    installment_amount: state.amount || null,
    total_amount: null,
    end_date: state.end_date || null,
  };
};

interface ObligationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Conta em edição; ausente = nova conta. */
  obligation?: PropertyObligation | null;
  /** Tipo inicial de uma nova conta (atalhos "IPTU", "Condomínio"...). */
  initialType?: ObligationType;
  /** Dados de partida para criar (ex.: renovação para o próximo ano). */
  initialInput?: ObligationInput | null;
  property?: ObligationPropertyContext;
  isSaving?: boolean;
  onSubmit: (input: ObligationInput) => Promise<void>;
}

export const ObligationFormDialog: React.FC<ObligationFormDialogProps> = ({
  open,
  onOpenChange,
  obligation,
  initialType = 'iptu',
  initialInput,
  property,
  isSaving = false,
  onSubmit,
}) => {
  const [state, setState] = useState<FormState>(() => emptyState(initialType, property));
  const [errors, setErrors] = useState<string[]>([]);
  const isEditing = !!obligation;

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    if (obligation) setState(stateFromObligation(obligation));
    else if (initialInput) {
      setState(stateFromObligation({ ...initialInput, status: 'active' } as PropertyObligation));
    } else setState(emptyState(initialType, property));
    // Reinicia só ao abrir: mudanças do imóvel durante a edição não devem apagar o que foi digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, obligation, initialInput, initialType]);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setState((previous) => ({ ...previous, [field]: value }));

  const changeType = (type: ObligationType) => {
    // Numa conta nova, o tipo traz junto os valores típicos; na edição, só troca o tipo.
    setState((previous) =>
      isEditing ? { ...previous, obligation_type: type } : { ...emptyState(type, property), first_due_date: previous.first_due_date }
    );
  };

  const input = useMemo(() => toInput(state), [state]);
  const preview = useMemo(() => previewObligationSchedule(input), [input]);
  const todayKey = toDateOnlyString();
  const pastCount = preview.filter((item) => item.due_date < todayKey).length;
  const previewTotal = preview.reduce((sum, item) => sum + item.amount, 0);
  const showYear = isYearlyType(state.obligation_type) || !!state.reference_year;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateObligationInput(input);
    setErrors(validation);
    if (validation.length > 0) return;

    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch {
      // O hook já notifica; o diálogo fica aberto para corrigir.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar conta do imóvel' : 'Nova conta do imóvel'}</DialogTitle>
          <DialogDescription>
            O Domus monta o calendário de vencimentos, mostra na Agenda e avisa antes de vencer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="obligation_type">Tipo</Label>
              <Select value={state.obligation_type} onValueChange={(value) => changeType(value as ObligationType)}>
                <SelectTrigger id="obligation_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OBLIGATION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="obligation_title">Descrição</Label>
              <Input
                id="obligation_title"
                value={state.title}
                onChange={(event) => set('title', event.target.value)}
                placeholder="Ex.: IPTU 2027, Condomínio, Seguro incêndio"
              />
            </div>
          </div>

          <div>
            <Label>Forma de pagamento</Label>
            <ToggleGroup
              type="single"
              value={state.plan}
              onValueChange={(value) => value && set('plan', value as ObligationPlan)}
              className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1"
            >
              {(Object.keys(OBLIGATION_PLAN_LABELS) as ObligationPlan[]).map((plan) => (
                <ToggleGroupItem key={plan} value={plan} className="rounded-lg text-xs sm:text-sm">
                  {OBLIGATION_PLAN_LABELS[plan]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {state.plan === 'single' && 'Um vencimento só — cota única do IPTU, apólice anual paga à vista.'}
              {state.plan === 'installments' && 'Número fixo de parcelas — IPTU em 10x, seguro em 4x.'}
              {state.plan === 'recurring' &&
                'Repete sem fim definido — condomínio. O Domus mantém sempre 12 meses à frente.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {state.plan === 'installments' && (
              <div>
                <Label htmlFor="obligation_count">Número de parcelas</Label>
                <Input
                  id="obligation_count"
                  type="number"
                  min="1"
                  max="600"
                  value={state.installments_count}
                  onChange={(event) => set('installments_count', event.target.value)}
                  placeholder="Ex.: 10"
                />
              </div>
            )}

            {state.plan !== 'single' && (
              <div>
                <Label htmlFor="obligation_frequency">Periodicidade</Label>
                <Select
                  value={state.frequency}
                  onValueChange={(value) => set('frequency', value as RepeatingFrequency)}
                >
                  <SelectTrigger id="obligation_frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OBLIGATION_FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="obligation_amount">
                  {state.plan === 'single'
                    ? 'Valor'
                    : state.plan === 'recurring'
                      ? 'Valor de cada vencimento'
                      : state.amount_mode === 'total'
                        ? 'Valor total'
                        : 'Valor de cada parcela'}
                </Label>
                {state.plan === 'installments' && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => set('amount_mode', state.amount_mode === 'total' ? 'installment' : 'total')}
                  >
                    {state.amount_mode === 'total' ? 'Informar por parcela' : 'Informar o total'}
                  </button>
                )}
              </div>
              <CurrencyInput
                id="obligation_amount"
                value={state.amount}
                onValueChange={(value) => set('amount', value || 0)}
              />
            </div>

            <div>
              <Label htmlFor="obligation_first_due">
                {state.plan === 'single' ? 'Vencimento' : '1º vencimento'}
              </Label>
              <Input
                id="obligation_first_due"
                type="date"
                value={state.first_due_date}
                onChange={(event) => set('first_due_date', event.target.value)}
              />
            </div>

            {state.plan === 'recurring' && (
              <div>
                <Label htmlFor="obligation_end">Até (opcional)</Label>
                <Input
                  id="obligation_end"
                  type="date"
                  value={state.end_date}
                  onChange={(event) => set('end_date', event.target.value)}
                />
              </div>
            )}

            {showYear && (
              <div>
                <Label htmlFor="obligation_year">Exercício</Label>
                <Input
                  id="obligation_year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={state.reference_year}
                  onChange={(event) => set('reference_year', event.target.value)}
                  placeholder={String(new Date().getFullYear())}
                />
              </div>
            )}
          </div>

          {preview.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              {state.plan === 'recurring' ? (
                <p>
                  {formatCurrency(preview[0].amount)} por vencimento, a partir de{' '}
                  {formatDateBR(preview[0].due_date)}.{' '}
                  <span className="text-muted-foreground">
                    {preview.length} vencimento(s) gerado(s) agora; os seguintes entram automaticamente.
                  </span>
                </p>
              ) : (
                <p>
                  {preview.length > 1 ? `${preview.length}x ` : ''}
                  {preview.length > 1 && preview[0].amount !== preview[preview.length - 1].amount
                    ? `${formatCurrency(preview[0].amount)} (última ${formatCurrency(preview[preview.length - 1].amount)})`
                    : formatCurrency(preview[0].amount)}
                  {preview.length > 1 && (
                    <>
                      {' '}= <strong>{formatCurrency(previewTotal)}</strong>, de {formatDateBR(preview[0].due_date)} a{' '}
                      {formatDateBR(preview[preview.length - 1].due_date)}
                    </>
                  )}
                  {preview.length === 1 && <> em {formatDateBR(preview[0].due_date)}</>}.
                </p>
              )}
              {pastCount > 0 && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-500">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {pastCount === 1
                    ? '1 vencimento já passou e entra como vencido.'
                    : `${pastCount} vencimentos já passaram e entram como vencidos.`}{' '}
                  Se já foram pagos, use "Baixar vencidos" depois de salvar.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="obligation_paid_by">Quem paga</Label>
              <Select value={state.paid_by} onValueChange={(value) => set('paid_by', value as ObligationPaidBy)}>
                <SelectTrigger id="obligation_paid_by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OBLIGATION_PAID_BY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {state.paid_by === 'owner'
                  ? 'A baixa lança a despesa no financeiro.'
                  : 'O aviso pede para confirmar que o inquilino pagou; nada é lançado como despesa.'}
              </p>
            </div>

            <div>
              <Label htmlFor="obligation_reminder">Avisar com antecedência de (dias)</Label>
              <Input
                id="obligation_reminder"
                type="number"
                min="0"
                max="90"
                value={state.reminder_days}
                onChange={(event) => set('reminder_days', event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="obligation_creditor">Favorecido</Label>
              <Input
                id="obligation_creditor"
                value={state.creditor_name}
                onChange={(event) => set('creditor_name', event.target.value)}
                placeholder="Prefeitura, administradora, seguradora..."
              />
            </div>

            <div>
              <Label htmlFor="obligation_code">Inscrição / código</Label>
              <Input
                id="obligation_code"
                value={state.reference_code}
                onChange={(event) => set('reference_code', event.target.value)}
                placeholder="Inscrição imobiliária, nº da apólice..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="obligation_notes">Observações</Label>
            <Textarea
              id="obligation_notes"
              rows={2}
              value={state.notes}
              onChange={(event) => set('notes', event.target.value)}
              placeholder="Desconto da cota única, débito automático, onde retirar o boleto..."
            />
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <ul className="list-inside list-disc space-y-0.5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {isEditing && (
            <p className="text-xs text-muted-foreground">
              Ao salvar, os vencimentos em aberto são recalculados. Os já pagos não mudam.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar alterações' : 'Cadastrar conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
