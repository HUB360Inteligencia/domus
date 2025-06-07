
import React from 'react';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';

interface ContractFormRentFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export function ContractFormRentField({ value, onChange }: ContractFormRentFieldProps) {
  return (
    <div>
      <Label htmlFor="value">Valor do Aluguel *</Label>
      <CurrencyInput
        id="value"
        value={value}
        onValueChange={(val) => onChange(val || 0)}
        placeholder="R$ 0,00"
      />
    </div>
  );
}
