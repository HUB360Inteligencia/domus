
import React, { useState, useEffect } from 'react';
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

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  onValueChange,
  placeholder = "R$ 0,00",
  className,
  id,
  disabled = false,
  required = false
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (typeof value === 'number') {
        setDisplayValue(formatCurrencyDisplay(value));
      } else if (value) {
        const numericValue = parseCurrencyToNumber(value);
        setDisplayValue(formatCurrencyDisplay(numericValue));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused]);

  const formatCurrencyDisplay = (num: number): string => {
    if (num === 0) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const parseCurrencyToNumber = (str: string): number => {
    if (!str) return 0;
    
    // Remove all non-numeric characters except comma and dot
    const cleanStr = str.replace(/[^\d,.]/g, '');
    
    if (!cleanStr) return 0;
    
    // Handle different decimal separators
    if (cleanStr.includes(',') && cleanStr.includes('.')) {
      const lastComma = cleanStr.lastIndexOf(',');
      const lastDot = cleanStr.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // Comma is decimal separator
        return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        // Dot is decimal separator
        return parseFloat(cleanStr.replace(/,/g, '')) || 0;
      }
    }
    
    // Only comma (Brazilian format)
    if (cleanStr.includes(',') && !cleanStr.includes('.')) {
      return parseFloat(cleanStr.replace(',', '.')) || 0;
    }
    
    // Only dot - could be thousands separator or decimal
    if (cleanStr.includes('.') && !cleanStr.includes(',')) {
      const parts = cleanStr.split('.');
      if (parts[parts.length - 1].length === 2) {
        // Decimal separator
        return parseFloat(cleanStr) || 0;
      } else {
        // Thousands separator
        return parseFloat(cleanStr.replace(/\./g, '')) || 0;
      }
    }
    
    // No separators, just numbers
    return parseFloat(cleanStr) || 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (isFocused) {
      setDisplayValue(inputValue);
      
      const numericValue = parseCurrencyToNumber(inputValue);
      
      // Call both callbacks for backward compatibility
      if (onChange) {
        onChange(numericValue.toString());
      }
      if (onValueChange) {
        onValueChange(numericValue);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (displayValue) {
      const numericValue = parseCurrencyToNumber(displayValue);
      if (numericValue === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(displayValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseCurrencyToNumber(displayValue);
    const formattedValue = formatCurrencyDisplay(numericValue);
    setDisplayValue(formattedValue);
    
    // Call both callbacks for backward compatibility
    if (onChange) {
      onChange(numericValue.toString());
    }
    if (onValueChange) {
      onValueChange(numericValue);
    }
  };

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
    />
  );
};
