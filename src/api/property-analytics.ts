
import { supabase } from '@/integrations/supabase/client';
import { fetchPropertyFinancialMetrics } from '@/api/property-financial-metrics';

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

    // Buscar propriedades básicas
    let query = supabase
      .from('properties')
      .select('id, title, type, city, neighborhood, status, value, purchase_value, total_investment')
      .eq('user_id', session.data.session.user.id);

    // Aplicar filtros básicos
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

    // Buscar dados financeiros para cada propriedade
    const analyticsData: PropertyAnalyticsData[] = [];

    for (const property of properties) {
      try {
        const financialMetrics = await fetchPropertyFinancialMetrics(property.id);
        
        // Calcular Cap Rate (ROI anualizado baseado no valor de mercado)
        const capRate = property.value > 0 ? (financialMetrics.netIncome / property.value) * 100 : 0;
        
        // Calcular Cash-on-Cash (ROI baseado no investimento inicial)
        const totalInvested = property.purchase_value || property.total_investment || property.value;
        const cashOnCash = totalInvested > 0 ? (financialMetrics.netIncome / totalInvested) * 100 : 0;

        // Calcular receita e despesa média mensal (últimos 12 meses)
        const averageRevenue = financialMetrics.totalRevenue / 12;
        const averageExpense = financialMetrics.totalExpenses / 12;

        const analytics: PropertyAnalyticsData = {
          id: property.id,
          title: property.title,
          type: property.type,
          city: property.city,
          neighborhood: property.neighborhood,
          status: property.status,
          marketValue: property.value,
          monthlyROI: financialMetrics.monthlyProfitability,
          vacancyRate: financialMetrics.vacancyRate,
          averageRevenue,
          totalInvestment: financialMetrics.totalInvestment,
          capRate,
          cashOnCash,
          netIncome: financialMetrics.netIncome,
          averageExpense
        };

        // Aplicar filtros de ROI se especificados
        if (filters?.minROI && analytics.monthlyROI < filters.minROI) continue;
        if (filters?.maxROI && analytics.monthlyROI > filters.maxROI) continue;

        analyticsData.push(analytics);
      } catch (error) {
        console.error(`Error fetching metrics for property ${property.id}:`, error);
        // Continuar com dados básicos mesmo se as métricas falharem
        const basicAnalytics: PropertyAnalyticsData = {
          id: property.id,
          title: property.title,
          type: property.type,
          city: property.city,
          neighborhood: property.neighborhood,
          status: property.status,
          marketValue: property.value,
          monthlyROI: 0,
          vacancyRate: 0,
          averageRevenue: 0,
          totalInvestment: property.purchase_value || property.total_investment || property.value,
          capRate: 0,
          cashOnCash: 0,
          netIncome: 0,
          averageExpense: 0
        };
        analyticsData.push(basicAnalytics);
      }
    }

    return analyticsData.sort((a, b) => b.monthlyROI - a.monthlyROI);
  } catch (error) {
    console.error('Error fetching property analytics:', error);
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
      .select('city, neighborhood, type, status')
      .eq('user_id', session.data.session.user.id);

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
    console.error('Error fetching filter options:', error);
    return {
      cities: [],
      neighborhoods: [],
      types: [],
      statuses: []
    };
  }
};
