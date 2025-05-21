
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// Common chart colors for consistent styling across components
export const CHART_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28AD2',
  '#FF6B6B', '#4ECDC4', '#F9D423', '#B5D99C', '#E27D60'
];
