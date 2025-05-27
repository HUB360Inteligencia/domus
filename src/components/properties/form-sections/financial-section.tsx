
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
          Valores Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="value">Valor de Mercado do Imóvel *</Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => onInputChange('value', Number(e.target.value))}
              placeholder="500000"
              min="0"
              step="1000"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="rental_value">Valor de Aluguel</Label>
            <Input
              id="rental_value"
              type="number"
              value={formData.rental_value || 0}
              onChange={(e) => onInputChange('rental_value', Number(e.target.value))}
              placeholder="2500"
              min="0"
              step="100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purchase_value">Valor de Compra</Label>
            <Input
              id="purchase_value"
              type="number"
              value={formData.purchase_value || ''}
              onChange={(e) => onInputChange('purchase_value', e.target.value ? Number(e.target.value) : null)}
              placeholder="450000"
              min="0"
              step="1000"
            />
          </div>
          
          <div>
            <Label htmlFor="purchase_date">Data de Compra</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date || ''}
              onChange={(e) => onInputChange('purchase_date', e.target.value || null)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="condo_fee">Taxa de Condomínio</Label>
          <Input
            id="condo_fee"
            type="number"
            value={formData.condo_fee || 0}
            onChange={(e) => onInputChange('condo_fee', Number(e.target.value))}
            placeholder="300"
            min="0"
            step="50"
          />
        </div>
      </CardContent>
    </Card>
  );
}
