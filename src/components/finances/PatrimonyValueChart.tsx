
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, ResponsiveContainer } from "recharts";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/hooks/use-financial-dashboard';

interface PatrimonyValueChartProps {
  data: Array<{
    month: string;
    fullLabel?: string;
    year?: number;
    value: number;
    acquisition: number;
  }>;
  viewMode: 'monthly' | 'yearly';
  onViewModeChange: (mode: 'monthly' | 'yearly') => void;
  isLoading?: boolean;
}

export const PatrimonyValueChart: React.FC<PatrimonyValueChartProps> = ({ 
  data, 
  viewMode,
  onViewModeChange,
  isLoading 
}) => {
  const { theme } = useTheme();
  
  // Define colors with base on theme
  const primaryColor = theme === 'dark' ? '#3ABAB4' : '#0A5B6C';
  const secondaryColor = theme === 'dark' ? '#2D3748' : '#94A3B8';
  
  // Custom tooltip to format values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-lg text-xs">
          <p className="font-medium">{payload[0]?.payload.fullLabel || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name === 'value' ? 'Valor Atual: ' : 'Valor de Aquisição: '}
              {formatCurrency(entry.value)}
            </p>
          ))}
          {payload.length >= 2 && (
            <p className="text-emerald-500 font-medium mt-1">
              Valorização: {formatCurrency(payload[0].value - payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="backdrop-blur-sm border-opacity-40 h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Valorização Patrimonial</CardTitle>
            <CardDescription>
              {viewMode === 'monthly' ? 'Visualização mensal' : 'Visualização anual'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'monthly' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onViewModeChange('monthly')}
            >
              Mês a Mês
            </Button>
            <Button 
              variant={viewMode === 'yearly' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onViewModeChange('yearly')}
            >
              Ano a Ano
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-muted-foreground">Sem dados para exibir</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#eee"} opacity={0.5} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }} 
                stroke={theme === "dark" ? "#888" : "#666"} 
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                tick={{ fontSize: 12 }}
                stroke={theme === "dark" ? "#888" : "#666"}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="acquisition"
                name="Aquisição"
                stroke={secondaryColor}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Atual"
                stroke={primaryColor}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1, stroke: primaryColor, fill: "white" }}
                activeDot={{ r: 6, strokeWidth: 0, fill: primaryColor }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={primaryColor}
                fillOpacity={0.1}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
