
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, PieChart, AlertTriangle, Target } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface AnalyticsData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  occupancy: number;
  newProperties: number;
  marketValue: number;
}

interface MarketComparison {
  region: string;
  avgPrice: number;
  ourAvgPrice: number;
  difference: number;
  trend: 'up' | 'down' | 'stable';
}

interface Projection {
  period: string;
  conservative: number;
  optimistic: number;
  pessimistic: number;
}

const mockAnalyticsData: AnalyticsData[] = [
  { month: 'Jan', revenue: 45000, expenses: 12000, profit: 33000, occupancy: 85, newProperties: 2, marketValue: 2800000 },
  { month: 'Fev', revenue: 48000, expenses: 13500, profit: 34500, occupancy: 87, newProperties: 1, marketValue: 2850000 },
  { month: 'Mar', revenue: 52000, expenses: 14000, profit: 38000, occupancy: 90, newProperties: 3, marketValue: 2920000 },
  { month: 'Abr', revenue: 49000, expenses: 15000, profit: 34000, occupancy: 88, newProperties: 0, marketValue: 2980000 },
  { month: 'Mai', revenue: 55000, expenses: 16000, profit: 39000, occupancy: 92, newProperties: 2, marketValue: 3050000 },
  { month: 'Jun', revenue: 58000, expenses: 15500, profit: 42500, occupancy: 94, newProperties: 1, marketValue: 3120000 },
];

const mockMarketComparison: MarketComparison[] = [
  { region: 'Vila Madalena', avgPrice: 8500, ourAvgPrice: 9200, difference: 8.2, trend: 'up' },
  { region: 'Jardins', avgPrice: 12000, ourAvgPrice: 11500, difference: -4.2, trend: 'down' },
  { region: 'Moema', avgPrice: 9800, ourAvgPrice: 10100, difference: 3.1, trend: 'up' },
  { region: 'Pinheiros', avgPrice: 7500, ourAvgPrice: 7800, difference: 4.0, trend: 'stable' },
];

const mockProjections: Projection[] = [
  { period: 'Jul 2024', conservative: 52000, optimistic: 62000, pessimistic: 45000 },
  { period: 'Ago 2024', conservative: 54000, optimistic: 65000, pessimistic: 47000 },
  { period: 'Set 2024', conservative: 56000, optimistic: 68000, pessimistic: 49000 },
  { period: 'Out 2024', conservative: 58000, optimistic: 70000, pessimistic: 51000 },
  { period: 'Nov 2024', conservative: 60000, optimistic: 72000, pessimistic: 53000 },
  { period: 'Dez 2024', conservative: 62000, optimistic: 75000, pessimistic: 55000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -180),
    to: new Date(),
  });
  const [analysisType, setAnalysisType] = useState<'trend' | 'comparison' | 'projection'>('trend');
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'occupancy' | 'marketValue'>('revenue');

  const chartData = useMemo(() => {
    return mockAnalyticsData.map(item => ({
      ...item,
      netProfit: item.revenue - item.expenses,
      profitMargin: ((item.revenue - item.expenses) / item.revenue * 100).toFixed(1)
    }));
  }, []);

  const currentMetricValue = chartData[chartData.length - 1]?.[metric] || 0;
  const previousMetricValue = chartData[chartData.length - 2]?.[metric] || 0;
  const metricChange = ((currentMetricValue - previousMetricValue) / previousMetricValue * 100).toFixed(1);

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
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{metricChange}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Médio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.profit, 0) / chartData.length)}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem de {((chartData.reduce((sum, item) => sum + item.profit, 0) / chartData.reduce((sum, item) => sum + item.revenue, 0)) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(chartData.reduce((sum, item) => sum + item.occupancy, 0) / chartData.length).toFixed(1)}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
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
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(chartData[chartData.length - 1]?.marketValue || 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
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
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => metric === 'occupancy' ? `${value}%` : formatCurrency(Number(value))} />
              <Area 
                type="monotone" 
                dataKey={metric} 
                stroke="#8884d8" 
                fill="#8884d8" 
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
            {mockMarketComparison.map((item, index) => (
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
                  {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
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
            <BarChart data={mockMarketComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="avgPrice" fill="#8884d8" name="Mercado" />
              <Bar dataKey="ourAvgPrice" fill="#82ca9d" name="Nossos Imóveis" />
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
            <LineChart data={mockProjections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="conservative" stroke="#8884d8" strokeDasharray="5 5" name="Conservador" />
              <Line type="monotone" dataKey="optimistic" stroke="#82ca9d" name="Otimista" />
              <Line type="monotone" dataKey="pessimistic" stroke="#ff7300" strokeDasharray="10 5" name="Pessimista" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cenário Conservador</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(mockProjections.reduce((sum, item) => sum + item.conservative, 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Próximos 6 meses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cenário Otimista</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(mockProjections.reduce((sum, item) => sum + item.optimistic, 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Próximos 6 meses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cenário Pessimista</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(mockProjections.reduce((sum, item) => sum + item.pessimistic, 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Próximos 6 meses</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

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
