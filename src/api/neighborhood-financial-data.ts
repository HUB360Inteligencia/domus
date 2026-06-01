
import { supabase } from '@/integrations/supabase/client';

import { logger } from "@/lib/logger";
export interface NeighborhoodFinancialData {
  name: string;
  revenue: number;
  count: number;
  roi: number;
  totalInvestment: number;
}

export const fetchNeighborhoodFinancialData = async (): Promise<NeighborhoodFinancialData[]> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    // Fetch properties with their neighborhood and investment data
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, neighborhood, purchase_value, total_investment, value')
      .eq('user_id', session.data.session.user.id)
      .not('neighborhood', 'is', null);

    if (propertiesError) throw propertiesError;

    if (!properties || properties.length === 0) {
      return [];
    }

    // Calcular data de 12 meses atrás
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    // Fetch financial transactions for all properties (últimos 12 meses)
    const propertyIds = properties.map(p => p.id);
    const { data: transactions, error: transactionsError } = await supabase
      .from('financial_transactions')
      .select('property_id, amount, transaction_type, transaction_date')
      .eq('user_id', session.data.session.user.id)
      .in('property_id', propertyIds)
      .gte('transaction_date', twelveMonthsAgo.toISOString().split('T')[0]);

    if (transactionsError) throw transactionsError;

    // Group data by neighborhood
    const neighborhoodMap = new Map<string, {
      properties: any[];
      revenue: number;
      expenses: number;
      totalInvestment: number;
    }>();

    // Initialize neighborhood data
    properties.forEach(property => {
      const neighborhood = property.neighborhood || 'Não informado';
      if (!neighborhoodMap.has(neighborhood)) {
        neighborhoodMap.set(neighborhood, {
          properties: [],
          revenue: 0,
          expenses: 0,
          totalInvestment: 0
        });
      }
      
      const neighData = neighborhoodMap.get(neighborhood)!;
      neighData.properties.push(property);
      neighData.totalInvestment += property.purchase_value || property.total_investment || property.value || 0;
    });

    // Add transaction data (últimos 12 meses)
    transactions?.forEach(transaction => {
      const property = properties.find(p => p.id === transaction.property_id);
      if (property && property.neighborhood) {
        const neighborhood = property.neighborhood;
        const neighData = neighborhoodMap.get(neighborhood);
        if (neighData) {
          if (transaction.transaction_type === 'income') {
            neighData.revenue += transaction.amount || 0;
          } else {
            neighData.expenses += transaction.amount || 0;
          }
        }
      }
    });

    // Convert to final format
    const result: NeighborhoodFinancialData[] = Array.from(neighborhoodMap.entries()).map(([name, data]) => {
      const netIncome = data.revenue - data.expenses;
      // ROI anualizado baseado nos últimos 12 meses
      const roi = data.totalInvestment > 0 ? (netIncome / data.totalInvestment) * 100 : 0;
      
      return {
        name,
        revenue: data.revenue,
        count: data.properties.length,
        roi: roi,
        totalInvestment: data.totalInvestment
      };
    });

    // Sort by ROI descending
    return result.sort((a, b) => b.roi - a.roi);
  } catch (error) {
    logger.error('Error fetching neighborhood financial data:', error);
    throw error;
  }
};
