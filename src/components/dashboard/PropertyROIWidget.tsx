
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFinancialDashboard } from '@/hooks/use-financial-dashboard';

export function PropertyROIWidget() {
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const { roiByPropertyType, isLoading } = useFinancialDashboard();

  const viewOptions = [
    { value: 'list', label: 'Lista' },
    { value: 'chart', label: 'Gráfico' }
  ];

  // Mapear tipos de propriedades para português
  const propertyTypeLabels: Record<string, string> = {
    apartment: 'Apartamentos',
    house: 'Casas',
    commercial: 'Comerciais',
    land: 'Terrenos',
    rural: 'Rurais'
  };

  // Calcular dados de ROI
  const roiData = React.useMemo(() => {
    if (!roiByPropertyType) return [];
    
    return Object.entries(roiByPropertyType).map(([type, roi]) => ({
      type: propertyTypeLabels[type] || type,
      roi: Number(roi) || 0
    })).sort((a, b) => b.roi - a.roi);
  }, [roiByPropertyType]);

  if (isLoading) {
    return (
      <MinimalCard className="h-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">ROI por Tipo</h3>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">ROI por Tipo</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'list' | 'chart')}
            options={viewOptions}
          />
        </div>

        <div className="flex-1 min-h-0">
          {roiData.length > 0 ? (
            viewMode === 'list' ? (
              <div className="space-y-2">
                {roiData.map((item, index) => (
                  <div key={item.type} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{item.type}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.roi.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="type" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                    labelStyle={{ color: '#000', fontWeight: 'bold' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="roi" 
                    fill="#0A5B6C"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-sm">Nenhum dado de ROI disponível</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MinimalCard>
  );
}
