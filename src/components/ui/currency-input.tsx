import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: string | number;
  onChange?: (value: string) => void;
  onValueChange?: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
}

/** Formata um número como moeda brasileira (ex.: 2000000 → "R$ 2.000.000,00"). */
const formatBRL = (num: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

const toNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
};

/**
 * Campo de moeda com máscara aplicada ao vivo: conforme o usuário digita, os
 * dígitos são interpretados como centavos e exibidos já formatados com
 * separador de milhar (.) e decimal (,) — ex.: digitar 200000000000 mostra
 * "R$ 2.000.000.000,00". Assim não há ambiguidade entre milhões/bilhões.
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  onValueChange,
  placeholder = 'R$ 0,00',
  className,
  id,
  disabled = false,
  required = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Sincroniza com o valor externo (carregamento/edição), sem interferir na digitação.
  useEffect(() => {
    const num = toNumber(value);
    setDisplayValue(num ? formatBRL(num) : '');
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '');
      const num = digits ? Number(digits) / 100 : 0;

      setDisplayValue(digits ? formatBRL(num) : '');
      onChange?.(num.toString());
      onValueChange?.(num);
    },
    [onChange, onValueChange],
  );

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
    />
  );
};
