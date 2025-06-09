
import React from 'react';
import { DashboardKPICard } from '@/components/dashboard/DashboardKPICard';
import { CompactDonutChart } from '@/components/dashboard/CompactDonutChart';
import { HorizontalBarChart } from '@/components/dashboard/HorizontalBarChart';
import { MiniTrendsWidget } from '@/components/dashboard/MiniTrendsWidget';
import { CompactActivitiesWidget } from '@/components/dashboard/CompactActivitiesWidget';
import { AssetGrowthChartWidget } from '@/components/dashboard/AssetGrowthChartWidget';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useProperties } from '@/hooks/use-properties';
import { formatCurrency } from '@/utils/currency';
import { Home, DollarSign, Target, MapPin } from 'lucide-react';

export default function Dashboard() {
  const metrics = useDashboardMetrics();
  const { properties } = useProperties();

  // Gerar dados para o gráfico de tipos de imóveis
  const propertyTypesData = React.useMemo(() => {
    if (!properties) return [];
    
    const typeCount = properties.reduce((acc, property) => {
      const type = property.type || 'Outros';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount).map(([name, value]) => ({
      name,
      value
    }));
  }, [properties]);

  // Gerar dados para o gráfico de bairros
  const neighborhoodData = React.useMemo(() => {
    if (!properties) return [];
    
    const neighborhoodCount = properties.reduce((acc, property) => {
      const neighborhood = property.neighborhood || 'Não informado';
      acc[neighborhood] = (acc[neighborhood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(neighborhoodCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
      {/* Grid Layout mais compacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* LINHA 1 - KPIs Principais (3 colunas) */}
        <div className="md:col-span-1">
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
        
        <div className="md:col-span-1">
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
        
        <div className="md:col-span-1">
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
        
        {/* LINHA 2 - Performance + Mini Trends (4 colunas) */}
        <div className="md:col-span-2">
          <DashboardKPICard
            title="Performance Financeira"
            value={formatCurrency(metrics.netBalance)}
            subtitle={`Receitas: ${formatCurrency(metrics.totalRevenue)} | Despesas: ${formatCurrency(metrics.totalExpenses)}`}
            icon={<DollarSign />}
            trend={metrics.profitTrend}
            trendValue={`${metrics.profitTrend === 'up' ? '+' : metrics.profitTrend === 'down' ? '-' : ''}15.3%`}
            variant="gray"
            className="h-32"
          />
        </div>
        
        <div className="md:col-span-2">
          <MiniTrendsWidget />
        </div>
        
        {/* LINHA 3 - Gráficos Principais (4 colunas) */}
        <div className="md:col-span-2">
          <AssetGrowthChartWidget />
        </div>
        
        <div className="md:col-span-1">
          <CompactDonutChart
            title="Tipos de Imóveis"
            data={propertyTypesData}
            variant="gray"
          />
        </div>
        
        <div className="md:col-span-1">
          <HorizontalBarChart
            title="Distribuição por Bairro"
            subtitle="propriedades por região"
            data={neighborhoodData}
            variant="slate"
            valueFormatter={(value) => `${value} imóveis`}
          />
        </div>
        
        {/* LINHA 4 - Rankings e Atividades (3 colunas) */}
        <div className="md:col-span-1">
          <HorizontalBarChart
            title="Top Propriedades"
            subtitle="por rentabilidade"
            data={[
              { name: 'Apt Centro', value: 2500 },
              { name: 'Casa Jardins', value: 2200 },
              { name: 'Sala Comercial', value: 1800 },
              { name: 'Apt Novo', value: 1500 },
              { name: 'Studio', value: 1200 }
            ]}
            variant="slate"
            valueFormatter={(value) => formatCurrency(value)}
          />
        </div>
        
        <div className="md:col-span-1">
          <HorizontalBarChart
            title="Bairros Rentáveis"
            subtitle="ROI médio por região"
            data={[
              { name: 'Centro', value: 8.5 },
              { name: 'Jardins', value: 7.2 },
              { name: 'Vila Olímpia', value: 6.8 },
              { name: 'Brooklin', value: 6.1 },
              { name: 'Moema', value: 5.9 }
            ]}
            variant="gray"
            valueFormatter={(value) => `${value}%`}
          />
        </div>
        
        <div className="md:col-span-1">
          <CompactActivitiesWidget />
        </div>
        
      </div>
    </div>
  );
}
