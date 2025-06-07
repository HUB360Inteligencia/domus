
import React from 'react';
import { Input } from '@/components/ui/input';
import { formatDateMask } from '@/utils/masks';

interface MaskedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

export function MaskedDateInput({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  required = false,
  id,
  className
}: MaskedDateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = formatDateMask(e.target.value);
    onChange(maskedValue);
  };

  // Convert dd/mm/yyyy to yyyy-mm-dd for database storage
  const convertToISODate = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 10) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Convert yyyy-mm-dd to dd/mm/yyyy for display
  const convertFromISODate = (isoDateStr: string): string => {
    if (!isoDateStr) return '';
    const [year, month, day] = isoDateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <Input
      id={id}
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
      maxLength={10}
    />
  );
}

export { convertToISODate, convertFromISODate } from '@/components/ui/masked-date-input';

// Helper functions to be used by forms
export const convertToISODate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 10) return '';
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

export const convertFromISODate = (isoDateStr: string): string => {
  if (!isoDateStr) return '';
  const [year, month, day] = isoDateStr.split('-');
  return `${day}/${month}/${year}`;
};
