
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/components/theme-provider";

// Local formatting function
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

interface PropertyRoiChartProps {
  data: Array<{
    type: string;
    roi: number;
  }>;
  isLoading?: boolean;
}

export const PropertyRoiChart: React.FC<PropertyRoiChartProps> = ({ data, isLoading }) => {
  const { theme } = useTheme();
  
  // Define tertiary color based on theme
  const tertiaryColor = theme === 'dark' ? '#4C1D95' : '#7C3AED';
  
  // Custom bar label component
  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width + 5}
        y={y + 15}
        fill={theme === 'dark' ? '#E2E8F0' : '#334155'}
        fontSize={12}
        textAnchor="start"
      >
        {formatPercentage(value)}
      </text>
    );
  };
  
  return (
    <Card className="backdrop-blur-sm border-opacity-40 h-full">
      <CardHeader>
        <CardTitle className="text-xl">ROI por Tipo de Imóvel</CardTitle>
        <CardDescription>Rentabilidade média mensal (%)</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
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
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 45, left: 5, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={true} 
                vertical={false} 
                stroke={theme === "dark" ? "#333" : "#eee"} 
                opacity={0.5} 
              />
              <XAxis 
                type="number" 
                domain={[0, 'dataMax']} 
                tick={{ fontSize: 12 }}
                stroke={theme === "dark" ? "#888" : "#666"}
                tickFormatter={formatPercentage}
              />
              <YAxis 
                dataKey="type" 
                type="category" 
                tick={{ fontSize: 12 }}
                stroke={theme === "dark" ? "#888" : "#666"}
                width={80}
              />
              <Tooltip 
                formatter={(value: any) => [`${formatPercentage(value)}`, 'ROI Mensal']}
                cursor={{ fill: theme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              />
              <Bar 
                dataKey="roi" 
                fill={tertiaryColor}
                radius={[0, 4, 4, 0]}
                label={<CustomBarLabel />}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
