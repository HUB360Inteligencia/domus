
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
import { useAdvancedReportsData } from '@/hooks/use-advanced-reports-data';

// Paleta de cores em escala de cinza
const COLORS = ['#000000', '#404040', '#808080', '#A0A0A0', '#C0C0C0'];

export function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -180),
    to: new Date(),
  });
  const [analysisType, setAnalysisType] = useState<'trend' | 'comparison' | 'projection'>('trend');
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'occupancy' | 'marketValue'>('revenue');

  const { 
    analyticsData, 
    marketComparison, 
    projections, 
    kpiMetrics, 
    isLoading 
  } = useAdvancedReportsData();

  const chartData = useMemo(() => {
    return analyticsData.map(item => ({
      ...item,
      netProfit: item.revenue - item.expenses,
      profitMargin: item.revenue > 0 ? ((item.revenue - item.expenses) / item.revenue * 100).toFixed(1) : '0'
    }));
  }, [analyticsData]);

  const currentMetricValue = chartData[chartData.length - 1]?.[metric] || 0;
  const previousMetricValue = chartData[chartData.length - 2]?.[metric] || 0;
  const metricChange = previousMetricValue > 0 ? ((currentMetricValue - previousMetricValue) / previousMetricValue * 100).toFixed(1) : '0';

  const getMetricLabel = (metric: string) => {
    const labels = {
      revenue: 'Receita',
      profit: 'Lucro',
      occupancy: 'Ocupação',
      marketValue: 'Valor de Mercado'
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
        {/* KPIs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
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
                <p className="text-sm text-muted-foreground">Lucro Médio</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.profit, 0) / Math.max(chartData.length, 1))}
                </p>
              </div>
              <Target className="h-8 w-8 text-gray-800" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem de {chartData.length > 0 ? ((chartData.reduce((sum, item) => sum + item.profit, 0) / chartData.reduce((sum, item) => sum + item.revenue, 0)) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-2xl font-bold text-gray-600">
                  {chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.occupancy, 0) / chartData.length).toFixed(1) : '0'}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Patrimonial</p>
                <p className="text-2xl font-bold text-gray-400">
                  {formatCurrency(chartData[chartData.length - 1]?.marketValue || 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado hoje
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
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="profit">Lucro</SelectItem>
                <SelectItem value="occupancy">Taxa de Ocupação</SelectItem>
                <SelectItem value="marketValue">Valor de Mercado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                formatter={(value) => metric === 'occupancy' ? `${value}%` : formatCurrency(Number(value))}
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

  const renderMarketComparison = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Mercado por Região</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketComparison.map((item, index) => (
              <div key={item.region} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.region}</h4>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Mercado: {formatCurrency(item.avgPrice)}/m²</span>
                    <span>Nossos: {formatCurrency(item.ourAvgPrice)}/m²</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.difference > 0 ? 'default' : 'secondary'}>
                    {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}%
                  </Badge>
                  {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-black" />}
                  {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-gray-600" />}
                  {item.trend === 'stable' && <div className="h-4 w-4 bg-gray-400 rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance vs Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marketComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="region" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
              />
              <Bar dataKey="avgPrice" fill="#808080" name="Mercado" />
              <Bar dataKey="ourAvgPrice" fill="#000000" name="Nossos Imóveis" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjections = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Projeções Financeiras</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="period" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
              />
              <Line 
                type="monotone" 
                dataKey="conservative" 
                stroke="#808080" 
                strokeDasharray="5 5" 
                name="Conservador" 
              />
              <Line 
                type="monotone" 
                dataKey="optimistic" 
                stroke="#000000" 
                name="Otimista" 
              />
              <Line 
                type="monotone" 
                dataKey="pessimistic" 
                stroke="#404040" 
                strokeDasharray="10 5" 
                name="Pessimista" 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cenário Conservador</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(projections.reduce((sum, item) => sum + item.conservative, 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Próximos 6 meses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cenário Otimista</p>
              <p className="text-2xl font-bold text-black">
                {formatCurrency(projections.reduce((sum, item) => sum + item.optimistic, 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Próximos 6 meses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cenário Pessimista</p>
              <p className="text-2xl font-bold text-gray-600">
                {formatCurrency(projections.reduce((sum, item) => sum + item.pessimistic, 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Próximos 6 meses</p>
            </div>
          </CardContent>
        </Card>
      </div>
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
        <h2 className="text-2xl font-bold">Analytics Avançados</h2>
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
      {analysisType === 'comparison' && renderMarketComparison()}
      {analysisType === 'projection' && renderProjections()}
    </div>
  );
}
