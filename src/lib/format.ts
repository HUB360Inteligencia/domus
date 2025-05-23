
/**
 * Formats a number as currency in Brazilian Real format
 * @param value - Number to format
 * @returns Formatted string
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "R$ 0,00";
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

/**
 * Parses a Brazilian Real formatted string back to a number
 * @param formattedValue - String in format like "R$ 1.234,56"
 * @returns Number value
 */
export const parseCurrencyToNumber = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  
  // Remove R$, dots, and replace comma with dot
  const cleanValue = formattedValue
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
    
  return parseFloat(cleanValue) || 0;
};

/**
 * Format a date string to dd/mm/yyyy
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Parse a dd/mm/yyyy date string to ISO format
 * @param dateString - Date in format dd/mm/yyyy
 * @returns ISO date string
 */
export const parseDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toISOString().split('T')[0];
};

/**
 * Validates a date string in format dd/mm/yyyy
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
 * Format a percentage value
 * @param value - Number value
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "0%";
  
  return `${value.toFixed(2).replace('.', ',')}%`;
};

/**
 * Parse a percentage string to number
 * @param percentStr - String like "5,5%"
 * @returns Number value
 */
export const parsePercentToNumber = (percentStr: string): number => {
  if (!percentStr) return 0;
  
  return parseFloat(percentStr.replace('%', '').replace(',', '.')) || 0;
};
