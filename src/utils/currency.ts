
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
