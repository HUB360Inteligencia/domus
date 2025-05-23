
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFinancialData } from '@/types/property';
import { addMonths, format, subMonths, parseISO } from 'date-fns';

/**
 * Calculates financial performance data for a property
 */
export const calculatePropertyFinancialData = async (propertyId: string): Promise<PropertyFinancialData> => {
  try {
    // Fetch the property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
    
    if (propertyError) {
      console.error('Error fetching property for financial calculation:', propertyError);
      throw propertyError;
    }

    // Fetch the latest valuation
    const { data: valuations, error: valuationError } = await supabase
      .from('property_valuations')
      .select('*')
      .eq('property_id', propertyId)
      .order('valuation_date', { ascending: false })
      .limit(1);
    
    if (valuationError) {
      console.error('Error fetching property valuation:', valuationError);
    }

    // Get the market value from the latest valuation or property value
    const marketValue = valuations?.length > 0 
      ? valuations[0].value 
      : property.value || 0;

    // Fetch investments
    const { data: investments, error: investmentsError } = await supabase
      .from('property_investments')
      .select('amount')
      .eq('property_id', propertyId);
    
    if (investmentsError) {
      console.error('Error fetching property investments:', investmentsError);
    }

    // Calculate total investment
    const totalInvestment = property.total_investment || property.purchase_value || 
      (investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0);

    // Get the start and end date for recent transactions
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);
    const startDate = format(sixMonthsAgo, 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');

    // Fetch recent income transactions
    const { data: incomeTransactions, error: incomeError } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_date')
      .eq('property_id', propertyId)
      .eq('transaction_type', 'income')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);
    
    if (incomeError) {
      console.error('Error fetching income transactions:', incomeError);
    }

    // Fetch recent expense transactions
    const { data: expenseTransactions, error: expenseError } = await supabase
      .from('financial_transactions')
      .select('amount, transaction_date')
      .eq('property_id', propertyId)
      .eq('transaction_type', 'expense')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);
    
    if (expenseError) {
      console.error('Error fetching expense transactions:', expenseError);
    }

    // Calculate monthly averages
    const totalIncome = incomeTransactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    const totalExpense = expenseTransactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    
    // Calculate monthly income and expenses (average over last 6 months)
    const monthlyIncome = totalIncome / 6;
    const monthlyExpense = totalExpense / 6;
    const monthlyNetIncome = monthlyIncome - monthlyExpense;

    // Calculate ROI
    const monthlyNetReturn = totalInvestment > 0 
      ? (monthlyNetIncome / totalInvestment) * 100 
      : 0;

    // Calculate accumulated ROI and total profit
    const accumulatedROI = totalInvestment > 0 
      ? ((marketValue - totalInvestment) / totalInvestment) * 100 
      : 0;
    
    const totalProfit = marketValue - totalInvestment;

    // Get vacancy rate
    const vacancyRate = property.vacancy_rate || 0;

    // Update property with financial metrics
    await supabase
      .from('properties')
      .update({
        monthly_return_rate: monthlyNetReturn,
        annual_return_rate: monthlyNetReturn * 12,
        total_investment: totalInvestment
      })
      .eq('id', propertyId);

    return {
      marketValue,
      totalInvestment,
      monthlyNetReturn,
      monthlyNetIncome,
      accumulatedROI,
      totalProfit,
      vacancyRate
    };
  } catch (err) {
    console.error('Failed to calculate property financial data:', err);
    throw err;
  }
};

/**
 * Generates monthly financial report data for a property
 */
export const generateMonthlyFinancialReport = async (
  propertyId: string, 
  months: number = 12
): Promise<any[]> => {
  try {
    const today = new Date();
    const result = [];

    // Fetch property data
    const { data: property } = await supabase
      .from('properties')
      .select('purchase_date, purchase_value')
      .eq('id', propertyId)
      .single();

    // Start from the earliest date between purchase date and X months ago
    let startDate = subMonths(today, months);
    if (property?.purchase_date) {
      const purchaseDate = parseISO(property.purchase_date);
      startDate = purchaseDate > startDate ? purchaseDate : startDate;
    }

    // Generate month range
    for (let i = 0; i < months; i++) {
      const currentMonth = addMonths(startDate, i);
      if (currentMonth > today) break;

      const monthStart = format(currentMonth, 'yyyy-MM-01');
      const nextMonth = addMonths(currentMonth, 1);
      const monthEnd = format(subMonths(nextMonth, 0), 'yyyy-MM-dd');

      // Fetch income transactions for this month
      const { data: incomeData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('property_id', propertyId)
        .eq('transaction_type', 'income')
        .gte('transaction_date', monthStart)
        .lt('transaction_date', monthEnd);

      // Fetch expense transactions for this month
      const { data: expenseData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('property_id', propertyId)
        .eq('transaction_type', 'expense')
        .gte('transaction_date', monthStart)
        .lt('transaction_date', monthEnd);

      // Calculate totals
      const income = incomeData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      const expenses = expenseData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      const profit = income - expenses;

      // Add to result
      result.push({
        month: format(currentMonth, 'MMM yyyy'),
        income,
        expenses,
        profit
      });
    }

    return result;
  } catch (err) {
    console.error('Failed to generate monthly financial report:', err);
    return [];
  }
};

/**
 * Generates ROI comparison data for a property over time
 */
export const generateRoiComparisonData = async (propertyId: string): Promise<any[]> => {
  try {
    // Fetch property valuations to track value growth
    const { data: valuations } = await supabase
      .from('property_valuations')
      .select('value, valuation_date')
      .eq('property_id', propertyId)
      .order('valuation_date', { ascending: true });

    // Fetch property data
    const { data: property } = await supabase
      .from('properties')
      .select('purchase_date, purchase_value, total_investment')
      .eq('id', propertyId)
      .single();

    if (!property || !valuations || valuations.length === 0) {
      return [];
    }

    const result = [];
    const initialInvestment = property.total_investment || property.purchase_value || 0;
    
    // Add purchase date as first point if available
    if (property.purchase_date && property.purchase_value) {
      result.push({
        date: format(parseISO(property.purchase_date), 'MMM yyyy'),
        value: property.purchase_value,
        roi: 0
      });
    }

    // Add valuation points
    valuations.forEach(valuation => {
      const roi = initialInvestment > 0 
        ? ((valuation.value - initialInvestment) / initialInvestment) * 100 
        : 0;
        
      result.push({
        date: format(parseISO(valuation.valuation_date), 'MMM yyyy'),
        value: valuation.value,
        roi: Number(roi.toFixed(2))
      });
    });

    return result;
  } catch (err) {
    console.error('Failed to generate ROI comparison data:', err);
    return [];
  }
};
