
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';

interface CommissionInputProps {
  commissionType: 'percentage' | 'monetary';
  commissionValue: number;
  onCommissionTypeChange: (type: 'percentage' | 'monetary') => void;
  onCommissionValueChange: (value: number) => void;
}

export function CommissionInput({
  commissionType,
  commissionValue,
  onCommissionTypeChange,
  onCommissionValueChange
}: CommissionInputProps) {
  return (
    <div className="space-y-2">
      <Label>Taxa de Comissão Mensal</Label>
      <div className="flex gap-2">
        <div className="w-32">
          <Select value={commissionType} onValueChange={onCommissionTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentagem (%)</SelectItem>
              <SelectItem value="monetary">Valor (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          {commissionType === 'monetary' ? (
            <CurrencyInput
              value={commissionValue}
              onValueChange={(value) => onCommissionValueChange(value || 0)}
              placeholder="R$ 0,00"
            />
          ) : (
            <Input
              type="number"
              value={commissionValue || ''}
              onChange={(e) => onCommissionValueChange(Number(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
            />
          )}
        </div>
      </div>
    </div>
  );
}
