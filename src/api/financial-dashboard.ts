import { supabase } from '@/integrations/supabase/client';

import { logger } from "@/lib/logger";
export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyGrowth: number;
  totalProperties: number;
  occupiedProperties: number;
  occupancyRate: number;
  averageRent: number;
  // Additional properties for the dashboard
  totalAcquisitionValue?: number;
  totalMarketValue?: number;
  totalBookValue?: number;
  averageMonthlyReturn?: number;
  previousMonthReturn?: number;
  previousMonthValue?: number;
  roiByPropertyType?: Record<string, number>;
}

export interface MonthlyFinancialData {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  // Additional properties for the dashboard
  marketValue?: number;
  bookValue?: number;
  acquisitionValue?: number;
}

export interface PropertyFinancialRanking {
  propertyId: string;
  propertyTitle: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  roi: number;
  // Additional properties for the dashboard
  id?: string;
  name?: string;
  type?: string;
  location?: string;
  neighborhood?: string;
  monthlyReturn?: number;
  returnPercentage?: number;
}

const getMonthDateRange = (monthsAgo: number = 0) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
};

const calculateMonthlyReturn = async (userId: string, monthsAgo: number = 0) => {
  const { start, end } = getMonthDateRange(monthsAgo);
  
  // Fetch income for the specific month
  const { data: incomeData, error: incomeError } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('transaction_type', 'income')
    .gte('transaction_date', start)
    .lte('transaction_date', end);

  if (incomeError) throw incomeError;

  // Fetch expenses for the specific month
  const { data: expenseData, error: expenseError } = await supabase
    .from('financial_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('transaction_type', 'expense')
    .gte('transaction_date', start)
    .lte('transaction_date', end);

  if (expenseError) throw expenseError;

  const income = incomeData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const expenses = expenseData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  
  return { income, expenses, netIncome: income - expenses };
};

export const fetchFinancialMetrics = async (): Promise<FinancialMetrics> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const userId = session.data.session.user.id;

    // Fetch current month data
    const currentMonth = await calculateMonthlyReturn(userId, 0);
    
    // Fetch previous month data
    const previousMonth = await calculateMonthlyReturn(userId, 1);

    // Fetch property data
    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .select('id, status, value, purchase_value, total_investment, type')
      .eq('user_id', userId);

    if (propertiesError) throw propertiesError;

    const totalProperties = propertiesData?.length || 0;
    const occupiedProperties = propertiesData?.filter(p => p.status === 'rented' || p.status === 'airbnb').length || 0;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

    // Calculate additional dashboard metrics
    const totalAcquisitionValue = propertiesData?.reduce((sum, p) => sum + (p.purchase_value || p.total_investment || 0), 0) || 0;
    const totalMarketValue = propertiesData?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
    const totalBookValue = totalMarketValue;

    // Calculate ROI percentages
    const currentMonthROI = totalAcquisitionValue > 0 ? (currentMonth.netIncome / totalAcquisitionValue) * 100 : 0;
    const previousMonthROI = totalAcquisitionValue > 0 ? (previousMonth.netIncome / totalAcquisitionValue) * 100 : 0;

    // Calculate growth percentage
    const monthlyGrowth = previousMonth.income > 0 ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 : 0;

    // Calculate average rent (current month income divided by occupied properties)
    const averageRent = occupiedProperties > 0 ? currentMonth.income / occupiedProperties : 0;

    // Calculate ROI by property type
    const roiByPropertyType: Record<string, number> = {};
    if (propertiesData) {
      const typeGroups = propertiesData.reduce((acc, property) => {
        const type = property.type || 'Outros';
        if (!acc[type]) {
          acc[type] = { count: 0, totalROI: 0, totalInvestment: 0 };
        }
        acc[type].count += 1;
        const investment = property.purchase_value || property.total_investment || property.value || 1;
        acc[type].totalInvestment += investment;
        return acc;
      }, {} as Record<string, { count: number; totalROI: number; totalInvestment: number }>);

      // Calculate ROI for each type based on their transactions
      for (const [type, data] of Object.entries(typeGroups)) {
        const typeProperties = propertiesData.filter(p => (p.type || 'Outros') === type);
        const typePropertyIds = typeProperties.map(p => p.id);
        
        // This would need additional queries for accurate ROI by type
        // For now, distribute current month income proportionally
        const typeIncome = currentMonth.income * (data.totalInvestment / totalAcquisitionValue);
        roiByPropertyType[type] = data.totalInvestment > 0 ? (typeIncome / data.totalInvestment) * 100 : 0;
      }
    }

    return {
      totalRevenue: currentMonth.income,
      totalExpenses: currentMonth.expenses,
      netIncome: currentMonth.netIncome,
      monthlyGrowth,
      totalProperties,
      occupiedProperties,
      occupancyRate,
      averageRent,
      totalAcquisitionValue,
      totalMarketValue,
      totalBookValue,
      averageMonthlyReturn: currentMonthROI,
      previousMonthReturn: previousMonthROI,
      previousMonthValue: previousMonth.netIncome,
      roiByPropertyType
    };
  } catch (error) {
    logger.error('Error fetching financial metrics:', error);
    throw error;
  }
};

