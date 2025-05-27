
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { PropertyTypeChart } from '@/components/dashboard/PropertyTypeChart';
import { useProperties } from '@/hooks/use-properties';

export function PropertyTypesChartWidget() {
  const { properties, isLoading } = useProperties();

  return (
    <MinimalCard cols={2}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Tipos de Imóveis</h3>
        <div className="h-64">
          <PropertyTypeChart properties={properties} isLoading={isLoading} />
        </div>
      </div>
    </MinimalCard>
  );
}
