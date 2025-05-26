
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Target } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useRealRentalData } from '@/hooks/use-real-rental-data';

// Paleta de cores em escala de cinza
const COLORS = ['#000000', '#404040', '#808080', '#A0A0A0', '#C0C0C0'];

export function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -180),
    to: new Date(),
  });
  const [analysisType, setAnalysisType] = useState<'trend' | 'comparison' | 'projection'>('trend');
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'occupancy' | 'activeContracts'>('revenue');

  const { 
    analyticsData, 
    kpiData, 
    isLoading 
  } = useRealRentalData();

  const chartData = useMemo(() => {
    return analyticsData.map(item => ({
      ...item,
      netProfit: item.profit,
      profitMargin: item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0'
    }));
  }, [analyticsData]);

  const currentMetricValue = chartData[chartData.length - 1]?.[metric] || 0;
  const previousMetricValue = chartData[chartData.length - 2]?.[metric] || 0;
  const metricChange = previousMetricValue > 0 ? ((currentMetricValue - previousMetricValue) / previousMetricValue * 100).toFixed(1) : '0';

  const getMetricLabel = (metric: string) => {
    const labels = {
      revenue: 'Receita de Locações',
      profit: 'Lucro Líquido',
      occupancy: 'Taxa de Ocupação',
      activeContracts: 'Contratos Ativos'
    };
    return labels[metric as keyof typeof labels] || metric;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderTrendAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPIs baseados em dados reais */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total de Locações</p>
                <p className="text-2xl font-bold text-black">
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-black" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(metricChange) >= 0 ? '+' : ''}{metricChange}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Líquido Médio</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.profit, 0) / Math.max(chartData.length, 1))}
                </p>
              </div>
              <Target className="h-8 w-8 text-gray-800" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem de {chartData.length > 0 && chartData.reduce((sum, item) => sum + item.revenue, 0) > 0 
                ? ((chartData.reduce((sum, item) => sum + item.profit, 0) / chartData.reduce((sum, item) => sum + item.revenue, 0)) * 100).toFixed(1) 
                : '0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação Média</p>
                <p className="text-2xl font-bold text-gray-600">
                  {chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.occupancy, 0) / chartData.length).toFixed(1) : '0'}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                <p className="text-2xl font-bold text-gray-400">
                  {chartData[chartData.length - 1]?.activeContracts || 0}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contratos de locação vigentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Tendências - {getMetricLabel(metric)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Receita de Locações</SelectItem>
                <SelectItem value="profit">Lucro Líquido</SelectItem>
                <SelectItem value="occupancy">Taxa de Ocupação</SelectItem>
                <SelectItem value="activeContracts">Contratos Ativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                formatter={(value) => 
                  metric === 'occupancy' || metric === 'activeContracts' 
                    ? `${value}${metric === 'occupancy' ? '%' : ''}`
                    : formatCurrency(Number(value))
                }
                contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
              />
              <Area 
                type="monotone" 
                dataKey={metric} 
                stroke="#000000" 
                fill="#404040" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados analíticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold">Análises Avançadas</h2>
        <div className="flex gap-2">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trend">Análise de Tendências</SelectItem>
              <SelectItem value="comparison">Comparativo de Mercado</SelectItem>
              <SelectItem value="projection">Projeções</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analysisType === 'trend' && renderTrendAnalysis()}
      {analysisType === 'comparison' && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p>Análise comparativa de mercado será implementada em breve</p>
            </div>
          </CardContent>
        </Card>
      )}
      {analysisType === 'projection' && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4" />
              <p>Projeções financeiras serão implementadas em breve</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
