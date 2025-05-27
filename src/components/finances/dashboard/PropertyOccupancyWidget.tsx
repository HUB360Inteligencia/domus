
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { MetricWidget } from './MetricWidget';
import { Progress } from '@/components/ui/progress';
import { Home } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';

export function PropertyOccupancyWidget() {
  const metrics = useDashboardMetrics();

  return (
    <MinimalCard cols={2}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Propriedades</h3>
          <Home className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <MetricWidget
            title="Total"
            value={metrics.totalProperties}
            subtitle="propriedades"
          />
          <MetricWidget
            title="Locadas"
            value={metrics.rentedProperties}
            subtitle={`de ${metrics.totalProperties}`}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxa de Ocupação</span>
            <span className="text-lg font-bold text-gray-900">
              {metrics.occupancyRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={metrics.occupancyRate} className="h-2" />
        </div>
      </div>
    </MinimalCard>
  );
}
