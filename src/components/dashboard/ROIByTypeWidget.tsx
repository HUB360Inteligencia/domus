
import React from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { MetricWidget } from '@/components/finances/dashboard/MetricWidget';
import { Percent, Building } from 'lucide-react';

export function ROIByTypeWidget() {
  const roiData = [
    { type: 'Apartamentos', roi: 8.5, count: 3 },
    { type: 'Casas', roi: 7.2, count: 2 },
    { type: 'Comerciais', roi: 9.8, count: 1 }
  ];

  return (
    <MinimalCard cols={3}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">ROI por Tipo</h3>
          <Building className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {roiData.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className="text-sm font-medium text-gray-900">{item.type}</span>
                <span className="text-xs text-gray-500 ml-2">({item.count} imóveis)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Percent className="h-3 w-3 text-gray-400" />
                <span className="text-lg font-bold text-gray-900">{item.roi}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MinimalCard>
  );
}
