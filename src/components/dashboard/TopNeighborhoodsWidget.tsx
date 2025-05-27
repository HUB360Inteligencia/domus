
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { useFinancialDashboard } from '@/hooks/use-financial-dashboard';
import { formatCurrency } from '@/utils/currency';
import { MapPin, Home } from 'lucide-react';

export function TopNeighborhoodsWidget() {
  const [viewMode, setViewMode] = useState<'revenue' | 'count'>('revenue');
  const { neighborhoodData, isLoading } = useFinancialDashboard();

  const viewOptions = [
    { value: 'revenue', label: 'Receita' },
    { value: 'count', label: 'Quantidade' }
  ];

  // Ordenar dados baseado no modo de visualização (do maior para o menor)
  const sortedData = React.useMemo(() => {
    if (!neighborhoodData) return [];
    
    return [...neighborhoodData].sort((a, b) => {
      if (viewMode === 'revenue') {
        return b.revenue - a.revenue; // Maior receita primeiro
      }
      return b.count - a.count; // Maior quantidade primeiro
    });
  }, [neighborhoodData, viewMode]);

  if (isLoading) {
    return (
      <MinimalCard className="h-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Bairros</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </MinimalCard>
    );
  }

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Bairros</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'revenue' | 'count')}
            options={viewOptions}
            className="h-7"
          />
        </div>

        <div className="flex-1 min-h-0">
          {sortedData.length > 0 ? (
            <div className="space-y-3">
              {sortedData.slice(0, 5).map((neighborhood, index) => (
                <div key={neighborhood.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{neighborhood.name}</div>
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <Home className="h-3 w-3" />
                        <span>{neighborhood.count} propriedades</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">
                      {viewMode === 'revenue' 
                        ? formatCurrency(neighborhood.revenue) 
                        : `${neighborhood.count}`
                      }
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{viewMode === 'revenue' ? 'receita' : 'imóveis'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-sm">Nenhum bairro encontrado</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MinimalCard>
  );
}
