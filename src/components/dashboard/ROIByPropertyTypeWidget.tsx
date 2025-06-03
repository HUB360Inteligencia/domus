
import React from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { Building, TrendingUp } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';

export function ROIByPropertyTypeWidget() {
  const metrics = useDashboardMetrics();

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI por Tipo</h3>
        
        <div className="flex-1 space-y-4">
          {Object.entries(metrics.roiByPropertyType).map(([type, data]) => (
            <div key={type} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-sm">{type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-3 w-3 ${data.lastMonth > data.average12Months ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-xs ${data.lastMonth > data.average12Months ? 'text-green-600' : 'text-red-600'}`}>
                    {data.lastMonth > data.average12Months ? '+' : ''}{(data.lastMonth - data.average12Months).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Último mês:</span>
                  <div className="font-semibold">{data.lastMonth.toFixed(2)}%</div>
                </div>
                <div>
                  <span className="text-gray-500">Média 12m:</span>
                  <div className="font-semibold">{data.average12Months.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          ))}
          
          {Object.keys(metrics.roiByPropertyType).length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum imóvel cadastrado</p>
            </div>
          )}
        </div>
      </div>
    </MinimalCard>
  );
}
