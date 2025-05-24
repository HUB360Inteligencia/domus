
/**
 * Applies a date mask in DD/MM/YYYY format
 * @param value - The input value
 * @returns Formatted date string
 */
export const applyDateMask = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Apply mask based on length
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
};

/**
 * Validates a date string in DD/MM/YYYY format
 * @param dateString - Date string to validate
 * @returns Boolean indicating if valid
 */
export const isValidDateFormat = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  
  if (!regex.test(dateString)) return false;
  
  const [, day, month, year] = dateString.match(regex) || [];
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return (
    date.getDate() === parseInt(day) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getFullYear() === parseInt(year)
  );
};

/**
 * Converts DD/MM/YYYY to ISO date format (YYYY-MM-DD)
 * @param dateString - Date in DD/MM/YYYY format
 * @returns ISO date string
 */
export const convertToISO = (dateString: string): string => {
  if (!dateString || !isValidDateFormat(dateString)) return '';
  
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Converts ISO date format to DD/MM/YYYY
 * @param isoDate - ISO date string
 * @returns Date in DD/MM/YYYY format
 */
export const convertFromISO = (isoDate: string): string => {
  if (!isoDate) return '';
  
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${day}/${month}/${year}`;
};

/**
 * Applies Brazilian currency mask (R$ 0.000,00) - IMPROVED VERSION
 * @param value - The input value
 * @returns Formatted currency string
 */
export const applyCurrencyMask = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  if (!digits || digits === '0') return '';
  
  // Convert to number and divide by 100 to handle cents
  const number = parseInt(digits) / 100;
  
  // Format as Brazilian currency
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(number);
};

/**
 * Converts currency string to number
 * @param currencyString - String in format like "R$ 1.234,56"
 * @returns Number value
 */
export const parseCurrencyToNumber = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove R$, dots, and replace comma with dot
  const cleanValue = currencyString
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
    
  return parseFloat(cleanValue) || 0;
};

/**
 * Formats a number as currency without the R$ symbol
 * @param value - Number to format
 * @returns Formatted currency string
 */
export const formatCurrencyValue = (value: number): string => {
  if (!value) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};
