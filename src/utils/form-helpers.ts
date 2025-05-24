
// Utilitários para melhorar a experiência do formulário

export const validateBrazilianPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  return digit === parseInt(cleanCPF.charAt(10));
};

export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length <= 3) return cleanCPF;
  if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
  
  return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
};

export const calculateROI = (monthlyIncome: number, totalInvestment: number): number => {
  if (totalInvestment === 0) return 0;
  return ((monthlyIncome * 12) / totalInvestment) * 100;
};

export const calculatePaybackPeriod = (totalInvestment: number, monthlyIncome: number): number => {
  if (monthlyIncome === 0) return 0;
  return totalInvestment / monthlyIncome;
};

export const suggestRentValue = (propertyValue: number, area: number, type: string): number => {
  // Sugestões baseadas em percentuais típicos do mercado
  const rentPercentages = {
    apartment: 0.006, // 0.6% do valor do imóvel
    house: 0.005,     // 0.5% do valor do imóvel
    commercial: 0.008, // 0.8% do valor do imóvel
    land: 0.003,       // 0.3% do valor do imóvel
    rural: 0.004       // 0.4% do valor do imóvel
  };
  
  const percentage = rentPercentages[type as keyof typeof rentPercentages] || 0.005;
  return propertyValue * percentage;
};

export const getPropertyTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    commercial: 'Comercial',
    land: 'Terreno',
    rural: 'Rural'
  };
  
  return labels[type] || type;
};

export const getPropertyStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    available: 'Disponível',
    rented: 'Alugado',
    airbnb: 'Airbnb',
    maintenance: 'Em manutenção',
    sold: 'Vendido'
  };
  
  return labels[status] || status;
};

export const getFurnishedStatusLabel = (furnished: string): string => {
  const labels: Record<string, string> = {
    not_furnished: 'Não mobiliado',
    partially_furnished: 'Parcialmente mobiliado',
    fully_furnished: 'Totalmente mobiliado'
  };
  
  return labels[furnished] || furnished;
};

export const validatePropertyForm = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Título deve ter pelo menos 3 caracteres');
  }
  
  if (!data.address || data.address.trim().length < 5) {
    errors.push('Endereço deve ter pelo menos 5 caracteres');
  }
  
  if (!data.city || data.city.trim().length < 2) {
    errors.push('Cidade deve ter pelo menos 2 caracteres');
  }
  
  if (!data.state || data.state.trim().length < 2) {
    errors.push('Estado deve ter pelo menos 2 caracteres');
  }
  
  if (!data.value || data.value <= 0) {
    errors.push('Valor deve ser maior que zero');
  }
  
  if (data.area && data.area <= 0) {
    errors.push('Área deve ser maior que zero');
  }
  
  if (data.bedrooms && data.bedrooms < 0) {
    errors.push('Número de quartos não pode ser negativo');
  }
  
  if (data.bathrooms && data.bathrooms < 0) {
    errors.push('Número de banheiros não pode ser negativo');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
