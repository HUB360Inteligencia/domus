
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { Home, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { usePropertyRankings } from '@/hooks/use-property-rankings';

export function TopPropertiesWidget() {
  const [rankingType, setRankingType] = useState<'revenue' | 'roi'>('revenue');
  const { propertyRankings, isLoading } = usePropertyRankings();

  const rankingOptions = [
    { value: 'revenue', label: 'Receita' },
    { value: 'roi', label: 'ROI' }
  ];

  const sortedProperties = [...propertyRankings]
    .sort((a, b) => rankingType === 'revenue' ? b.revenue - a.revenue : b.roi - a.roi)
    .slice(0, 5);

  if (isLoading) {
    return (
      <MinimalCard cols={3}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Propriedades</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </MinimalCard>
    );
  }

  if (sortedProperties.length === 0) {
    return (
      <MinimalCard cols={3}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Propriedades</h3>
          <div className="text-center py-8 text-gray-500">
            <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma propriedade encontrada</p>
          </div>
        </div>
      </MinimalCard>
    );
  }

  return (
    <MinimalCard cols={3}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Propriedades</h3>
          <SimpleToggle 
            value={rankingType}
            onValueChange={(value) => setRankingType(value as 'revenue' | 'roi')}
            options={rankingOptions}
          />
        </div>
        
        <div className="space-y-3">
          {sortedProperties.map((property, index) => (
            <div key={property.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{property.name}</div>
                  <div className="text-xs text-gray-500 flex items-center space-x-1">
                    <span>{property.type}</span>
                    <span>•</span>
                    <span className="truncate">{property.location}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {rankingType === 'revenue' ? (
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(property.revenue)}</div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-sm font-bold text-gray-900">{property.roi.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MinimalCard>
  );
}
