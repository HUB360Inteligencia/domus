
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { MapPin, Building, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { usePropertyRankings } from '@/hooks/use-property-rankings';

export function TopNeighborhoodsWidget() {
  const [rankingType, setRankingType] = useState<'revenue' | 'count'>('revenue');
  const { neighborhoodRankings, isLoading } = usePropertyRankings();

  const rankingOptions = [
    { value: 'revenue', label: 'Receita' },
    { value: 'count', label: 'Quantidade' }
  ];

  const sortedNeighborhoods = [...neighborhoodRankings]
    .sort((a, b) => rankingType === 'revenue' ? b.revenue - a.revenue : b.count - a.count)
    .slice(0, 5);

  if (isLoading) {
    return (
      <MinimalCard cols={3}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Bairros</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </MinimalCard>
    );
  }

  if (sortedNeighborhoods.length === 0) {
    return (
      <MinimalCard cols={3}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Bairros</h3>
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum bairro encontrado</p>
          </div>
        </div>
      </MinimalCard>
    );
  }

  return (
    <MinimalCard cols={3}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top Bairros</h3>
          <SimpleToggle 
            value={rankingType}
            onValueChange={(value) => setRankingType(value as 'revenue' | 'count')}
            options={rankingOptions}
          />
        </div>
        
        <div className="space-y-3">
          {sortedNeighborhoods.map((neighborhood, index) => (
            <div key={neighborhood.name} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{neighborhood.name}</span>
                    <div className="text-xs text-gray-500">
                      ROI: {neighborhood.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {rankingType === 'revenue' ? (
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(neighborhood.revenue)}</div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-bold text-gray-900">{neighborhood.count}</span>
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
