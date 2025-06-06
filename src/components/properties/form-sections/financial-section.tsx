
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DollarSign } from 'lucide-react';
import { PropertyFormData } from '@/types/property';

interface FinancialSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
}

export function FinancialSection({ formData, onInputChange }: FinancialSectionProps) {
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
            <Label htmlFor="square_meter_value">Valor por m²</Label>
            <CurrencyInput
              id="square_meter_value"
              value={formData.square_meter_value || 0}
              onValueChange={(value) => onInputChange('square_meter_value', value || 0)}
              placeholder="R$ 0,00"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
