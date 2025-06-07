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
 * Formats a date string to dd/mm/yyyy format
 */
export const formatDateMask = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Apply the mask dd/mm/yyyy
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
};

/**
 * Validates if a date string in dd/mm/yyyy format is valid
 */
export const isValidDateMask = (dateStr: string): boolean => {
  if (dateStr.length !== 10) return false;
  
  const [day, month, year] = dateStr.split('/').map(Number);
  
  if (!day || !month || !year) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Check if date is valid
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
};

/**
 * Applies Brazilian currency mask (R$ 0.000,00) - NEW APPROACH
 * @param value - The input value (can be string or number)
 * @returns Formatted currency string
 */
export const applyCurrencyMask = (value: string | number): string => {
  // Handle empty or invalid values
  if (!value && value !== 0) return '';
  
  // Convert to string and remove all non-digit characters
  const stringValue = String(value);
  const digits = stringValue.replace(/\D/g, '');
  
  // If no digits, return empty
  if (!digits) return '';
  
  // Pad with zeros if needed to ensure at least 3 digits (for cents)
  const paddedDigits = digits.padStart(3, '0');
  
  // Split into integer and decimal parts
  const integerPart = paddedDigits.slice(0, -2);
  const decimalPart = paddedDigits.slice(-2);
  
  // Remove leading zeros from integer part, but keep at least one digit
  const cleanIntegerPart = integerPart.replace(/^0+/, '') || '0';
  
  // Format with thousands separator
  const formattedInteger = cleanIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `R$ ${formattedInteger},${decimalPart}`;
};

/**
 * Applies currency mask for input fields - handles user typing
 * @param currentValue - Current input value
 * @param newInput - New character or input
 * @returns Formatted currency string
 */
export const applyCurrencyInputMask = (currentValue: string, newInput: string): string => {
  // Get all digits from the new input
  const allDigits = newInput.replace(/\D/g, '');
  
  // Apply the mask
  return applyCurrencyMask(allDigits);
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
 * Converts number to currency display format
 * @param value - Number to format
 * @returns Formatted currency string
 */
export const numberToCurrencyDisplay = (value: number): string => {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
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
