
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PropertyRoiChart } from '@/components/finances/PropertyRoiChart';
import { useFinancialDashboard } from '@/hooks/use-financial-dashboard';

export function ROITypesWidget() {
  const { roiByPropertyType, isLoading } = useFinancialDashboard();

  // Convert roiByPropertyType to array for charts
  const roiData = Object.entries(roiByPropertyType || {}).map(([type, roi]) => ({
    type,
    roi: Number(roi) || 0
  }));

  // Data for pie chart (monochromatic)
  const pieData = roiData.map((item, index) => ({
    name: item.type,
    value: item.roi,
    color: `hsl(0, 0%, ${20 + (index * 15)}%)`
  }));

  return (
    <MinimalCard cols={3}>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">ROI por Tipo de Imóvel</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Distribuição</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* ROI List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Rentabilidade</h4>
            <div className="space-y-2">
              {roiData.map((item, index) => (
                <div key={item.type} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pieData[index]?.color }}
                    />
                    <span className="text-sm text-gray-700">{item.type}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.roi.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MinimalCard>
  );
}
