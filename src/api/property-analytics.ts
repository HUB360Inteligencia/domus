
import { supabase } from '@/integrations/supabase/client';
import { computePropertyFinancialMetrics } from '@/api/property-financial-metrics';

import { logger } from "@/lib/logger";
export interface PropertyAnalyticsData {
  id: string;
  title: string;
  type: string;
  city: string;
  neighborhood?: string;
  status: string;
  marketValue: number;
  monthlyROI: number;
  vacancyRate: number;
  averageRevenue: number;
  totalInvestment: number;
  capRate: number;
  cashOnCash: number;
  netIncome: number;
  averageExpense: number;
}

export interface PropertyAnalyticsFilters {
  city?: string;
  neighborhood?: string;
  propertyType?: string;
  status?: string;
  minROI?: number;
  maxROI?: number;
  minValue?: number;
  maxValue?: number;
}

export const fetchPropertyAnalytics = async (filters?: PropertyAnalyticsFilters): Promise<PropertyAnalyticsData[]> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    // Imóveis visíveis ao usuário (a RLS já restringe à organização)
    let query = supabase
      .from('properties')
      .select('id, title, type, city, neighborhood, status, value, purchase_value, total_investment');

    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.neighborhood) {
      query = query.eq('neighborhood', filters.neighborhood);
    }
    if (filters?.propertyType) {
      query = query.eq('type', filters.propertyType);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.minValue) {
      query = query.gte('value', filters.minValue);
    }
    if (filters?.maxValue) {
      query = query.lte('value', filters.maxValue);
    }

    const { data: properties, error } = await query;

    if (error) throw error;

    if (!properties || properties.length === 0) {
      return [];
    }

    // Busca em lote (uma consulta por tabela) em vez de N consultas por imóvel
    const propertyIds = properties.map((property) => property.id);
    const [transactionsResult, investmentsResult, contractsResult] = await Promise.all([
      supabase
        .from('financial_transactions')
        .select('property_id, amount, transaction_type, transaction_date')
        .in('property_id', propertyIds),
      supabase
        .from('property_investments')
        .select('property_id, amount')
        .in('property_id', propertyIds),
      supabase
        .from('contracts')
        .select('property_id, start_date, end_date, status')
        .in('property_id', propertyIds),
    ]);

    if (transactionsResult.error) throw transactionsResult.error;
    if (investmentsResult.error) throw investmentsResult.error;
    if (contractsResult.error) throw contractsResult.error;

    const groupByProperty = <T extends { property_id: string | null }>(rows: T[] | null) => {
      const grouped = new Map<string, T[]>();
      (rows || []).forEach((row) => {
        if (!row.property_id) return;
        const list = grouped.get(row.property_id) || [];
        list.push(row);
        grouped.set(row.property_id, list);
      });
      return grouped;
    };

    const transactionsByProperty = groupByProperty(transactionsResult.data);
    const investmentsByProperty = groupByProperty(investmentsResult.data);
    const contractsByProperty = groupByProperty(contractsResult.data);
    const now = new Date();

    const analyticsData: PropertyAnalyticsData[] = properties.map((property) => {
      const metrics = computePropertyFinancialMetrics({
        property,
        transactions: transactionsByProperty.get(property.id) || [],
        investments: investmentsByProperty.get(property.id) || [],
        contracts: contractsByProperty.get(property.id) || [],
        now,
      });
      const marketValue = Number(property.value || 0);

      return {
        id: property.id,
        title: property.title,
        type: property.type,
        city: property.city,
        neighborhood: property.neighborhood,
        status: property.status,
        marketValue,
        monthlyROI: metrics.monthlyProfitability,
        vacancyRate: metrics.vacancyRate,
        averageRevenue: metrics.revenueLast12Months / 12,
        totalInvestment: metrics.totalInvestment > 0 ? metrics.totalInvestment : metrics.capitalBase,
        // Cap rate: resultado anual sobre o valor de mercado
        capRate: marketValue > 0 ? (metrics.netIncomeLast12Months / marketValue) * 100 : 0,
        // Cash-on-cash: resultado anual sobre o capital investido
        cashOnCash: metrics.capitalBase > 0 ? (metrics.netIncomeLast12Months / metrics.capitalBase) * 100 : 0,
        netIncome: metrics.netIncomeLast12Months,
        averageExpense: metrics.expensesLast12Months / 12,
      };
    });

    return analyticsData
      .filter((analytics) => {
        if (filters?.minROI != null && analytics.monthlyROI < filters.minROI) return false;
        if (filters?.maxROI != null && analytics.monthlyROI > filters.maxROI) return false;
        return true;
      })
      .sort((a, b) => b.monthlyROI - a.monthlyROI);
  } catch (error) {
    logger.error('Error fetching property analytics:', error);
    throw error;
  }
};

export const getUniqueFilterOptions = async () => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const { data: properties, error } = await supabase
      .from('properties')
      .select('city, neighborhood, type, status');

    if (error) throw error;

    const cities = [...new Set(properties?.map(p => p.city).filter(Boolean))];
    const neighborhoods = [...new Set(properties?.map(p => p.neighborhood).filter(Boolean))];
    const types = [...new Set(properties?.map(p => p.type).filter(Boolean))];
    const statuses = [...new Set(properties?.map(p => p.status).filter(Boolean))];

    return {
      cities: cities.sort(),
      neighborhoods: neighborhoods.sort(),
      types: types.sort(),
      statuses: statuses.sort()
    };
  } catch (error) {
    logger.error('Error fetching filter options:', error);
    return {
      cities: [],
      neighborhoods: [],
      types: [],
      statuses: []
    };
  }
};
