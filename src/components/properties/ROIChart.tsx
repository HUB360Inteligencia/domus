
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Property } from '@/types/property';
import { PropertyInvestment } from '@/types/property-investment';

interface ROIChartProps {
  property: Property | null | undefined;
  investments: PropertyInvestment[];
  isLoading: boolean;
}

interface ChartData {
  date: string;
  investment: number;
  value: number;
}

export const ROIChart: React.FC<ROIChartProps> = ({ property, investments, isLoading }) => {
  const chartData = useMemo(() => {
    if (!property) return [];
    
    const data: ChartData[] = [];
    
    // Start with purchase if available
    if (property.purchase_date && property.purchase_value) {
      data.push({
        date: property.purchase_date,
        investment: property.purchase_value,
        value: property.purchase_value, // Initially, value equals purchase price
      });
    }

    // Add all investments in chronological order
    let runningInvestmentTotal = property.purchase_value || 0;
    
    // Sort investments by date
    const sortedInvestments = [...investments]
      .filter(inv => inv.investment_type !== 'purchase') // Exclude purchase to avoid double counting
      .sort((a, b) => new Date(a.investment_date).getTime() - new Date(b.investment_date).getTime());
    
    sortedInvestments.forEach(inv => {
      runningInvestmentTotal += inv.amount;
      data.push({
        date: inv.investment_date,
        investment: runningInvestmentTotal,
        value: runningInvestmentTotal, // Default value same as investment
      });
    });
    
    // Add property valuations
    if (property.value && data.length > 0) {
      // Use last valuation date or today
      const valuationDate = property.last_valuation_date || format(new Date(), 'yyyy-MM-dd');
      
      // Add current valuation if it's after the last investment
      const lastEntryDate = data[data.length - 1].date;
      if (new Date(valuationDate) >= new Date(lastEntryDate)) {
        data.push({
          date: valuationDate,
          investment: runningInvestmentTotal,
          value: property.value,
        });
      } else {
        // Update the value of existing entries after valuation date
        for (let i = 0; i < data.length; i++) {
          if (new Date(data[i].date) >= new Date(valuationDate)) {
            data[i].value = property.value;
          }
        }
      }
    }
    
    return data;
  }, [property, investments]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{format(parseISO(label), 'dd/MM/yyyy', { locale: ptBR })}</p>
          <p className="text-sm text-green-600">
            Valor: {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(payload[0].value as number)}
          </p>
          <p className="text-sm text-blue-600">
            Investido: {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(payload[1].value as number)}
          </p>
        </div>
      );
    }
  
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Retorno sobre Investimento</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Retorno sobre Investimento</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(parseISO(date), 'MM/yy', { locale: ptBR })}
                stroke="#888888"
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                stroke="#888888"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Valor"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="investment"
                name="Investimento"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorInvestment)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Dados insuficientes para exibir o gráfico. Adicione pelo menos um investimento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
