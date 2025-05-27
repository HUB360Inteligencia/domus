
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialDashboard } from '@/hooks/use-financial-dashboard';

export function PropertyTypesROIWidget() {
  const [viewMode, setViewMode] = useState<'types' | 'roi'>('types');
  const [roiViewMode, setRoiViewMode] = useState<'list' | 'chart'>('list');
  const { properties, isLoading } = useProperties();
  const { roiByPropertyType, isLoading: isLoadingROI } = useFinancialDashboard();

  const viewOptions = [
    { value: 'types', label: 'Tipos' },
    { value: 'roi', label: 'ROI' }
  ];

  const roiViewOptions = [
    { value: 'list', label: 'Lista' },
    { value: 'chart', label: 'Gráfico' }
  ];

  // Calcular dados dos tipos de propriedades
  const propertyTypesData = React.useMemo(() => {
    if (!properties) return [];
    
    const typeCounts = properties.reduce((acc, property) => {
      const type = property.type || 'Outros';
      acc[type] = (acc[type] || 0) + 1;
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

  // Calcular dados de ROI
  const roiData = React.useMemo(() => {
    if (!roiByPropertyType) return [];
    
    return Object.entries(roiByPropertyType).map(([type, roi]) => ({
      type,
      roi: Number(roi) || 0
    })).sort((a, b) => b.roi - a.roi);
  }, [roiByPropertyType]);

  if (isLoading || isLoadingROI) {
    return (
      <MinimalCard cols={3}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Tipos & ROI</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-sm text-gray-500">Carregando...</div>
          </div>
        </div>
      </MinimalCard>
    );
  }

  return (
    <MinimalCard cols={3}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Tipos & ROI</h3>
          <SimpleToggle 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'types' | 'roi')}
            options={viewOptions}
          />
        </div>

        {viewMode === 'types' ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Gráfico Pizza */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Distribuição</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propertyTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
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
            </div>
            
            {/* Lista de Tipos */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Detalhes</h4>
              <div className="space-y-2">
                {propertyTypesData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      <div className="text-xs text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <SimpleToggle 
                value={roiViewMode}
                onValueChange={(value) => setRoiViewMode(value as 'list' | 'chart')}
                options={roiViewOptions}
              />
            </div>

            {roiViewMode === 'list' ? (
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
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis 
                      dataKey="type" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
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
              </div>
            )}
          </div>
        )}
      </div>
    </MinimalCard>
  );
}
