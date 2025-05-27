
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Home, DollarSign, TrendingUp, Percent, Building, Target, BarChart3, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { formatCurrency } from '@/utils/currency';

export default function Dashboard() {
  const metrics = useDashboardMetrics();

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="container py-6">
      <PageHeader 
        title="Dashboard" 
        description="Visão geral do seu portfólio imobiliário"
      >
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Propriedade
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/finances/transactions">
              <DollarSign className="mr-2 h-4 w-4" />
              Nova Transação
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-8">
        {/* Seção 1: Portfólio de Imóveis */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Portfólio de Imóveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total de Propriedades"
              value={metrics.totalProperties.toString()}
              subtitle="propriedades no portfólio"
              icon={<Building />}
              colorScheme="blue"
            />
            <MetricCard
              title="Propriedades Locadas"
              value={metrics.rentedProperties.toString()}
              subtitle={`de ${metrics.totalProperties} propriedades`}
              icon={<Home />}
              colorScheme="green"
            />
            <MetricCard
              title="Taxa de Ocupação"
              value={formatPercentage(metrics.occupancyRate)}
              subtitle="imóveis ocupados"
              icon={<Percent />}
              colorScheme="purple"
            />
          </div>
        </div>

        {/* Seção 2: Patrimônio */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Patrimônio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Valor de Compra Total"
              value={formatCurrency(metrics.totalPurchaseValue)}
              subtitle="investimento total realizado"
              icon={<DollarSign />}
              colorScheme="orange"
            />
            <MetricCard
              title="Valor de Mercado Atual"
              value={formatCurrency(metrics.totalMarketValue)}
              subtitle="valor patrimonial atual"
              icon={<TrendingUp />}
              colorScheme="blue"
              size="large"
            />
            <MetricCard
              title="Crescimento Patrimonial"
              value={formatPercentage(metrics.assetGrowthPercentage)}
              subtitle="valorização do portfólio"
              icon={<BarChart3 />}
              colorScheme={metrics.assetGrowthPercentage >= 0 ? 'green' : 'red'}
              trend={metrics.assetGrowthPercentage >= 0 ? 'up' : 'down'}
              trendValue={`${formatCurrency(metrics.totalMarketValue - metrics.totalPurchaseValue)}`}
            />
          </div>
        </div>

        {/* Seção 3: Performance Financeira Mensal */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Performance Financeira (Mês Atual)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Receita Mensal"
              value={formatCurrency(metrics.monthlyRevenue)}
              subtitle="receitas do mês"
              icon={<DollarSign />}
              colorScheme="green"
              trend={metrics.revenueTrend}
              trendValue={`${metrics.revenueTrend === 'up' ? '+' : metrics.revenueTrend === 'down' ? '-' : ''}${formatPercentage(Math.abs(10))}`}
            />
            <MetricCard
              title="Despesas Mensais"
              value={formatCurrency(metrics.monthlyExpenses)}
              subtitle="despesas do mês"
              icon={<DollarSign />}
              colorScheme="red"
              trend={metrics.expensesTrend === 'up' ? 'down' : metrics.expensesTrend === 'down' ? 'up' : 'neutral'}
              trendValue={`${metrics.expensesTrend === 'up' ? '+' : metrics.expensesTrend === 'down' ? '-' : ''}${formatPercentage(Math.abs(5))}`}
            />
            <MetricCard
              title="Lucro Líquido"
              value={formatCurrency(metrics.monthlyProfit)}
              subtitle="receitas - despesas"
              icon={<Target />}
              colorScheme={metrics.monthlyProfit >= 0 ? 'green' : 'red'}
              trend={metrics.profitTrend}
              trendValue={`${metrics.profitTrend === 'up' ? '+' : metrics.profitTrend === 'down' ? '-' : ''}${formatPercentage(Math.abs(15))}`}
              size="large"
            />
          </div>
        </div>

        {/* Seção 4: Rentabilidade */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Rentabilidade Anual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="ROI sobre Valor Investido"
              value={formatPercentage(metrics.roiOnInvestment)}
              subtitle="retorno sobre investimento realizado"
              icon={<TrendingUp />}
              colorScheme="purple"
              size="large"
            />
            <MetricCard
              title="Yield sobre Valor de Mercado"
              value={formatPercentage(metrics.currentYield)}
              subtitle="retorno sobre valor atual de mercado"
              icon={<Percent />}
              colorScheme="blue"
              size="large"
            />
          </div>
        </div>

        {/* Seção 5: Ações Rápidas */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link to="/properties">
                <Home className="h-6 w-6" />
                Gerenciar Propriedades
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link to="/finances/dashboard">
                <BarChart3 className="h-6 w-6" />
                Painel Financeiro
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link to="/contracts">
                <Calendar className="h-6 w-6" />
                Contratos de Locação
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
