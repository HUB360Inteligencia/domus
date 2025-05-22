
import { useState, useMemo } from 'react';
import { useContractStats, useFinancialStats } from '@/hooks/use-contract-analytics';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';

// Helper to calculate total value from properties
const calculateTotalValue = (properties: any[], valueKey: string): number => {
  return properties?.reduce((sum, property) => {
    return sum + (property[valueKey] || 0);
  }, 0) || 0;
};

// Helper to format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
};

// Helper to format percentages
export const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// Main hook for the financial dashboard
export const useFinancialDashboard = () => {
  // State for UI controls
  const [showMarketValue, setShowMarketValue] = useState(true);
  const [propertyRankingType, setPropertyRankingType] = useState<'value' | 'percentage'>('value');
  const [neighborhoodRankingType, setNeighborhoodRankingType] = useState<'value' | 'percentage'>('value');
  const [chartViewMode, setChartViewMode] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch real data
  const { data: contractStats, isLoading: isLoadingContractStats } = useContractStats();
  const { data: financialStats, isLoading: isLoadingFinancialStats } = useFinancialStats();
  const { properties, isLoadingProperties } = useProperties();
  const { transactions, isLoadingTransactions } = useFinancialTransactions();

  // Calculate KPI Values from real data
  const assetValueData = useMemo(() => {
    if (!properties || isLoadingProperties) {
      return { acquisition: 'R$ 0,00', current: 'R$ 0,00', growthPercentage: 0 };
    }

    const acquisitionValue = calculateTotalValue(properties, 'purchase_value');
    const marketValue = calculateTotalValue(properties, 'value');
    const growthPercentage = acquisitionValue > 0 
      ? ((marketValue - acquisitionValue) / acquisitionValue) * 100 
      : 0;

    return {
      acquisition: formatCurrency(acquisitionValue),
      current: formatCurrency(marketValue),
      growthPercentage: Number(growthPercentage.toFixed(1))
    };
  }, [properties, isLoadingProperties]);

  const performanceData = useMemo(() => {
    if (!financialStats || isLoadingFinancialStats) {
      return {
        monthlyAverage: '0,0%',
        previousMonth: {
          percentage: '0,0%',
          value: 'R$ 0,00',
          trend: 'neutral' as const
        },
        occupancyRate: '0%'
      };
    }

    // Extract monthly income from financial stats
    const monthlyIncome = financialStats.monthlyIncome 
      ? parseFloat(financialStats.monthlyIncome.replace(/[^\d,]/g, '').replace(',', '.'))
      : 0;
    
    // Calculate average return rate (simplified)
    const totalPropertyValue = calculateTotalValue(properties, 'value');
    const monthlyAverage = totalPropertyValue > 0 
      ? (monthlyIncome / totalPropertyValue) * 100
      : 0;

    return {
      monthlyAverage: `${monthlyAverage.toFixed(1)}%`,
      previousMonth: {
        percentage: `${(monthlyAverage * 0.9).toFixed(1)}%`, // Assuming previous month was 10% less
        value: formatCurrency(monthlyIncome * 0.9),
        trend: monthlyAverage >= (monthlyAverage * 0.9) ? 'up' as const : 'down' as const
      },
      occupancyRate: financialStats.occupancyRate || '0%'
    };
  }, [financialStats, isLoadingFinancialStats, properties]);

  // Calculate top properties data
  const topPropertiesData = useMemo(() => {
    if (!properties || isLoadingProperties) return [];
    
    // Calculate return based on transactions
    return properties
      .filter(property => property.value > 0)
      .map(property => {
        const propertyTransactions = transactions
          .filter(tx => tx.property_id === property.id && tx.transaction_type === 'income')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);
          
        const monthlyReturn = propertyTransactions / 12; // Simplifying to average monthly return
        const returnPercentage = property.value > 0 
          ? (monthlyReturn / property.value) * 100 
          : 0;
          
        return {
          id: property.id,
          name: property.title,
          type: property.type,
          location: `${property.neighborhood}, ${property.city}`,
          return: monthlyReturn,
          percentage: returnPercentage
        };
      })
      .sort((a, b) => b.return - a.return)
      .slice(0, 5);
  }, [properties, isLoadingProperties, transactions]);

  // Calculate neighborhood data
  const neighborhoodData = useMemo(() => {
    if (!properties || isLoadingProperties) return [];
    
    // Group properties by neighborhood
    const neighborhoods = properties.reduce((acc: any, property) => {
      const neighborhood = property.neighborhood || 'Desconhecido';
      
      if (!acc[neighborhood]) {
        acc[neighborhood] = {
          properties: [],
          totalValue: 0,
          totalReturn: 0
        };
      }
      
      acc[neighborhood].properties.push(property);
      acc[neighborhood].totalValue += property.value || 0;
      
      // Find income transactions for this property
      const propertyTransactions = transactions
        .filter(tx => tx.property_id === property.id && tx.transaction_type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      acc[neighborhood].totalReturn += propertyTransactions / 12; // Monthly average
      
      return acc;
    }, {});
    
    // Convert to array format
    return Object.entries(neighborhoods)
      .map(([name, data]: [string, any]) => ({
        id: name,
        name,
        averageReturn: data.totalValue > 0 ? (data.totalReturn / data.totalValue) * 100 : 0,
        totalReturn: data.totalReturn,
        properties: data.properties.length
      }))
      .sort((a, b) => b.totalReturn - a.totalReturn)
      .slice(0, 5);
  }, [properties, isLoadingProperties, transactions]);

  // Generate asset growth chart data
  const assetGrowthData = useMemo(() => {
    // For now, we'll generate this based on the current property values
    // In a real app, you'd get historical data from the backend
    const totalValue = calculateTotalValue(properties, 'value');
    const purchaseValue = calculateTotalValue(properties, 'purchase_value');
    
    if (totalValue === 0) return [];
    
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Generate monthly data
    const monthlyData = Array(12).fill(0).map((_, index) => {
      const monthIndex = (currentMonth - 11 + index) % 12;
      const yearOffset = monthIndex > currentMonth ? -1 : 0;
      const month = monthNames[monthIndex];
      const year = currentYear + yearOffset;
      
      // Create a growth curve from purchase value to current value
      const growthFactor = index / 11;
      const value = purchaseValue + (totalValue - purchaseValue) * growthFactor;
      
      return {
        month,
        year,
        fullLabel: `${month}/${year}`,
        value: Math.round(value),
        acquisition: purchaseValue
      };
    });
    
    // Aggregate to yearly if needed
    if (chartViewMode === 'yearly') {
      const yearlyMap = new Map<number, { value: number, acquisition: number, count: number }>();
      
      monthlyData.forEach(item => {
        const year = item.year;
        
        if (!yearlyMap.has(year)) {
          yearlyMap.set(year, { value: 0, acquisition: 0, count: 0 });
        }
        
        const yearData = yearlyMap.get(year)!;
        yearData.value += item.value;
        yearData.acquisition += item.acquisition;
        yearData.count += 1;
      });
      
      return Array.from(yearlyMap.entries()).map(([year, data]) => ({
        month: year.toString(),
        fullLabel: year.toString(),
        value: Math.round(data.value / data.count),
        acquisition: Math.round(data.acquisition / data.count)
      }));
    }
    
    return monthlyData;
  }, [properties, chartViewMode]);

  // ROI by property type data
  const roiByPropertyType = useMemo(() => {
    if (!properties || isLoadingProperties) return [];
    
    // Group properties by type and calculate average ROI
    const typeGroups = properties.reduce((acc: any, property) => {
      const type = property.type || 'Desconhecido';
      
      if (!acc[type]) {
        acc[type] = {
          properties: [],
          totalValue: 0,
          totalReturn: 0
        };
      }
      
      acc[type].properties.push(property);
      acc[type].totalValue += property.value || 0;
      
      // Find income transactions for this property
      const propertyTransactions = transactions
        .filter(tx => tx.property_id === property.id && tx.transaction_type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      acc[type].totalReturn += propertyTransactions / 12; // Monthly average
      
      return acc;
    }, {});
    
    // Convert to array format
    return Object.entries(typeGroups)
      .map(([type, data]: [string, any]) => ({
        type,
        roi: data.totalValue > 0 ? (data.totalReturn / data.totalValue) * 100 : 0
      }))
      .sort((a, b) => b.roi - a.roi);
  }, [properties, isLoadingProperties, transactions]);

  // Loading state
  const isLoading = isLoadingContractStats || isLoadingFinancialStats || 
                    isLoadingProperties || isLoadingTransactions;

  return {
    // Data
    assetValueData,
    performanceData,
    topPropertiesData,
    neighborhoodData,
    assetGrowthData,
    roiByPropertyType,
    
    // UI State
    showMarketValue, 
    setShowMarketValue,
    propertyRankingType, 
    setPropertyRankingType,
    neighborhoodRankingType, 
    setNeighborhoodRankingType,
    chartViewMode,
    setChartViewMode,
    
    // Loading state
    isLoading
  };
};
