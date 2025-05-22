
import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyValuation } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyValuationChartProps {
  valuations: PropertyValuation[];
  purchaseDate?: string | null;
  purchaseValue?: number | null;
  isLoading?: boolean;
}

export const PropertyValuationChart: React.FC<PropertyValuationChartProps> = ({
  valuations,
  purchaseDate,
  purchaseValue,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    if (!valuations.length && !purchaseDate) return [];

    const data: Array<{
      date: string;
      fullLabel?: string;
      value: number;
      purchase?: number;
    }> = [];

    // Add purchase data point if available
    if (purchaseDate && purchaseValue) {
      data.push({
        date: format(parseISO(purchaseDate), 'MMM/yy', { locale: ptBR }),
        fullLabel: format(parseISO(purchaseDate), 'dd/MM/yyyy', { locale: ptBR }),
        value: purchaseValue,
        purchase: purchaseValue,
      });
    }

    // Add valuation data points
    valuations.forEach(valuation => {
      data.push({
        date: format(parseISO(valuation.valuation_date), 'MMM/yy', { locale: ptBR }),
        fullLabel: format(parseISO(valuation.valuation_date), 'dd/MM/yyyy', { locale: ptBR }),
        value: valuation.value,
      });
    });

    // Sort by date
    return data.sort((a, b) => {
      const dateA = a.fullLabel ? new Date(a.fullLabel.split('/').reverse().join('-')) : new Date();
      const dateB = b.fullLabel ? new Date(b.fullLabel.split('/').reverse().join('-')) : new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }, [valuations, purchaseDate, purchaseValue]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-1/3" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valorização do Imóvel</CardTitle>
          <CardDescription>Histórico de valores do imóvel ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado de valorização disponível.
          <p className="text-sm mt-2">
            Adicione valores de avaliação para visualizar a evolução do seu imóvel.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate growth percentage
  const growthPercentage = chartData.length >= 2
    ? ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Valorização do Imóvel</span>
          <span className={`text-sm font-medium ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage).toFixed(2)}%
          </span>
        </CardTitle>
        <CardDescription>Histórico de valores do imóvel ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0
                })}`} 
              />
              <Tooltip
                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']}
                labelFormatter={(label, items) => {
                  const item = chartData.find(item => item.date === label);
                  return item?.fullLabel || label;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
              {purchaseValue && (
                <Area
                  type="monotone"
                  dataKey="purchase"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorPurchase)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
