
import { useMemo } from 'react';
import { InfoIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FinancialAnalytics as FinancialAnalyticsType } from '@/types/financial';
import { Property } from '@/types/property';
import { FinancialStatsCards } from './financial-stats-cards';
import { MonthlyChart } from './charts/monthly-chart';
import { PropertyValueChart } from './charts/property-value-chart';
import { CategoryPieChart } from './charts/category-pie-chart';
import { RoiTable } from './roi-table';

interface FinancialAnalyticsProps {
  analytics: FinancialAnalyticsType;
  properties: Property[];
}

export const FinancialAnalytics = ({ analytics, properties }: FinancialAnalyticsProps) => {
  // Log para ajudar a depurar
  console.log('FinancialAnalytics render:', {
    analytics,
    propertiesCount: properties.length,
    incomeCategories: Object.keys(analytics?.incomeByCategory || {}).length,
    expenseCategories: Object.keys(analytics?.expensesByCategory || {}).length,
    monthlyDataPoints: analytics?.monthlyData?.length || 0
  });
  
  // Dados para o gráfico de categorias de despesa
  const expensesChartData = useMemo(() => {
    if (!analytics?.expensesByCategory) return [];
    return Object.entries(analytics.expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: Number(amount)
    }));
  }, [analytics?.expensesByCategory]);

  // Dados para o gráfico de categorias de receita
  const incomeChartData = useMemo(() => {
    if (!analytics?.incomeByCategory) return [];
    return Object.entries(analytics.incomeByCategory).map(([category, amount]) => ({
      name: category,
      value: Number(amount)
    }));
  }, [analytics?.incomeByCategory]);

  // Se não houver analytics ou properties válidos, exibir mensagem de erro
  if (!analytics || !properties || !properties.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <InfoIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Dados financeiros indisponíveis</h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados financeiros ou não existem imóveis cadastrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <FinancialStatsCards analytics={analytics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart monthlyData={analytics.monthlyData || []} />
        <PropertyValueChart 
          properties={properties} 
          totalValue={analytics.propertyValues?.totalValue || 0} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart 
          title="Despesas por Categoria" 
          data={expensesChartData}
          emptyMessage="Nenhuma despesa registrada" 
        />
        <CategoryPieChart 
          title="Receitas por Categoria" 
          data={incomeChartData}
          emptyMessage="Nenhuma receita registrada" 
        />
      </div>

      <RoiTable 
        propertyROIs={analytics.propertiesROI || []}
        propertyValues={analytics.propertyValues?.byProperty || {}}
      />
    </div>
  );
};
