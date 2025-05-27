
import { useMemo } from 'react';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useContracts } from '@/hooks/use-contracts';

export interface PropertyRanking {
  id: string;
  name: string;
  type: string;
  location: string;
  revenue: number;
  roi: number;
}

export interface NeighborhoodRanking {
  name: string;
  revenue: number;
  count: number;
  roi: number;
}

export const usePropertyRankings = () => {
  const { properties } = useProperties();
  const { transactions } = useFinancialTransactions();
  const { contracts } = useContracts();

  const propertyRankings = useMemo((): PropertyRanking[] => {
    if (!properties || !transactions) return [];

    return properties.map(property => {
      // Calcular receita da propriedade
      const propertyTransactions = transactions.filter(t => 
        t.property_id === property.id && t.transaction_type === 'income'
      );
      const revenue = propertyTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      // Calcular ROI baseado no valor de compra ou valor total investido
      const investment = property.purchase_value || property.total_investment || property.value || 1;
      const roi = (revenue / investment) * 100;

      return {
        id: property.id,
        name: property.title,
        type: property.type,
        location: property.neighborhood || property.city,
        revenue,
        roi
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [properties, transactions]);

  const neighborhoodRankings = useMemo((): NeighborhoodRanking[] => {
    if (!properties || !transactions) return [];

    const neighborhoodMap = new Map<string, {
      properties: typeof properties;
      revenue: number;
      totalInvestment: number;
    }>();

    // Agrupar por bairro
    properties.forEach(property => {
      const neighborhood = property.neighborhood || property.city || 'Não informado';
      
      if (!neighborhoodMap.has(neighborhood)) {
        neighborhoodMap.set(neighborhood, {
          properties: [],
          revenue: 0,
          totalInvestment: 0
        });
      }

      const neighData = neighborhoodMap.get(neighborhood)!;
      neighData.properties.push(property);
      neighData.totalInvestment += property.purchase_value || property.total_investment || property.value || 0;
    });

    // Calcular receita por bairro
    transactions.forEach(transaction => {
      if (transaction.transaction_type === 'income' && transaction.property_id) {
        const property = properties.find(p => p.id === transaction.property_id);
        if (property) {
          const neighborhood = property.neighborhood || property.city || 'Não informado';
          const neighData = neighborhoodMap.get(neighborhood);
          if (neighData) {
            neighData.revenue += Number(transaction.amount);
          }
        }
      }
    });

    // Converter para array e calcular ROI
    return Array.from(neighborhoodMap.entries()).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      count: data.properties.length,
      roi: data.totalInvestment > 0 ? (data.revenue / data.totalInvestment) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [properties, transactions]);

  return {
    propertyRankings,
    neighborhoodRankings,
    isLoading: false
  };
};
