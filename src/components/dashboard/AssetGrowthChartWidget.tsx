
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { PatrimonyChart } from '@/components/dashboard/PatrimonyChart';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useProperties } from '@/hooks/use-properties';

export function AssetGrowthChartWidget() {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const metrics = useDashboardMetrics();
  const { properties } = useProperties();

  const viewOptions = [
    { value: 'monthly', label: 'Mês a Mês' },
    { value: 'yearly', label: 'Ano a Ano' }
  ];

  // Gerar dados baseados nas datas reais de compra dos imóveis
  const chartData = React.useMemo(() => {
    if (!properties || properties.length === 0) return [];

    const now = new Date();
    const data = [];

    if (viewMode === 'monthly') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
        
        // Calcular valor acumulado até esta data
        const propertiesAtDate = properties.filter(p => {
          if (!p.purchase_date) return false;
          return new Date(p.purchase_date) <= date;
        });

        const totalPurchaseValue = propertiesAtDate.reduce((sum, p) => 
          sum + (p.purchase_value || p.total_investment || 0), 0
        );
        
        const totalMarketValue = propertiesAtDate.reduce((sum, p) => 
          sum + (p.value || 0), 0
        );

        data.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          marketValue: totalMarketValue,
          acquisitionValue: totalPurchaseValue
        });
      }
    } else {
      // Últimos 5 anos
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearEnd = new Date(year, 11, 31);
        
        const propertiesAtYear = properties.filter(p => {
          if (!p.purchase_date) return false;
          return new Date(p.purchase_date).getFullYear() <= year;
        });

        const totalPurchaseValue = propertiesAtYear.reduce((sum, p) => 
          sum + (p.purchase_value || p.total_investment || 0), 0
        );
        
        const totalMarketValue = propertiesAtYear.reduce((sum, p) => 
          sum + (p.value || 0), 0
        );

        data.push({
          month: year.toString(),
          marketValue: totalMarketValue,
          acquisitionValue: totalPurchaseValue
        });
      }
    }

    return data.filter(item => item.acquisitionValue > 0 || item.marketValue > 0);
  }, [properties, viewMode]);

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Valorização Patrimonial</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'monthly' | 'yearly')}
            options={viewOptions}
          />
        </div>
        
        <div className="flex-1 min-h-0">
          <PatrimonyChart 
            data={chartData}
            viewMode={'patrimony'}
            isLoading={false}
          />
        </div>
      </div>
    </MinimalCard>
  );
}
