
import { supabase } from '@/integrations/supabase/client';

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyGrowth: number;
  totalProperties: number;
  occupiedProperties: number;
  occupancyRate: number;
  averageRent: number;
}

export interface MonthlyFinancialData {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface PropertyFinancialRanking {
  propertyId: string;
  propertyTitle: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  roi: number;
}

export const fetchFinancialMetrics = async (): Promise<FinancialMetrics> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    // Fetch total revenue (income transactions)
    const { data: revenueData, error: revenueError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', session.data.session.user.id)
      .eq('transaction_type', 'income');

    if (revenueError) throw revenueError;

    // Fetch total expenses
    const { data: expenseData, error: expenseError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', session.data.session.user.id)
      .eq('transaction_type', 'expense');

    if (expenseError) throw expenseError;

    // Fetch property data
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('id, status, value')
      .eq('user_id', session.data.session.user.id);

    if (propertiesError) throw propertiesError;

    const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const totalExpenses = expenseData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const netIncome = totalRevenue - totalExpenses;

    const totalProperties = propertiesData?.length || 0;
    const occupiedProperties = propertiesData?.filter(p => p.status === 'rented' || p.status === 'airbnb').length || 0;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
    const averageRent = propertiesData?.reduce((sum, p) => sum + (p.value || 0), 0) / Math.max(totalProperties, 1) || 0;

    // Calculate monthly growth (simplified - comparing last 2 months)
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);

    const { data: lastMonthData } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', session.data.session.user.id)
      .eq('transaction_type', 'income')
      .gte('transaction_date', lastMonth.toISOString().split('T')[0])
      .lt('transaction_date', currentDate.toISOString().split('T')[0]);

    const { data: previousMonthData } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('user_id', session.data.session.user.id)
      .eq('transaction_type', 'income')
      .gte('transaction_date', twoMonthsAgo.toISOString().split('T')[0])
      .lt('transaction_date', lastMonth.toISOString().split('T')[0]);

    const lastMonthRevenue = lastMonthData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const previousMonthRevenue = previousMonthData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const monthlyGrowth = previousMonthRevenue > 0 ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      monthlyGrowth,
      totalProperties,
      occupiedProperties,
      occupancyRate,
      averageRent
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    throw error;
  }
};

export const fetchMonthlyFinancialData = async (months: number = 12): Promise<MonthlyFinancialData[]> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_type, transaction_date')
      .eq('user_id', session.data.session.user.id)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};

    transactions?.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }

      if (transaction.transaction_type === 'income') {
        monthlyData[monthKey].revenue += transaction.amount || 0;
      } else {
        monthlyData[monthKey].expenses += transaction.amount || 0;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      netIncome: data.revenue - data.expenses
    }));
  } catch (error) {
    console.error('Error fetching monthly financial data:', error);
    throw error;
  }
};

export const fetchPropertyFinancialRanking = async (): Promise<PropertyFinancialRanking[]> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    // Fetch properties with their financial data
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, total_investment')
      .eq('user_id', session.data.session.user.id);

    if (propertiesError) throw propertiesError;

    const rankings: PropertyFinancialRanking[] = [];

    for (const property of properties || []) {
      // Fetch revenue for this property
      const { data: revenueData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('user_id', session.data.session.user.id)
        .eq('property_id', property.id)
        .eq('transaction_type', 'income');

      // Fetch expenses for this property
      const { data: expenseData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('user_id', session.data.session.user.id)
        .eq('property_id', property.id)
        .eq('transaction_type', 'expense');

      const revenue = revenueData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const expenses = expenseData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
      const netIncome = revenue - expenses;
      const investment = property.total_investment || 0;
      const roi = investment > 0 ? (netIncome / investment) * 100 : 0;

      rankings.push({
        propertyId: property.id,
        propertyTitle: property.title,
        revenue,
        expenses,
        netIncome,
        roi
      });
    }

    return rankings.sort((a, b) => b.roi - a.roi);
  } catch (error) {
    console.error('Error fetching property financial ranking:', error);
    throw error;
  }
};
