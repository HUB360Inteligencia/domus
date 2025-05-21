
import { supabase } from "@/integrations/supabase/client";
import { 
  FinancialTransaction, 
  FinancialTransactionFormData, 
  FinancialAnalytics,
  FinancialReportFilters,
  FinancialCategory
} from "@/types/financial";
import { Property } from "@/types/property";

/**
 * Busca todas as transações financeiras do usuário
 */
export const fetchFinancialTransactions = async (
  filters?: FinancialReportFilters
): Promise<FinancialTransaction[]> => {
  try {
    console.log('Buscando transações financeiras com filtros:', filters);
    
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    // Aplicar filtros se fornecidos
    if (filters) {
      if (filters.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      
      if (filters.propertyIds && filters.propertyIds.length > 0) {
        query = query.in('property_id', filters.propertyIds);
      }
      
      if (filters.transactionTypes && filters.transactionTypes.length > 0) {
        query = query.in('transaction_type', filters.transactionTypes);
      }
      
      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar transações financeiras:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Falha ao buscar transações financeiras:', err);
    throw err;
  }
};

/**
 * Busca todas as transações financeiras de um imóvel específico
 */
export const fetchPropertyFinancialTransactions = async (
  propertyId: string,
  filters?: FinancialReportFilters
): Promise<FinancialTransaction[]> => {
  try {
    console.log(`Buscando transações financeiras para o imóvel ID: ${propertyId}`);
    
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .eq('property_id', propertyId)
      .order('transaction_date', { ascending: false });

    // Aplicar filtros adicionais se fornecidos
    if (filters) {
      if (filters.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      
      if (filters.transactionTypes && filters.transactionTypes.length > 0) {
        query = query.in('transaction_type', filters.transactionTypes);
      }
      
      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar transações financeiras do imóvel:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error(`Falha ao buscar transações financeiras do imóvel ${propertyId}:`, err);
    throw err;
  }
};

/**
 * Cria uma nova transação financeira
 */
export const createFinancialTransaction = async (
  transactionData: FinancialTransactionFormData
): Promise<FinancialTransaction> => {
  try {
    console.log('Criando transação financeira:', transactionData);
    
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Usuário não autenticado');
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([{
        ...transactionData,
        user_id: user.data.user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação financeira:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Falha ao criar transação financeira:', err);
    throw err;
  }
};

/**
 * Atualiza uma transação financeira existente
 */
export const updateFinancialTransaction = async (
  id: string,
  transactionData: Partial<FinancialTransactionFormData>
): Promise<FinancialTransaction> => {
  try {
    console.log(`Atualizando transação financeira ${id}:`, transactionData);
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .update(transactionData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar transação financeira:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Falha ao atualizar transação financeira:', err);
    throw err;
  }
};

/**
 * Exclui uma transação financeira
 */
export const deleteFinancialTransaction = async (id: string): Promise<void> => {
  try {
    console.log(`Excluindo transação financeira ${id}`);
    
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir transação financeira:', error);
      throw error;
    }
  } catch (err) {
    console.error('Falha ao excluir transação financeira:', err);
    throw err;
  }
};

/**
 * Busca todas as categorias financeiras
 */
export const fetchFinancialCategories = async (
  type?: 'income' | 'expense'
): Promise<FinancialCategory[]> => {
  try {
    console.log('Buscando categorias financeiras, tipo:', type);
    
    let query = supabase
      .from('financial_categories')
      .select('*')
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar categorias financeiras:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Falha ao buscar categorias financeiras:', err);
    throw err;
  }
};

/**
 * Cria uma nova categoria financeira personalizada
 */
export const createFinancialCategory = async (
  name: string, 
  type: 'income' | 'expense'
): Promise<FinancialCategory> => {
  try {
    console.log('Criando categoria financeira:', { name, type });
    
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Usuário não autenticado');
    
    const { data, error } = await supabase
      .from('financial_categories')
      .insert([{
        name,
        type,
        user_id: user.data.user.id,
        is_default: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria financeira:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Falha ao criar categoria financeira:', err);
    throw err;
  }
};

/**
 * Calcula análises financeiras
 */
export const calculateFinancialAnalytics = async (
  properties: Property[],
  filters?: FinancialReportFilters
): Promise<FinancialAnalytics> => {
  try {
    // Buscar todas as transações financeiras com os filtros fornecidos
    const transactions = await fetchFinancialTransactions(filters);
    
    // Valores iniciais
    const result: FinancialAnalytics = {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      roi: 0,
      monthlyROI: 0,
      annualROI: 0,
      propertyValues: {
        totalValue: 0,
        byProperty: {}
      },
      incomeByCategory: {},
      expensesByCategory: {},
      monthlyData: [],
      propertiesROI: []
    };
    
    // Calcular valor total de propriedades
    properties.forEach(property => {
      const propertyValue = Number(property.value) || 0;
      result.propertyValues.totalValue += propertyValue;
      result.propertyValues.byProperty[property.id] = propertyValue;
    });
    
    // Agrupar transações por mês
    const transactionsByMonth: Record<string, FinancialTransaction[]> = {};
    const now = new Date();
    
    // Inicializar dados para os últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - i);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      transactionsByMonth[monthKey] = [];
    }
    
    // Agrupar transações por mês e calcular totais
    transactions.forEach(transaction => {
      const txDate = new Date(transaction.transaction_date);
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Adicionar à lista de transações do mês se for nos últimos 12 meses
      if (transactionsByMonth[monthKey] !== undefined) {
        transactionsByMonth[monthKey].push(transaction);
      }
      
      // Calcular totais
      if (transaction.transaction_type === 'income') {
        result.totalIncome += Number(transaction.amount);
        result.incomeByCategory[transaction.category] = (result.incomeByCategory[transaction.category] || 0) + Number(transaction.amount);
      } else {
        result.totalExpenses += Number(transaction.amount);
        result.expensesByCategory[transaction.category] = (result.expensesByCategory[transaction.category] || 0) + Number(transaction.amount);
      }
    });
    
    // Calcular receita líquida
    result.netIncome = result.totalIncome - result.totalExpenses;
    
    // Calcular ROI
    if (result.propertyValues.totalValue > 0) {
      result.roi = (result.netIncome / result.propertyValues.totalValue) * 100;
      result.monthlyROI = result.roi / 12;
      result.annualROI = result.roi;
    }
    
    // Preparar dados mensais
    Object.entries(transactionsByMonth).sort().forEach(([monthKey, monthTransactions]) => {
      const monthIncome = monthTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const monthExpenses = monthTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'short' });
      
      result.monthlyData.push({
        month: `${monthName}/${year}`,
        income: monthIncome,
        expense: monthExpenses,
        net: monthIncome - monthExpenses
      });
    });
    
    // Ordenar dados mensais para ordem cronológica
    result.monthlyData.reverse();
    
    // Calcular ROI por propriedade
    properties.forEach(property => {
      const propertyTransactions = transactions.filter(t => t.property_id === property.id);
      const propertyIncome = propertyTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const propertyExpenses = propertyTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const propertyNet = propertyIncome - propertyExpenses;
      const propertyValue = Number(property.value) || 0;
      
      let roi = 0;
      if (propertyValue > 0) {
        roi = (propertyNet / propertyValue) * 100;
      }
      
      result.propertiesROI.push({
        propertyId: property.id,
        propertyTitle: property.title,
        roi: roi,
        monthlyROI: roi / 12,
        annualROI: roi
      });
    });
    
    // Ordenar propriedades por ROI
    result.propertiesROI.sort((a, b) => b.roi - a.roi);
    
    return result;
  } catch (err) {
    console.error('Falha ao calcular análises financeiras:', err);
    throw err;
  }
};

/**
 * Gera e exporta relatório financeiro em formato PDF ou Excel
 */
export const generateFinancialReport = async (
  format: 'pdf' | 'excel',
  data: any,
  title: string
): Promise<Blob> => {
  // Esta função seria implementada com uma biblioteca de geração de relatórios
  // Por enquanto, vamos apenas simular criando um JSON blob
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return blob;
};
