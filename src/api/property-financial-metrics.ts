
import { supabase } from '@/integrations/supabase/client';

export interface PropertyFinancialMetrics {
  monthlyProfitability: number;
  accumulatedROI: number;
  vacancyRate: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalInvestment: number;
}

export const fetchPropertyFinancialMetrics = async (propertyId: string): Promise<PropertyFinancialMetrics> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }

    // Get property data first
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('purchase_value, total_investment')
      .eq('id', propertyId)
      .single();

    if (propertyError) throw propertyError;

    // Get all financial transactions for this property
    const { data: transactions, error: transactionsError } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_type, transaction_date')
      .eq('property_id', propertyId);

    if (transactionsError) throw transactionsError;

    // Get all investments for this property
    const { data: investments, error: investmentsError } = await supabase
      .from('property_investments')
      .select('amount')
      .eq('property_id', propertyId);

    if (investmentsError) throw investmentsError;

    // Get occupancy periods to calculate vacancy
    const { data: occupancyPeriods, error: occupancyError } = await supabase
      .from('property_occupancy_periods')
      .select('start_date, end_date')
      .eq('property_id', propertyId)
      .order('start_date', { ascending: true });

    if (occupancyError) throw occupancyError;

    // Calculate metrics
    const totalRevenue = transactions?.filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    const totalExpenses = transactions?.filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    const netIncome = totalRevenue - totalExpenses;

    const additionalInvestments = investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    const totalInvestment = (property?.purchase_value || property?.total_investment || 0) + additionalInvestments;

    // Calculate monthly profitability (last 12 months average)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentTransactions = transactions?.filter(t => 
      new Date(t.transaction_date) >= oneYearAgo
    ) || [];

    const recentRevenue = recentTransactions.filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const recentExpenses = recentTransactions.filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const recentNetIncome = recentRevenue - recentExpenses;
    
    const monthlyProfitability = totalInvestment > 0 ? (recentNetIncome / 12 / totalInvestment) * 100 : 0;

    // Calculate accumulated ROI
    const accumulatedROI = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;

    // Calculate vacancy rate
    let vacancyRate = 0;
    if (occupancyPeriods && occupancyPeriods.length > 0) {
      const now = new Date();
      const oneYearAgoDate = new Date();
      oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);

      let totalDays = 365;
      let occupiedDays = 0;

      for (const period of occupancyPeriods) {
        const startDate = new Date(period.start_date);
        const endDate = period.end_date ? new Date(period.end_date) : now;
        
        // Only consider periods within the last year
        const periodStart = startDate > oneYearAgoDate ? startDate : oneYearAgoDate;
        const periodEnd = endDate < now ? endDate : now;
        
        if (periodStart < periodEnd) {
          const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
          occupiedDays += daysInPeriod;
        }
      }

      vacancyRate = Math.max(0, Math.min(100, ((totalDays - occupiedDays) / totalDays) * 100));
    } else {
      vacancyRate = 100; // No occupancy data means 100% vacancy
    }

    return {
      monthlyProfitability,
      accumulatedROI,
      vacancyRate,
      totalRevenue,
      totalExpenses,
      netIncome,
      totalInvestment
    };
  } catch (error) {
    console.error('Error fetching property financial metrics:', error);
    throw error;
  }
};

export const fetchActiveContractForProperty = async (propertyId: string) => {
  try {
    const now = new Date().toISOString().split('T')[0];
    
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .maybeSingle();

    if (error) throw error;
    return contract;
  } catch (error) {
    console.error('Error fetching active contract:', error);
    return null;
  }
};
