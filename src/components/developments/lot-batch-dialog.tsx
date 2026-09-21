import React, { useMemo, useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import type { Development } from '@/types/development';
import type { PropertyStatus } from '@/types/property';
import {
  LOT_STATUSES,
  lotTitle,
  validateLotBatch,
  type LotBatchInput,
  type LotPricingMode,
} from '@/types/development-lot';

interface LotBatchDialogProps {
  development: Development;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: LotBatchInput) => Promise<unknown>;
  isSubmitting?: boolean;
}

/**
 * Assistente de criação de lotes em série.
 *
 * Endereço, cidade e coordenadas saem do loteamento; aqui se define só o que
 * varia (quadra, numeração, área e preço), porque ninguém cadastra 40 lotes à mão.
 */
export const LotBatchDialog: React.FC<LotBatchDialogProps> = ({
  development,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}) => {
  const [block, setBlock] = useState('');
  const [firstNumber, setFirstNumber] = useState('1');
  const [lastNumber, setLastNumber] = useState('10');
  const [landArea, setLandArea] = useState('300');
  const [pricingMode, setPricingMode] = useState<LotPricingMode>('per_square_meter');
  const [squareMeterValue, setSquareMeterValue] = useState(0);
  const [fixedValue, setFixedValue] = useState(0);
  const [status, setStatus] = useState<PropertyStatus>('available');

  const input = useMemo<LotBatchInput>(
    () => ({
      block: block.trim() || null,
      firstNumber: Number(firstNumber),
      lastNumber: Number(lastNumber),
      landArea: Number(landArea),
      pricingMode,
      squareMeterValue,
      fixedValue,
      status,
    }),
    [block, firstNumber, lastNumber, landArea, pricingMode, squareMeterValue, fixedValue, status]
  );

  const validation = useMemo(() => validateLotBatch(input), [input]);
  const canSubmit = validation.errors.length === 0 && !isSubmitting;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    try {
      await onConfirm(input);
      onOpenChange(false);
    } catch {
      // O hook já notifica; o diálogo fica aberto para correção.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Gerar lotes
          </DialogTitle>
          <DialogDescription>
            Os lotes herdam endereço, cidade e coordenadas de {development.name}. Numerações que já
            existem na mesma quadra são mantidas como estão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="lot_block">Quadra</Label>
              <Input
                id="lot_block"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="Ex: A"
              />
            </div>
            <div>
              <Label htmlFor="lot_first">Do lote nº</Label>
              <Input
                id="lot_first"
                type="number"
                min="1"
                value={firstNumber}
                onChange={(e) => setFirstNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lot_last">Até o lote nº</Label>
              <Input
                id="lot_last"
                type="number"
                min="1"
                value={lastNumber}
                onChange={(e) => setLastNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lot_area">Área padrão (m²)</Label>
              <Input
                id="lot_area"
                type="number"
                min="1"
                step="0.01"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lot_status">Situação inicial</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PropertyStatus)}>
                <SelectTrigger id="lot_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOT_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lot_pricing">Precificação</Label>
              <Select
                value={pricingMode}
                onValueChange={(value) => setPricingMode(value as LotPricingMode)}
              >
                <SelectTrigger id="lot_pricing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_square_meter">Valor por m²</SelectItem>
                  <SelectItem value="fixed">Valor fechado por lote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              {pricingMode === 'per_square_meter' ? (
                <>
                  <Label htmlFor="lot_sqm">Valor por m²</Label>
                  <CurrencyInput
                    id="lot_sqm"
                    value={squareMeterValue}
                    onValueChange={(value) => setSquareMeterValue(value || 0)}
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="lot_fixed">Valor do lote</Label>
                  <CurrencyInput
                    id="lot_fixed"
                    value={fixedValue}
                    onValueChange={(value) => setFixedValue(value || 0)}
                  />
                </>
              )}
            </div>
          </div>

          {validation.errors.length > 0 ? (
            <ul className="space-y-1 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {validation.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p>
                <strong>{validation.count}</strong>{' '}
                {validation.count === 1 ? 'lote' : 'lotes'} de {input.landArea} m² a{' '}
                {formatCurrency(validation.unitValue)} cada.
              </p>
              <p className="mt-1 text-muted-foreground">
                De {lotTitle(input.block, input.firstNumber)} a{' '}
                {lotTitle(input.block, input.lastNumber)} · VGV{' '}
                {formatCurrency(validation.totalValue)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar {validation.count > 0 ? validation.count : ''} lotes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
