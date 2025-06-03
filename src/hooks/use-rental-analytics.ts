
import { useMemo } from 'react';
import { useRentalHistory } from './use-rental-history';
import { useProperties } from './use-properties';

export interface RentalAnalytics {
  monthlyROI: {
    lastMonth: number;
    average12Months: number;
    onInvestment: number;
    onMarketValue: number;
    trend: 'up' | 'down' | 'neutral';
  };
  roiByPropertyType: Record<string, {
    lastMonth: number;
    average12Months: number;
    totalInvestment: number;
    totalMarketValue: number;
  }>;
}

export const useRentalAnalytics = () => {
  const { properties } = useProperties();

  return useMemo(() => {
    // Calcular ROI por tipo de propriedade
    const roiByPropertyType: Record<string, {
      lastMonth: number;
      average12Months: number;
      totalInvestment: number;
      totalMarketValue: number;
    }> = {};

    // Agrupar propriedades por tipo
    const propertyTypes = properties.reduce((acc, property) => {
      const type = property.type || 'Outros';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(property);
      return acc;
    }, {} as Record<string, typeof properties>);

    // Para cada tipo, calcular métricas
    Object.entries(propertyTypes).forEach(([type, typeProperties]) => {
      const totalInvestment = typeProperties.reduce((sum, p) => 
        sum + (p.purchase_value || p.total_investment || 0), 0
      );
      const totalMarketValue = typeProperties.reduce((sum, p) => sum + (p.value || 0), 0);

      // Aqui seria necessário calcular com base no rental history de cada propriedade
      // Por enquanto, vamos usar valores simulados baseados no valor do imóvel
      const lastMonthRevenue = typeProperties.reduce((sum, p) => sum + (p.rental_value || 0), 0);
      const lastMonthROI = totalInvestment > 0 ? (lastMonthRevenue / totalInvestment) * 100 : 0;
      
      roiByPropertyType[type] = {
        lastMonth: lastMonthROI,
        average12Months: lastMonthROI * 0.95, // Simulando uma média ligeiramente menor
        totalInvestment,
        totalMarketValue
      };
    });

    // Calcular ROI geral
    const totalInvestment = properties.reduce((sum, p) => 
      sum + (p.purchase_value || p.total_investment || 0), 0
    );
    const totalMarketValue = properties.reduce((sum, p) => sum + (p.value || 0), 0);
    const totalLastMonthRevenue = properties.reduce((sum, p) => sum + (p.rental_value || 0), 0);

    const lastMonthROIOnInvestment = totalInvestment > 0 ? (totalLastMonthRevenue / totalInvestment) * 100 : 0;
    const lastMonthROIOnMarketValue = totalMarketValue > 0 ? (totalLastMonthRevenue / totalMarketValue) * 100 : 0;
    const average12MonthsROI = lastMonthROIOnInvestment * 0.95; // Simulando média

    const trend = lastMonthROIOnInvestment > average12MonthsROI ? 'up' : 
                 lastMonthROIOnInvestment < average12MonthsROI ? 'down' : 'neutral';

    return {
      monthlyROI: {
        lastMonth: lastMonthROIOnInvestment,
        average12Months: average12MonthsROI,
        onInvestment: lastMonthROIOnInvestment,
        onMarketValue: lastMonthROIOnMarketValue,
        trend
      },
      roiByPropertyType
    };
  }, [properties]);
};
