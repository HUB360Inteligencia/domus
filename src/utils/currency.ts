
export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : value;
  
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove tudo exceto números, vírgula e ponto
  const cleanValue = value.replace(/[^\d,.]/g, '');
  
  // Se não há nenhum número, retorna 0
  if (!cleanValue) return 0;
  
  // Se tem vírgula e ponto, assume que vírgula é decimal
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Vírgula é decimal
      return parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
    } else {
      // Ponto é decimal
      return parseFloat(cleanValue.replace(/,/g, ''));
    }
  }
  
  // Se tem apenas vírgula, é decimal
  if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    return parseFloat(cleanValue.replace(',', '.'));
  }
  
  // Se tem apenas ponto, pode ser milhares ou decimal
  if (cleanValue.includes('.') && !cleanValue.includes(',')) {
    const parts = cleanValue.split('.');
    // Se o último grupo tem 2 dígitos, é decimal
    if (parts[parts.length - 1].length === 2) {
      return parseFloat(cleanValue);
    } else {
      // É separador de milhares
      return parseFloat(cleanValue.replace(/\./g, ''));
    }
  }
  
  // Apenas números
  return parseFloat(cleanValue) || 0;
};

export const applyCurrencyMask = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para centavos
  const cents = parseInt(numbers);
  const reals = cents / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reals);
};

// New utility function for better currency handling in forms
export const formatCurrencyInput = (value: number): string => {
  if (value === 0) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Enhanced currency parsing that handles zero values properly
export const parseCurrencyInput = (value: string): number => {
  if (!value || value === '') return 0;
  
  // Handle direct zero input
  if (value === '0' || value === '0,00' || value === '0.00') return 0;
  
  // Remove currency symbols and clean the string
  const cleanValue = value.replace(/[R$\s]/g, '').trim();
  
  if (!cleanValue) return 0;
  
  // Handle different decimal separators
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Comma is decimal separator
      return parseFloat(cleanValue.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      // Dot is decimal separator
      return parseFloat(cleanValue.replace(/,/g, '')) || 0;
    }
  }
  
  // Only comma (decimal separator)
  if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    return parseFloat(cleanValue.replace(',', '.')) || 0;
  }
  
  // Only dot - could be thousands separator or decimal
  if (cleanValue.includes('.') && !cleanValue.includes(',')) {
    const parts = cleanValue.split('.');
    if (parts[parts.length - 1].length === 2) {
      // Decimal separator
      return parseFloat(cleanValue) || 0;
    } else {
      // Thousands separator
      return parseFloat(cleanValue.replace(/\./g, '')) || 0;
    }
  }
  
  // No separators, just numbers
  return parseFloat(cleanValue) || 0;
};
