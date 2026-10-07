import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency } from '@/lib/format';
import { amountFromPercentage, percentageFromAmount } from '@/lib/ownership';
import { cn } from '@/lib/utils';

type ShareInputMode = 'percent' | 'amount';

interface ShareInputProps {
  id?: string;
  /** Percentual 0–100; null = campo vazio. */
  percentage: number | null;
  onPercentageChange: (percentage: number | null) => void;
  /** Valor do bem que dá sentido ao "R$". Sem ele, só o modo percentual fica ativo. */
  referenceValue?: number | null;
  /** Como chamar a referência na dica ("valor de mercado", "VGV"). */
  referenceLabel?: string;
  placeholder?: string;
  className?: string;
  /** Esconde a linha de equivalência abaixo do campo. */
  hideHint?: boolean;
}

const formatPercent = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;

/**
 * Participação digitada em % ou em R$. Quem sabe "minha parte vale R$ 250 mil"
 * não precisa fazer a conta: o campo converte para o percentual que é gravado.
 *
 * Cada modo guarda o próprio rascunho — converter a cada tecla faria o
 * arredondamento do percentual reescrever o valor em reais enquanto se digita.
 */
export const ShareInput: React.FC<ShareInputProps> = ({
  id,
  percentage,
  onPercentageChange,
  referenceValue,
  referenceLabel = 'valor do imóvel',
  placeholder,
  className,
  hideHint = false,
}) => {
  const reference = Number(referenceValue) || 0;
  const canUseAmount = reference > 0;
  const [mode, setMode] = useState<ShareInputMode>('percent');
  const [percentDraft, setPercentDraft] = useState(percentage == null ? '' : String(percentage));
  const [amountDraft, setAmountDraft] = useState(0);

  // Valor externo mudou (reset do formulário, outro registro): realinha os rascunhos.
  useEffect(() => {
    if (mode === 'percent') {
      const parsed = Number(percentDraft.replace(',', '.'));
      if (percentage == null ? percentDraft !== '' : parsed !== percentage) {
        setPercentDraft(percentage == null ? '' : String(percentage));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage]);

  useEffect(() => {
    if (!canUseAmount && mode === 'amount') setMode('percent');
  }, [canUseAmount, mode]);

  const switchMode = (next: ShareInputMode) => {
    if (next === mode) return;
    if (next === 'amount') setAmountDraft(percentage == null ? 0 : amountFromPercentage(percentage, reference));
    else setPercentDraft(percentage == null ? '' : String(percentage));
    setMode(next);
  };

  const handlePercent = (raw: string) => {
    setPercentDraft(raw);
    if (!raw.trim()) {
      onPercentageChange(null);
      return;
    }
    const parsed = Number(raw.replace(',', '.'));
    onPercentageChange(Number.isFinite(parsed) ? parsed : null);
  };

  const handleAmount = (value: number) => {
    setAmountDraft(value);
    onPercentageChange(value > 0 ? percentageFromAmount(value, reference) : null);
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-2">
        {mode === 'percent' ? (
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            min="0.01"
            max="100"
            step="0.01"
            value={percentDraft}
            onChange={(event) => handlePercent(event.target.value)}
            placeholder={placeholder ?? 'Ex.: 50'}
            className="min-w-0 flex-1"
          />
        ) : (
          <div className="min-w-0 flex-1">
            <CurrencyInput id={id} value={amountDraft} onValueChange={(value) => handleAmount(value || 0)} />
          </div>
        )}
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && switchMode(value as ShareInputMode)}
          className="shrink-0 rounded-md border border-input p-0.5"
          aria-label="Informar participação em percentual ou em reais"
        >
          <ToggleGroupItem value="percent" className="h-8 px-2.5 text-xs" aria-label="Em percentual">
            %
          </ToggleGroupItem>
          <ToggleGroupItem
            value="amount"
            className="h-8 px-2.5 text-xs"
            disabled={!canUseAmount}
            aria-label="Em reais"
            title={canUseAmount ? undefined : `Cadastre o ${referenceLabel} para lançar em reais`}
          >
            R$
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {!hideHint && canUseAmount && percentage != null && percentage > 0 && (
        <p className="text-xs text-muted-foreground">
          {mode === 'percent'
            ? `= ${formatCurrency(amountFromPercentage(percentage, reference))} de ${formatCurrency(reference)} (${referenceLabel})`
            : `= ${formatPercent(percentage)} de ${formatCurrency(reference)} (${referenceLabel})`}
        </p>
      )}
    </div>
  );
};
