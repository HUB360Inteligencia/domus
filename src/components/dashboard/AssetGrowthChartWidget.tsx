
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { PatrimonyChart } from '@/components/dashboard/PatrimonyChart';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { useProperties } from '@/hooks/use-properties';

export function AssetGrowthChartWidget() {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const metrics = useDashboardMetrics();
  const { properties } = useProperties();

  const viewOptions = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' }
  ];

  // Gerar dados baseados nas datas reais de compra dos imóveis
  const chartData = React.useMemo(() => {
    if (!properties || properties.length === 0) return [];

    const now = new Date();
    const data = [];

    if (viewMode === 'monthly') {
      // Últimos 6 meses para layout compacto
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        
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
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          marketValue: totalMarketValue,
          acquisitionValue: totalPurchaseValue
        });
      }
    } else {
      // Últimos 3 anos para layout compacto
      for (let i = 2; i >= 0; i--) {
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
    <Card className="shadow-sm hover:shadow-md transition-shadow bg-white border-gray-200 h-48">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Valorização Patrimonial</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'monthly' | 'yearly')}
            options={viewOptions}
            className="text-xs h-6"
          />
        </div>
        
        <div className="h-32">
          <PatrimonyChart 
            data={chartData}
            viewMode={'patrimony'}
            isLoading={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
