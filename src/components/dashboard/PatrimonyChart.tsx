
import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { MinimalChart } from './MinimalChart';
import { formatCurrency } from '@/utils/currency';

interface PatrimonyChartProps {
  data: Array<{
    month: string;
    marketValue: number;
    acquisitionValue: number;
  }>;
  viewMode: 'patrimony' | 'cashflow';
  isLoading?: boolean;
}

export function PatrimonyChart({ data, viewMode, isLoading }: PatrimonyChartProps) {
  const chartConfig = {
    marketValue: {
      label: "Valor de Mercado",
      color: "#0A5B6C",
    },
    acquisitionValue: {
      label: "Valor de Aquisição", 
      color: "#888888",
    },
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-gray-500">Nenhum dado disponível</div>
      </div>
    );
  }

  return (
    <MinimalChart config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
            tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$').slice(0, -3) + 'k'}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              chartConfig[name as keyof typeof chartConfig]?.label || name
            ]}
            labelStyle={{ color: '#000', fontWeight: 'bold' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          {viewMode === 'patrimony' ? (
            <>
              <Line
                type="monotone"
                dataKey="marketValue"
                stroke={chartConfig.marketValue.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="acquisitionValue"
                stroke={chartConfig.acquisitionValue.color}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="marketValue"
              stroke={chartConfig.marketValue.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </MinimalChart>
  );
}
