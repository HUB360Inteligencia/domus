
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface CompactDonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title: string;
  isLoading?: boolean;
  variant?: 'white' | 'gray' | 'slate';
}

export function CompactDonutChart({ 
  data, 
  title, 
  isLoading, 
  variant = 'gray' 
}: CompactDonutChartProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gray':
        return 'bg-gray-50 border-gray-100';
      case 'slate':
        return 'bg-slate-50 border-slate-100';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const colors = ['#0A5B6C', '#2D7A8A', '#4A9AA8', '#6BBAC6', '#8CCAE4'];

  if (isLoading) {
    return (
      <Card className={`shadow-sm h-48 ${getVariantClasses()}`}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 truncate">{title}</h3>
          <div className="animate-pulse bg-gray-200 h-32 rounded-full mx-auto w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow h-48 ${getVariantClasses()}`}>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">{title}</h3>
        
        <div className="flex items-center justify-between">
          <div className="w-24 h-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || colors[index % colors.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}`, 'Quantidade']}
                  contentStyle={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 ml-3 space-y-1 overflow-hidden">
            {data.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color || colors[index % colors.length] }}
                  />
                  <span className="text-gray-700 truncate max-w-[60px]" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <span className="text-gray-900 font-medium ml-2">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
