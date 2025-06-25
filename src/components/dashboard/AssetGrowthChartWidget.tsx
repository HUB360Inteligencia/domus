
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { PatrimonyChart } from '@/components/dashboard/PatrimonyChart';
import { usePortfolioTimeline } from '@/hooks/use-portfolio-timeline';

export function AssetGrowthChartWidget() {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const { timelineData, isLoading } = usePortfolioTimeline();

  const viewOptions = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' }
  ];

  // Transformar dados da timeline para o formato do gráfico
  const chartData = React.useMemo(() => {
    if (!timelineData || timelineData.length === 0) return [];

    if (viewMode === 'monthly') {
      // Últimos 6 meses
      return timelineData.slice(-6).map(item => {
        const date = new Date(item.date + '-01');
        return {
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          marketValue: item.totalValue,
          acquisitionValue: item.totalValue * 0.85 // Estimativa conservadora do valor de aquisição
        };
      });
    } else {
      // Agrupar por anos
      const yearlyData = timelineData.reduce((acc, item) => {
        const year = item.date.slice(0, 4);
        if (!acc[year]) {
          acc[year] = { totalValue: 0, count: 0 };
        }
        acc[year].totalValue = Math.max(acc[year].totalValue, item.totalValue);
        acc[year].count++;
        return acc;
      }, {} as Record<string, { totalValue: number; count: number }>);

      return Object.entries(yearlyData).slice(-3).map(([year, data]) => ({
        month: year,
        marketValue: data.totalValue,
        acquisitionValue: data.totalValue * 0.85
      }));
    }
  }, [timelineData, viewMode]);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow bg-white border-gray-200 h-60">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">Valorização Patrimonial</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'monthly' | 'yearly')}
            options={viewOptions}
            className="text-xs h-6"
          />
        </div>
        
        <div className="flex-1 min-h-0">
          <PatrimonyChart 
            data={chartData}
            viewMode={'patrimony'}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
