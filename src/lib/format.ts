
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

export const parseCurrencyToNumber = (value: string): number => {
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

export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const parseDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Se já está no formato ISO, retorna como está
  if (dateString.includes('-') && dateString.length === 10) {
    return dateString;
  }
  
  // Converte de dd/mm/yyyy para yyyy-mm-dd
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateString;
};

export const isValidDateFormat = (dateString: string): boolean => {
  if (!dateString) return false;
  
  // Verifica formato dd/mm/yyyy
  const ddmmyyyy = /^\d{2}\/\d{2}\/\d{4}$/;
  if (ddmmyyyy.test(dateString)) {
    const parts = dateString.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // Validação básica de data
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;
    
    return true;
  }
  
  // Verifica formato yyyy-mm-dd
  const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/;
  return yyyymmdd.test(dateString);
};
