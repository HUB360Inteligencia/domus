
import { supabase } from '@/integrations/supabase/client';
import { Contract, ContractStatus, SignatureStatus } from '@/types/contract';
import { Json } from '@/integrations/supabase/types';

// Helper function to convert Json to proper type
const convertJsonToVariableRentValues = (jsonValue: Json | null) => {
  if (!jsonValue) return null;
  try {
    if (typeof jsonValue === 'string') {
      return JSON.parse(jsonValue);
    }
    return jsonValue;
  } catch (e) {
    console.error('Error parsing variable_rent_values:', e);
    return null;
  }
};

export interface ContractStats {
  total: number;
  active: number;
  expiringSoon: number;
}

export interface FinancialStats {
  monthlyIncome: string;
  annualIncome: string;
  occupancyRate: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  property: string;
  date: string;
  type: "contract" | "payment" | "maintenance";
  priority: "high" | "medium" | "low";
}

// Fetch contract statistics
export async function fetchContractStats(): Promise<ContractStats> {
  // Get current date
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  // Format dates for Supabase query
  const today = now.toISOString().split('T')[0];
  const thirtyDaysLater = thirtyDaysFromNow.toISOString().split('T')[0];
  
  // Get total contracts
  const { data: allContracts, error: totalError } = await supabase
    .from('contracts')
    .select('id');
    
  if (totalError) {
    console.error('Error fetching total contracts:', totalError);
    throw totalError;
  }
  
  // Get active contracts
  const { data: activeContracts, error: activeError } = await supabase
    .from('contracts')
    .select('id')
    .eq('status', 'active');
    
  if (activeError) {
    console.error('Error fetching active contracts:', activeError);
    throw activeError;
  }
  
  // Get contracts expiring soon
  const { data: expiringContracts, error: expiringError } = await supabase
    .from('contracts')
    .select('id')
    .eq('status', 'active')
    .gte('end_date', today)
    .lte('end_date', thirtyDaysLater);
    
  if (expiringError) {
    console.error('Error fetching expiring contracts:', expiringError);
    throw expiringError;
  }
  
  return {
    total: allContracts?.length || 0,
    active: activeContracts?.length || 0,
    expiringSoon: expiringContracts?.length || 0
  };
}

// Calculate financial statistics based on active contracts
export async function calculateFinancialStats(): Promise<FinancialStats> {
  const { data: activeContracts, error } = await supabase
    .from('contracts')
    .select('value')
    .eq('status', 'active');
    
  if (error) {
    console.error('Error calculating financial stats:', error);
    throw error;
  }
  
  // Sum up monthly income from all active contracts
  const monthlyIncome = activeContracts?.reduce((sum, contract) => sum + (contract.value || 0), 0) || 0;
  const annualIncome = monthlyIncome * 12;
  
  // Format currency values
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
  
  // Get property statistics for occupancy rate
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('id, status');
    
  if (propError) {
    console.error('Error fetching properties for occupancy rate:', propError);
    throw propError;
  }
  
  // Calculate occupancy rate
  const totalProperties = properties?.length || 0;
  const occupiedProperties = properties?.filter(p => p.status === 'rented' || p.status === 'airbnb').length || 0;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;
  
  return {
    monthlyIncome: formatter.format(monthlyIncome),
    annualIncome: formatter.format(annualIncome),
    occupancyRate: `${occupancyRate}%`
  };
}

// Generate chart data for income and expenses
export async function generateFinancialChartData(): Promise<any[]> {
  // Fetch contracts to calculate income
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('value, start_date, status')
    .eq('status', 'active');
    
  if (error) {
    console.error('Error fetching contract data for chart:', error);
    throw error;
  }
  
  // Get current month and previous 5 months
  const months = [];
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: monthNames[date.getMonth()],
      month: date.getMonth(),
      year: date.getFullYear()
    });
  }
  
  // Calculate income for each month
  const chartData = months.map((monthData) => {
    // Sum contracts active in this month
    const monthlyIncome = contracts?.reduce((sum, contract) => {
      const startDate = new Date(contract.start_date);
      // Check if contract was active in this month
      if (startDate <= new Date(monthData.year, monthData.month, 1)) {
        return sum + (contract.value || 0);
      }
      return sum;
    }, 0) || 0;
    
    // Estimate expenses at roughly 30% of income with some variance
    const baseExpenses = monthlyIncome * 0.3;
    const variance = baseExpenses * 0.2; // 20% variance
    const expenses = Math.round(baseExpenses + (Math.random() * variance - variance/2));
    
    return {
      name: monthData.name,
      income: monthlyIncome,
      expenses: expenses
    };
  });
  
  return chartData;
}

// Fetch upcoming events related to contracts (expirations, renewals, payments)
export const fetchUpcomingEvents = async () => {
  try {
    // Fetch contracts that are expiring soon
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const { data: expiringContracts, error: expiringError } = await supabase
      .from('contracts')
      .select(`
        id, title, end_date, status, property:properties(title)
      `)
      .eq('status', 'active')
      .lte('end_date', thirtyDaysLater.toISOString().split('T')[0])
      .gte('end_date', today.toISOString().split('T')[0])
      .order('end_date', { ascending: true });

    if (expiringError) {
      console.error('Error fetching expiring contracts:', expiringError);
      throw expiringError;
    }

    // Fetch upcoming payments
    const { data: upcomingPayments, error: paymentsError } = await supabase
      .from('contracts')
      .select(`
        id, title, payment_day, value, property:properties(title)
      `)
      .eq('status', 'active');

    if (paymentsError) {
      console.error('Error fetching upcoming payments:', paymentsError);
      throw paymentsError;
    }

    // Process upcoming payments
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    const paymentEvents = upcomingPayments.map(contract => {
      // Calculate this month's payment date
      const paymentDate = new Date(currentYear, currentMonth, contract.payment_day);
      // If payment date has passed, use next month
      const useNextMonth = paymentDate < today;
      const eventDate = useNextMonth 
        ? new Date(nextMonthYear, nextMonth, contract.payment_day)
        : paymentDate;
      
      return {
        id: contract.id,
        title: contract.title,
        property_title: contract.property?.[0]?.title || 'Unknown Property',
        type: 'payment',
        date: eventDate.toISOString().split('T')[0],
        amount: contract.value
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format expiration events
    const expirationEvents = expiringContracts.map(contract => ({
      id: contract.id,
      title: contract.title,
      property_title: contract.property?.[0]?.title || 'Unknown Property',
      type: 'expiration',
      date: contract.end_date,
      daysRemaining: Math.ceil((new Date(contract.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }));

    return {
      expirations: expirationEvents,
      payments: paymentEvents
    };
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }
};

// Fetch real contracts for display
export const fetchRecentContracts = async (): Promise<Contract[]> => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        property:properties(
          title, 
          address, 
          city, 
          state
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent contracts:', error);
      throw error;
    }

    return data as unknown as Contract[];
  } catch (error) {
    console.error('Error fetching recent contracts:', error);
    throw error;
  }
};
