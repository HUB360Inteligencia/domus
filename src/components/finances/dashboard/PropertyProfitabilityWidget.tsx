
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { Building, TrendingUp, DollarSign } from 'lucide-react';
import { useProperties } from '@/hooks/use-properties';
import { usePropertyTransactions } from '@/hooks/use-property-transactions';
import { formatCurrency } from '@/utils/currency';

export function PropertyProfitabilityWidget() {
  const { properties } = useProperties();

  // Calcular rentabilidade por propriedade
  const propertyProfitability = React.useMemo(() => {
    return properties.map(property => {
      const monthlyRevenue = property.rental_value || 0;
      const investment = property.purchase_value || property.total_investment || property.value || 1;
      const monthlyROI = (monthlyRevenue / investment) * 100;
      
      return {
        id: property.id,
        title: property.title,
        type: property.type,
        monthlyRevenue,
        investment,
        monthlyROI,
        status: property.status
      };
    }).sort((a, b) => b.monthlyROI - a.monthlyROI);
  }, [properties]);

  const topPerformers = propertyProfitability.slice(0, 5);

  return (
    <MinimalCard cols={2}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top 5 Propriedades por ROI</h3>
          <Building className="h-5 w-5 text-gray-500" />
        </div>

        <div className="space-y-3">
          {topPerformers.map((property, index) => (
            <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{property.title}</p>
                  <p className="text-xs text-gray-500">{property.type}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-green-600">{property.monthlyROI.toFixed(2)}%</span>
                </div>
                <p className="text-xs text-gray-500">{formatCurrency(property.monthlyRevenue)}/mês</p>
              </div>
            </div>
          ))}
        </div>

        {topPerformers.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma propriedade cadastrada</p>
          </div>
        )}
      </div>
    </MinimalCard>
  );
}