export const fetchMonthlyFinancialData = async (months: number = 12): Promise<MonthlyFinancialData[]> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const monthWindows = Array.from({ length: months }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - months + 1 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        date,
      };
    });
    const startDate = monthWindows[0]?.date ?? new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_type, transaction_date')
      .eq('user_id', session.data.session.user.id)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    // Get property values for market data
    const { data: properties } = await supabase
      .from('properties')
      .select('value, purchase_value, total_investment')
      .eq('user_id', session.data.session.user.id);

    const totalMarketValue = properties?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
    const totalAcquisitionValue = properties?.reduce((sum, p) => sum + (p.purchase_value || p.total_investment || 0), 0) || 0;

    // Group by month and keep empty months visible for honest chart continuity.
    const monthlyData = monthWindows.reduce((acc, month) => {
      acc[month.key] = { revenue: 0, expenses: 0 };
      return acc;
    }, {} as Record<string, { revenue: number; expenses: number }>);

    transactions?.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        return;
      }

      if (transaction.transaction_type === 'income') {
        monthlyData[monthKey].revenue += transaction.amount || 0;
      } else {
        monthlyData[monthKey].expenses += transaction.amount || 0;
      }
    });

    return monthWindows.map(({ key }) => {
      const data = monthlyData[key];
      return {
        month: key,
        revenue: data.revenue,
        expenses: data.expenses,
        netIncome: data.revenue - data.expenses,
        marketValue: totalMarketValue,
        bookValue: totalMarketValue,
        acquisitionValue: totalAcquisitionValue
      };
    });
  } catch (error) {
    logger.error('Error fetching monthly financial data:', error);
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
      .select('id, title, total_investment, purchase_value, type, address, neighborhood')
      .eq('user_id', session.data.session.user.id);

    if (propertiesError) throw propertiesError;

    if (!properties || properties.length === 0) {
      return [];
    }

    const propertyIds = properties.map((property) => property.id);
    const { data: propertyTransactions, error: transactionsError } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_type, property_id')
      .eq('user_id', session.data.session.user.id)
      .in('property_id', propertyIds);

    if (transactionsError) throw transactionsError;

    const totalsByProperty = (propertyTransactions || []).reduce((acc, transaction) => {
      const propertyId = transaction.property_id;
      if (!propertyId) return acc;

      if (!acc[propertyId]) {
        acc[propertyId] = { revenue: 0, expenses: 0 };
      }

      if (transaction.transaction_type === 'income') {
        acc[propertyId].revenue += transaction.amount || 0;
      } else {
        acc[propertyId].expenses += transaction.amount || 0;
      }

      return acc;
    }, {} as Record<string, { revenue: number; expenses: number }>);

    const rankings: PropertyFinancialRanking[] = properties.map((property) => {
      const totals = totalsByProperty[property.id] || { revenue: 0, expenses: 0 };
      const revenue = totals.revenue;
      const expenses = totals.expenses;
      const netIncome = revenue - expenses;
      const investment = property.purchase_value || property.total_investment || 0;
      const roi = investment > 0 ? (netIncome / investment) * 100 : 0;

      return {
        propertyId: property.id,
        propertyTitle: property.title,
        revenue,
        expenses,
        netIncome,
        roi,
        // Additional properties for dashboard
        id: property.id,
        name: property.title,
        type: property.type || 'Residencial',
        location: property.address || 'Não informado',
        neighborhood: property.neighborhood || 'Não informado',
        monthlyReturn: netIncome,
        returnPercentage: roi
      };
    });

    return rankings.sort((a, b) => b.roi - a.roi);
  } catch (error) {
    logger.error('Error fetching property financial ranking:', error);
    throw error;
  }
};
