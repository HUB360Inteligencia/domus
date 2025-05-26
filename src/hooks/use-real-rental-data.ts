
import { useMemo } from 'react';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useGoals } from '@/hooks/use-goals';
import { addMonths, format, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface RealAnalyticsData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  occupancy: number;
  activeContracts: number;
  marketValue: number;
}

export interface Alert {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GoalProgress {
  name: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
}

export const useRealRentalData = () => {
  const { properties } = useProperties();
  const { contracts } = useContracts();
  const { transactions } = useFinancialTransactions();
  const { data: goals } = useGoals();

  // Calcular dados analíticos baseados em locações reais
  const analyticsData = useMemo((): RealAnalyticsData[] => {
    if (!contracts || !transactions || !properties) return [];

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = addMonths(new Date(), -5 + i);
      return {
        date,
        month: format(date, 'MMM', { locale: ptBR }),
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
    });

    return last6Months.map(({ month, start, end }) => {
      // Contratos ativos no período
      const activeContractsInPeriod = contracts.filter(contract =>
        contract.status === 'active' &&
        new Date(contract.start_date) <= end &&
        new Date(contract.end_date) >= start
      );

      // Receita mensal baseada em valores de aluguel dos contratos ativos
      const monthlyRevenue = activeContractsInPeriod.reduce((sum, contract) => {
        // Primeiro tenta usar o valor do contrato, se não tiver, usa o rental_value da propriedade
        const contractValue = Number(contract.value || 0);
        if (contractValue > 0) {
          return sum + contractValue;
        }
        
        // Se não tiver valor no contrato, busca o rental_value da propriedade
        const property = properties.find(p => p.id === contract.property_id);
        const rentalValue = Number(property?.rental_value || 0);
        return sum + rentalValue;
      }, 0);

      // Despesas do período
      const monthlyExpenses = transactions
        .filter(t => 
          t.transaction_type === 'expense' && 
          new Date(t.transaction_date) >= start && 
          new Date(t.transaction_date) <= end
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Taxa de ocupação (imóveis com contratos ativos)
      const propertiesWithActiveContracts = properties.filter(property =>
        activeContractsInPeriod.some(contract => contract.property_id === property.id)
      );
      const occupancyRate = properties.length > 0 
        ? (propertiesWithActiveContracts.length / properties.length) * 100 
        : 0;

      // Valor patrimonial total
      const totalMarketValue = properties.reduce((sum, p) => sum + Number(p.value || 0), 0);

      return {
        month,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses,
        occupancy: Math.round(occupancyRate),
        activeContracts: activeContractsInPeriod.length,
        marketValue: totalMarketValue
      };
    });
  }, [contracts, transactions, properties]);

  // Gerar alertas baseados em dados reais
  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = [];

    if (contracts) {
      // Contratos vencendo nos próximos 30 dias
      const now = new Date();
      const thirtyDaysFromNow = addMonths(now, 1);
      
      const expiringContracts = contracts.filter(contract => {
        const endDate = new Date(contract.end_date);
        return isAfter(endDate, now) && isBefore(endDate, thirtyDaysFromNow);
      });

      if (expiringContracts.length > 0) {
        alertList.push({
          type: 'warning',
          title: 'Contratos Vencendo',
          description: `${expiringContracts.length} contratos vencem nos próximos 30 dias`,
          priority: 'high',
        });
      }

      // Verificar se meta de ocupação foi atingida
      if (properties && goals) {
        const occupancyGoal = goals.find(g => g.goal_type === 'occupancy');
        const activeContracts = contracts.filter(c => c.status === 'active').length;
        const occupancyRate = properties.length > 0 ? (activeContracts / properties.length) * 100 : 0;

        if (occupancyGoal && occupancyRate >= occupancyGoal.target_value) {
          alertList.push({
            type: 'success',
            title: 'Meta de Ocupação Atingida',
            description: `Taxa de ocupação atual: ${occupancyRate.toFixed(1)}%`,
            priority: 'low',
          });
        }
      }
    }

    return alertList;
  }, [contracts, properties, goals]);

  // Progresso das metas
  const goalsProgress = useMemo((): GoalProgress[] => {
    if (!goals || !properties || !contracts) return [];

    const progressList: GoalProgress[] = [];

    goals.forEach(goal => {
      let current = 0;
      let unit = '';

      switch (goal.goal_type) {
        case 'occupancy':
          const activeContracts = contracts.filter(c => c.status === 'active').length;
          current = properties.length > 0 ? (activeContracts / properties.length) * 100 : 0;
          unit = '%';
          break;
        case 'revenue':
          current = contracts
            .filter(c => c.status === 'active')
            .reduce((sum, c) => sum + Number(c.value || 0), 0);
          unit = 'R$';
          break;
        case 'active_contracts':
          current = contracts.filter(c => c.status === 'active').length;
          unit = 'contratos';
          break;
      }

      const progress = Math.min((current / goal.target_value) * 100, 100);

      progressList.push({
        name: goal.goal_type === 'occupancy' ? 'Meta de Ocupação' :
              goal.goal_type === 'revenue' ? 'Meta de Receita' : 'Contratos Ativos',
        current,
        target: goal.target_value,
        unit,
        progress
      });
    });

    return progressList;
  }, [goals, properties, contracts]);

  // KPIs principais
  const kpiData = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];

    const latest = analyticsData[analyticsData.length - 1];
    const previous = analyticsData[analyticsData.length - 2];

    const totalRevenue = analyticsData.reduce((sum, item) => sum + item.revenue, 0);
    const revenueChange = previous ? ((latest.revenue - previous.revenue) / (previous.revenue || 1)) * 100 : 0;

    const occupancyChange = previous ? (latest.occupancy - previous.occupancy) : 0;

    const totalProfit = analyticsData.reduce((sum, item) => sum + item.profit, 0);
    const profitChange = previous ? ((latest.profit - previous.profit) / (Math.abs(previous.profit) || 1)) * 100 : 0;

    return [
      {
        title: 'Receita de Locações',
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(latest.revenue),
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
        trend: revenueChange >= 0 ? 'up' : 'down',
        icon: 'DollarSign',
      },
      {
        title: 'Contratos Ativos',
        value: latest.activeContracts.toString(),
        change: `${properties?.length || 0} propriedades`,
        trend: 'up',
        icon: 'Building',
      },
      {
        title: 'Taxa de Ocupação',
        value: `${latest.occupancy}%`,
        change: `${occupancyChange >= 0 ? '+' : ''}${occupancyChange}%`,
        trend: occupancyChange >= 0 ? 'up' : 'down',
        icon: 'Users',
      },
      {
        title: 'Lucro Líquido',
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(latest.profit),
        change: `${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`,
        trend: profitChange >= 0 ? 'up' : 'down',
        icon: 'Target',
      },
    ];
  }, [analyticsData, properties]);

  return {
    analyticsData,
    alerts,
    goalsProgress,
    kpiData,
    isLoading: false
  };
};
