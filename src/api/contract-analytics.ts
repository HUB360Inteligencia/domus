
import { supabase } from "@/integrations/supabase/client";
import { Contract, ContractStatus, SignatureStatus, VariableRentValue } from "@/types/contract";

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

// Fetch upcoming events based on contracts, properties, and maintenance schedule
export async function fetchUpcomingEvents(): Promise<UpcomingEvent[]> {
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(now.getDate() + 30);
  
  // Format dates for Supabase query
  const today = now.toISOString().split('T')[0];
  const thirtyDaysFromNow = thirtyDaysLater.toISOString().split('T')[0];
  
  // Fetch contracts about to expire
  const { data: expiringContracts, error: contractError } = await supabase
    .from('contracts')
    .select(`
      id,
      title,
      end_date,
      property_id,
      property:property_id (
        title
      )
    `)
    .eq('status', 'active')
    .gte('end_date', today)
    .lte('end_date', thirtyDaysFromNow)
    .order('end_date', { ascending: true });
    
  if (contractError) {
    console.error('Error fetching expiring contracts:', contractError);
    throw contractError;
  }
  
  // Convert contracts to upcoming events
  const contractEvents: UpcomingEvent[] = expiringContracts?.map(contract => ({
    id: `contract-${contract.id}`,
    title: `Vencimento de Contrato`,
    property: contract.property?.title || 'Imóvel sem título',
    date: contract.end_date,
    type: 'contract',
    priority: 'high'
  })) || [];
  
  // In a real app, we would fetch other types of events like payments due, maintenance schedules, etc.
  // For now, we'll return just the contract events
  return contractEvents.slice(0, 5); // Return the 5 soonest events
}

// Fetch real contracts for display
export async function fetchRecentContracts(): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        property_id,
        property:properties(
          title,
          address,
          city,
          state,
          neighborhood,
          type,
          tags
        ),
        tenant_name,
        tenant_document,
        tenant_contact,
        start_date,
        end_date,
        value,
        payment_day,
        payment_due_day,
        deposit_value,
        status,
        terms,
        document_url,
        has_renewal_option,
        renewal_terms,
        special_conditions,
        created_at,
        updated_at,
        user_id,
        signature_status,
        has_variable_rent,
        variable_rent_values,
        on_time_discount_percentage,
        late_fee_percentage,
        is_discount_not_fee,
        late_interest_percentage,
        late_daily_interest,
        fine_percentage,
        payment_terms
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Transform the data to ensure contract types are correctly cast
    return data.map(item => ({
      ...item,
      status: item.status as ContractStatus,
      signature_status: item.signature_status as SignatureStatus,
      has_variable_rent: item.has_variable_rent ?? false,
      // Safely parse the variable_rent_values
      variable_rent_values: parseVariableRentValues(item.variable_rent_values),
      payment_due_day: item.payment_due_day ?? item.payment_day,
      on_time_discount_percentage: item.on_time_discount_percentage ?? null,
      late_fee_percentage: item.late_fee_percentage ?? null,
      is_discount_not_fee: item.is_discount_not_fee ?? true,
      late_interest_percentage: item.late_interest_percentage ?? null,
      late_daily_interest: item.late_daily_interest ?? null,
      fine_percentage: item.fine_percentage ?? null,
      payment_terms: item.payment_terms ?? null
    }));
  } catch (err) {
    console.error('Error in fetchRecentContracts:', err);
    return [];
  }
}

// Helper function to safely parse variable rent values
function parseVariableRentValues(rawValues: any): VariableRentValue[] | null {
  if (!rawValues) return null;
  
  try {
    // If it's already an array with the right structure, just cast it
    if (Array.isArray(rawValues) && 
        rawValues.length > 0 && 
        'month' in rawValues[0] && 
        'year' in rawValues[0] && 
        'value' in rawValues[0]) {
      return rawValues as VariableRentValue[];
    }
    
    // If it's a string, try to parse it
    if (typeof rawValues === 'string') {
      const parsed = JSON.parse(rawValues);
      return Array.isArray(parsed) ? parsed as VariableRentValue[] : null;
    }
    
    // If it's JSON from supabase that needs to be manually converted
    if (rawValues && typeof rawValues === 'object') {
      // Check if it's actually an array object from Supabase
      const parsedArray = Array.isArray(rawValues) 
        ? rawValues 
        : Object.values(rawValues);
        
      if (parsedArray.length > 0) {
        // Validate that the objects have the expected structure
        return parsedArray.map(item => {
          // Ensure each item has the required fields
          if (
            item && 
            typeof item === 'object' && 
            'month' in item && 
            'year' in item && 
            'value' in item
          ) {
            return {
              month: Number(item.month),
              year: Number(item.year),
              value: Number(item.value),
              applyUntilEnd: Boolean(item.applyUntilEnd ?? false)
            };
          }
          console.warn('Invalid variable rent value item:', item);
          // Provide a fallback for invalid items
          return {
            month: 1,
            year: new Date().getFullYear(),
            value: 0,
            applyUntilEnd: false
          };
        });
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing variable rent values:', error, rawValues);
    return null;
  }
}
