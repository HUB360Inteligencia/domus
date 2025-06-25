
import React from 'react';
import { DashboardKPICard } from '@/components/dashboard/DashboardKPICard';
import { CompactDonutChart } from '@/components/dashboard/CompactDonutChart';
import { MiniTrendsWidget } from '@/components/dashboard/MiniTrendsWidget';
import { CompactActivitiesWidget } from '@/components/dashboard/CompactActivitiesWidget';
import { AssetGrowthChartWidget } from '@/components/dashboard/AssetGrowthChartWidget';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { formatCurrency } from '@/utils/currency';
import { Home, DollarSign, Target } from 'lucide-react';

export default function Dashboard() {
  const metrics = useDashboardMetrics();
  const { properties } = useProperties();
  const { transactions } = useFinancialTransactions();

  // Tradução de tipos de imóveis
  const translatePropertyType = (type: string) => {
    const translations: Record<string, string> = {
      'house': 'Casa',
      'apartment': 'Apartamento',
      'commercial': 'Comercial',
      'land': 'Terreno',
      'studio': 'Studio',
      'office': 'Escritório',
      'warehouse': 'Galpão',
      'store': 'Loja'
    };
    return translations[type?.toLowerCase()] || type || 'Outros';
  };

  // Calcular performance do mês anterior CORRIGIDO
  const previousMonthPerformance = React.useMemo(() => {
    const now = new Date();
    
    // Mês anterior (que estamos analisando)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Mês anterior ao mês anterior (para comparação)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

    // Transações do mês anterior
    const previousMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= previousMonth && transactionDate <= previousMonthEnd;
    });

    // Transações de dois meses atrás
    const twoMonthsAgoTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= twoMonthsAgo && transactionDate <= twoMonthsAgoEnd;
    });

    // Receitas e despesas do mês anterior
    const previousRevenue = previousMonthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousExpenses = previousMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Receitas e despesas de dois meses atrás
    const twoMonthsAgoRevenue = twoMonthsAgoTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const twoMonthsAgoExpenses = twoMonthsAgoTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Saldos
    const previousBalance = previousRevenue - previousExpenses;
    const twoMonthsAgoBalance = twoMonthsAgoRevenue - twoMonthsAgoExpenses;

    // Calcular porcentagem de mudança do saldo
    let balanceChangePercentage = 0;
    if (twoMonthsAgoBalance !== 0) {
      balanceChangePercentage = ((previousBalance - twoMonthsAgoBalance) / Math.abs(twoMonthsAgoBalance)) * 100;
    } else if (previousBalance > 0) {
      balanceChangePercentage = 100; // Se não havia saldo antes e agora há um positivo
    } else if (previousBalance < 0) {
      balanceChangePercentage = -100; // Se não havia saldo antes e agora há um negativo
    }

    // Determinar tendência baseada na mudança percentual
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (balanceChangePercentage > 0) {
      trend = 'up';
    } else if (balanceChangePercentage < 0) {
      trend = 'down';
    }

    return {
      revenue: previousRevenue,
      expenses: previousExpenses,
      balance: previousBalance,
      balanceChangePercentage,
      trend
    };
  }, [transactions]);

  // Gerar dados para o gráfico de tipos de imóveis
  const propertyTypesData = React.useMemo(() => {
    if (!properties) return [];
    
    const typeCount = properties.reduce((acc, property) => {
      const type = translatePropertyType(property.type);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount).map(([name, value]) => ({
      name: name,
      value
    }));
  }, [properties]);

  // Gerar dados sparkline simulados para tendências
  const generateSparklineData = (baseValue: number, trend: 'up' | 'down' | 'neutral') => {
    const data = [];
    let current = baseValue * 0.8;
    
    for (let i = 0; i < 12; i++) {
      const variation = trend === 'up' ? Math.random() * 0.05 + 0.02 :
                       trend === 'down' ? Math.random() * -0.05 - 0.02 :
                       (Math.random() - 0.5) * 0.02;
      current = current * (1 + variation);
      data.push(current);
    }
    
    return data;
  };

  return (
    <div className="container py-4">
      {/* Grid Layout reorganizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* LINHA 1 - KPIs Principais + Performance (4 colunas) */}
        <div className="lg:col-span-1">
          <DashboardKPICard
            title="Propriedades"
            value={`${metrics.rentedProperties}/${metrics.totalProperties}`}
            subtitle={`${metrics.occupancyRate.toFixed(1)}% ocupação`}
            icon={<Home />}
            trend={metrics.occupancyRate > 80 ? 'up' : metrics.occupancyRate < 60 ? 'down' : 'neutral'}
            trendValue={`${metrics.occupancyRate > 80 ? '+' : ''}${(metrics.occupancyRate - 75).toFixed(1)}%`}
            sparklineData={generateSparklineData(metrics.occupancyRate, metrics.occupancyRate > 80 ? 'up' : 'neutral')}
            variant="white"
          />
        </div>
        
        <div className="lg:col-span-1">
          <DashboardKPICard
            title="Patrimônio Total"
            value={formatCurrency(metrics.totalMarketValue)}
            subtitle="valor de mercado"
            icon={<DollarSign />}
            trend={metrics.assetGrowthPercentage > 0 ? 'up' : 'down'}
            trendValue={`${metrics.assetGrowthPercentage >= 0 ? '+' : ''}${metrics.assetGrowthPercentage.toFixed(1)}%`}
            sparklineData={generateSparklineData(metrics.totalMarketValue, metrics.assetGrowthPercentage > 0 ? 'up' : 'down')}
            variant="white"
          />
        </div>
        
        <div className="lg:col-span-1">
          <DashboardKPICard
            title="ROI Mensal"
            value={`${metrics.monthlyROI.onInvestment.toFixed(2)}%`}
            subtitle="último mês"
            icon={<Target />}
            trend={metrics.monthlyROI.trend}
            trendValue={`${metrics.monthlyROI.lastMonth > metrics.monthlyROI.average12Months ? '+' : ''}${(metrics.monthlyROI.lastMonth - metrics.monthlyROI.average12Months).toFixed(2)}%`}
            sparklineData={generateSparklineData(metrics.monthlyROI.onInvestment, metrics.monthlyROI.trend)}
            variant="white"
          />
        </div>

        <div className="lg:col-span-1">
          <DashboardKPICard
            title="Performance do Mês Anterior"
            value={formatCurrency(previousMonthPerformance.balance)}
            subtitle={`R: ${formatCurrency(previousMonthPerformance.revenue)} | D: ${formatCurrency(previousMonthPerformance.expenses)}`}
            icon={<DollarSign />}
            trend={previousMonthPerformance.trend}
            trendValue={`${previousMonthPerformance.balanceChangePercentage >= 0 ? '+' : ''}${previousMonthPerformance.balanceChangePercentage.toFixed(1)}%`}
            variant="gray"
          />
        </div>
        
        {/* LINHA 2 - Gráficos Principais (4 colunas) */}
        <div className="lg:col-span-2">
          <AssetGrowthChartWidget />
        </div>
        
        <div className="lg:col-span-2">
          <MiniTrendsWidget />
        </div>
        
        {/* LINHA 3 - Tipos de Imóveis + Atividades Expandido (4 colunas) */}
        <div className="lg:col-span-2">
          <CompactDonutChart
            title="Tipos de Imóveis"
            data={propertyTypesData}
            variant="gray"
          />
        </div>
        
        <div className="lg:col-span-2">
          <CompactActivitiesWidget />
        </div>
        
      </div>
    </div>
  );
}
