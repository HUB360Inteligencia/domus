
import React from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useProperties } from '@/hooks/use-properties';

export function PropertyTypesWidget() {
  const { properties, isLoading } = useProperties();

  // Mapear tipos de propriedades para português
  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartamentos',
    house: 'Casas',
    commercial: 'Comerciais',
    land: 'Terrenos',
    rural: 'Rurais'
  };

  // Calcular dados dos tipos de propriedades
  const propertyTypesData = React.useMemo(() => {
    if (!properties) return [];
    
    const typeCounts = properties.reduce((acc, property) => {
      const type = property.type || 'others';
      const label = propertyTypeLabels[type] || 'Outros';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#0A5B6C', '#0E7A8A', '#1299A8', '#16B8C6', '#1AD7E4'];
    
    return Object.entries(typeCounts).map(([type, count], index) => ({
      name: type,
      value: count,
      color: colors[index % colors.length],
      percentage: ((count / properties.length) * 100).toFixed(1)
    }));
  }, [properties]);

  if (isLoading) {
    return (
      <MinimalCard className="h-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Tipos de Imóveis</h3>
          <div className="h-48 flex items-center justify-center">
            <div className="text-sm text-gray-500">Carregando...</div>
          </div>
        </div>
      </MinimalCard>
    );
  }

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Imóveis</h3>
        
        <div className="flex-1 min-h-0">
          {propertyTypesData.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {propertyTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value} propriedades`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 space-y-2">
                {propertyTypesData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{item.value}</span>
                      <span className="text-xs text-gray-500 ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-sm">Nenhum imóvel cadastrado</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MinimalCard>
  );
}
