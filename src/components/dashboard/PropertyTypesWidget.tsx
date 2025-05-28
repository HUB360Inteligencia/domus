
import React from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { useProperties } from '@/hooks/use-properties';
import { Progress } from '@/components/ui/progress';

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
    if (!properties || properties.length === 0) return [];
    
    const typeCounts = properties.reduce((acc, property) => {
      const type = property.type || 'others';
      const label = propertyTypeLabels[type] || 'Outros';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#0A5B6C', '#0E7A8A', '#1299A8', '#16B8C6', '#1AD7E4'];
    
    return Object.entries(typeCounts)
      .map(([type, count], index) => ({
        name: type,
        value: count,
        color: colors[index % colors.length],
        percentage: ((count / properties.length) * 100)
      }))
      .sort((a, b) => b.value - a.value); // Ordenar por quantidade
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
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Tipo</h3>
        
        <div className="flex-1 space-y-4">
          {propertyTypesData.length > 0 ? (
            propertyTypesData.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900">{item.value}</span>
                    <span className="text-gray-500">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="ml-7">
                  <Progress 
                    value={item.percentage} 
                    className="h-2"
                    style={{
                      '--progress-foreground': item.color
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            ))
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
