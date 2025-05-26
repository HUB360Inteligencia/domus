import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "R$ 0,00",
  className,
  id,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (typeof value === 'number') {
        setDisplayValue(formatCurrencyDisplay(value));
      } else if (value) {
        // Parse the value and format it properly
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
      // During typing, allow more flexible input
      setDisplayValue(inputValue);
      
      // Extract numeric value and pass it back as string
      const numericValue = parseCurrencyToNumber(inputValue);
      onChange(numericValue.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Convert to a more editable format when focused
    if (displayValue) {
      const numericValue = parseCurrencyToNumber(displayValue);
      if (numericValue === 0) {
        setDisplayValue('');
      } else {
        // Keep the formatted value but make it editable
        setDisplayValue(displayValue);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the value properly when losing focus
    const numericValue = parseCurrencyToNumber(displayValue);
    const formattedValue = formatCurrencyDisplay(numericValue);
    setDisplayValue(formattedValue);
    onChange(numericValue.toString());
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
    />
  );
};
