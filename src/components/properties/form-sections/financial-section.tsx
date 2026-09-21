import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DollarSign, Handshake } from 'lucide-react';
import { PropertyFormData } from '@/types/property';
import {
  INSTALLMENT_FREQUENCY_LABELS,
  PAYMENT_TYPE_LABELS,
  PURCHASE_INDEX_LABELS,
  hasInstallmentSchedule,
} from '@/types/property-purchase';
import { formatCurrency } from '@/lib/format';

interface FinancialSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: PropertyFormData[keyof PropertyFormData]) => void;
}

export function FinancialSection({ formData, onInputChange }: FinancialSectionProps) {
  const showSchedule = hasInstallmentSchedule(formData.payment_type);

  const downPayment = Number(formData.down_payment) || 0;
  const installmentsCount = Number(formData.installments_count) || 0;
  const purchaseValue = Number(formData.purchase_value) || 0;

  // Valor da parcela: o informado, ou o saldo dividido — mesma regra do
  // RPC generate_property_purchase_installments.
  const derivedInstallment =
    installmentsCount > 0 ? Math.round(((purchaseValue - downPayment) / installmentsCount) * 100) / 100 : 0;
  const effectiveInstallment = Number(formData.installment_amount) || derivedInstallment;
  const scheduleTotal = downPayment + effectiveInstallment * installmentsCount;
  // Tolerância de 1 centavo por parcela cobre o arredondamento da divisão.
  const divergence = Math.abs(scheduleTotal - purchaseValue);
  const showDivergence =
    purchaseValue > 0 && installmentsCount > 0 && divergence > Math.max(0.01 * installmentsCount, 0.02);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Informações Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="value">Valor de Mercado *</Label>
            <CurrencyInput
              id="value"
              value={formData.value}
              onValueChange={(value) => onInputChange('value', value || 0)}
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="rental_value">Valor do Aluguel</Label>
            <CurrencyInput
              id="rental_value"
              value={formData.rental_value || 0}
              onValueChange={(value) => onInputChange('rental_value', value || 0)}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="purchase_value">Valor de Compra</Label>
            <CurrencyInput
              id="purchase_value"
              value={formData.purchase_value || 0}
              onValueChange={(value) => onInputChange('purchase_value', value || 0)}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="condo_fee">Taxa de Condomínio</Label>
            <CurrencyInput
              id="condo_fee"
              value={formData.condo_fee || 0}
              onValueChange={(value) => onInputChange('condo_fee', value || 0)}
              placeholder="R$ 0,00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purchase_date">Data de Compra</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date || ''}
              onChange={(e) => onInputChange('purchase_date', e.target.value || null)}
            />
          </div>

          <div>
            <Label htmlFor="payment_type">Forma de Compra</Label>
            <Select
              value={formData.payment_type || ''}
              onValueChange={(value) => onInputChange('payment_type', value || null)}
            >
              <SelectTrigger id="payment_type">
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showSchedule && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Handshake className="h-4 w-4" />
              Condição de pagamento
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="down_payment">Entrada / Sinal</Label>
                <CurrencyInput
                  id="down_payment"
                  value={formData.down_payment || 0}
                  onValueChange={(value) => onInputChange('down_payment', value || null)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <Label htmlFor="installments_count">Número de Parcelas</Label>
                <Input
                  id="installments_count"
                  type="number"
                  min="1"
                  max="600"
                  value={formData.installments_count ?? ''}
                  onChange={(e) =>
                    onInputChange('installments_count', e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Ex: 60"
                />
              </div>

              <div>
                <Label htmlFor="installment_amount">Valor da Parcela</Label>
                <CurrencyInput
                  id="installment_amount"
                  value={formData.installment_amount || 0}
                  onValueChange={(value) => onInputChange('installment_amount', value || null)}
                  placeholder="R$ 0,00"
                />
                {!formData.installment_amount && derivedInstallment > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Em branco, será calculado: {formatCurrency(derivedInstallment)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="installment_frequency">Periodicidade</Label>
                <Select
                  value={formData.installment_frequency || 'monthly'}
                  onValueChange={(value) => onInputChange('installment_frequency', value)}
                >
                  <SelectTrigger id="installment_frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSTALLMENT_FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="first_installment_date">Vencimento da 1ª Parcela</Label>
                <Input
                  id="first_installment_date"
                  type="date"
                  value={formData.first_installment_date || ''}
                  onChange={(e) => onInputChange('first_installment_date', e.target.value || null)}
                />
              </div>

              <div>
                <Label htmlFor="purchase_index">Índice de Correção</Label>
                <Select
                  value={formData.purchase_index || 'none'}
                  onValueChange={(value) => onInputChange('purchase_index', value)}
                >
                  <SelectTrigger id="purchase_index">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PURCHASE_INDEX_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="creditor_name">Credor</Label>
                <Input
                  id="creditor_name"
                  value={formData.creditor_name || ''}
                  onChange={(e) => onInputChange('creditor_name', e.target.value || null)}
                  placeholder="Banco, vendedor, incorporadora, administradora..."
                />
              </div>
            </div>

            {installmentsCount > 0 && effectiveInstallment > 0 && (
              <div className="rounded-md bg-background p-3 text-sm">
                <p>
                  {downPayment > 0 && <>Entrada {formatCurrency(downPayment)} + </>}
                  {installmentsCount}x {formatCurrency(effectiveInstallment)} ={' '}
                  <strong>{formatCurrency(scheduleTotal)}</strong>
                </p>
                {showDivergence && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                    Difere do valor de compra ({formatCurrency(purchaseValue)}) em{' '}
                    {formatCurrency(divergence)}.
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              O cronograma de parcelas é gerado na ficha do imóvel, depois de salvar.
            </p>
          </div>
        )}

        {formData.payment_type && (
          <div>
            <Label htmlFor="purchase_notes">Observações da Compra</Label>
            <Textarea
              id="purchase_notes"
              value={formData.purchase_notes || ''}
              onChange={(e) => onInputChange('purchase_notes', e.target.value || null)}
              placeholder="Detalhes da negociação, bem dado em permuta, número do contrato..."
              rows={2}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
