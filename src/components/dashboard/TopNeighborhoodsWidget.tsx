
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { MapPin, Building } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

export function TopNeighborhoodsWidget() {
  const [rankingType, setRankingType] = useState('revenue');

  const rankingOptions = [
    { value: 'revenue', label: 'Receita' },
    { value: 'count', label: 'Quantidade' }
  ];

  const topNeighborhoods = [
    { id: 1, name: 'Centro', revenue: 7200, count: 3 },
    { id: 2, name: 'Jardins', revenue: 5600, count: 2 },
    { id: 3, name: 'Vila Nova', revenue: 4200, count: 1 },
    { id: 4, name: 'Zona Sul', revenue: 2200, count: 1 },
    { id: 5, name: 'Subúrbio', revenue: 1800, count: 1 }
  ];

  return (
    <MinimalCard cols={3}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top Bairros</h3>
          <SimpleToggle 
            value={rankingType}
            onValueChange={setRankingType}
            options={rankingOptions}
          />
        </div>
        
        <div className="space-y-3">
          {topNeighborhoods.map((neighborhood, index) => (
            <div key={neighborhood.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{neighborhood.name}</span>
                </div>
              </div>
              <div className="text-right">
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
