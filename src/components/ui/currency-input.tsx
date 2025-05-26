
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { applyCurrencyMask, parseCurrencyToNumber } from '@/utils/masks';

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

  useEffect(() => {
    if (typeof value === 'number') {
      setDisplayValue(applyCurrencyMask(value.toString()));
    } else if (value) {
      setDisplayValue(applyCurrencyMask(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const maskedValue = applyCurrencyMask(inputValue);
    setDisplayValue(maskedValue);
    
    // Extract numeric value and pass it back
    const numericValue = parseCurrencyToNumber(maskedValue);
    onChange(numericValue.toString());
  };

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
};
