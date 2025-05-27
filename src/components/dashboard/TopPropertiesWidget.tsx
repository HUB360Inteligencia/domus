
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { Home, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

export function TopPropertiesWidget() {
  const [rankingType, setRankingType] = useState('revenue');

  const rankingOptions = [
    { value: 'revenue', label: 'Receita' },
    { value: 'roi', label: 'ROI' }
  ];

  const topProperties = [
    { id: 1, name: 'Apto Centro', location: 'Centro', value: 3500, roi: 8.5 },
    { id: 2, name: 'Casa Jardins', location: 'Jardins', value: 2800, roi: 7.2 },
    { id: 3, name: 'Loja Vila Nova', location: 'Vila Nova', value: 4200, roi: 9.8 },
    { id: 4, name: 'Apto Zona Sul', location: 'Zona Sul', value: 2200, roi: 6.1 },
    { id: 5, name: 'Casa Subúrbio', location: 'Subúrbio', value: 1800, roi: 5.5 }
  ];

  return (
    <MinimalCard cols={3}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Propriedades</h3>
          <SimpleToggle 
            value={rankingType}
            onValueChange={setRankingType}
            options={rankingOptions}
          />
        </div>
        
        <div className="space-y-3">
          {topProperties.map((property, index) => (
            <div key={property.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{property.name}</div>
                  <div className="text-xs text-gray-500">{property.location}</div>
                </div>
              </div>
              <div className="text-right">
                {rankingType === 'revenue' ? (
                  <div className="text-sm font-bold text-gray-900">{formatCurrency(property.value)}</div>
                ) : (
                  <div className="text-sm font-bold text-gray-900">{property.roi}%</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MinimalCard>
  );
}
