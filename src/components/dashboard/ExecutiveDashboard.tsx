
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, Home, Users, 
  AlertCircle, Target, Calendar, Download, RefreshCw 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Cell } from 'recharts';

interface KPI {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  target?: number;
  current?: number;
  icon: React.ElementType;
  color: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  date: string;
}

const mockKPIs: KPI[] = [
  {
    title: 'Receita Total',
    value: 'R$ 348.500',
    change: 12.5,
    changeType: 'increase',
    icon: DollarSign,
    color: 'text-green-600',
  },
  {
    title: 'Taxa de Ocupação',
    value: '94%',
    change: 2.1,
    changeType: 'increase',
    target: 95,
    current: 94,
    icon: Home,
    color: 'text-blue-600',
  },
  {
    title: 'ROI Médio',
    value: '8.2%',
    change: -0.3,
    changeType: 'decrease',
    icon: TrendingUp,
    color: 'text-purple-600',
  },
  {
    title: 'Propriedades Ativas',
    value: '47',
    change: 6.4,
    changeType: 'increase',
    icon: Users,
    color: 'text-orange-600',
  },
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Contrato vencendo',
    message: 'Contrato da Rua Augusta, 123 vence em 15 dias',
    priority: 'high',
    date: '2024-01-15',
  },
  {
    id: '2',
    type: 'error',
    title: 'Pagamento em atraso',
    message: 'Inquilino João Silva - 3 dias de atraso',
    priority: 'high',
    date: '2024-01-14',
  },
  {
    id: '3',
    type: 'info',
    title: 'Manutenção agendada',
    message: 'Apartamento 504 - Revisão de ar condicionado',
    priority: 'medium',
    date: '2024-01-16',
  },
];

const mockPerformanceData = [
  { month: 'Jul', receita: 42000, despesas: 12000, ocupacao: 88 },
  { month: 'Ago', receita: 45000, despesas: 13000, ocupacao: 90 },
  { month: 'Set', receita: 48000, despesas: 11500, ocupacao: 92 },
  { month: 'Out', receita: 51000, despesas: 14000, ocupacao: 89 },
  { month: 'Nov', receita: 53000, despesas: 13500, ocupacao: 94 },
  { month: 'Dez', receita: 58000, despesas: 15000, ocupacao: 96 },
];

const mockPortfolioDistribution = [
  { name: 'Apartamentos', value: 65, color: '#0088FE' },
  { name: 'Casas', value: 25, color: '#00C49F' },
  { name: 'Comercial', value: 8, color: '#FFBB28' },
  { name: 'Terrenos', value: 2, color: '#FF8042' },
];

export function ExecutiveDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getAlertColor = (type: string, priority: string) => {
    if (type === 'error' || priority === 'high') return 'text-red-600';
    if (type === 'warning') return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getAlertBadgeVariant = (priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho dos seus investimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockKPIs.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className="flex items-center space-x-1">
                    {kpi.changeType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : kpi.changeType === 'decrease' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span 
                      className={`text-sm ${
                        kpi.changeType === 'increase' ? 'text-green-500' : 
                        kpi.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      {kpi.changeType !== 'stable' && (kpi.change > 0 ? '+' : '')}{kpi.change}%
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-muted`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
              
              {kpi.target && kpi.current && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Meta: {kpi.target}%</span>
                    <span>{kpi.current}%</span>
                  </div>
                  <Progress value={(kpi.current / kpi.target) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Financeira (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.8}
                  name="Receita"
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.8}
                  name="Despesas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Portfolio Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Portfólio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockPortfolioDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {mockPortfolioDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${getAlertColor(alert.type, alert.priority)}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alert.title}</h4>
                    <Badge variant={getAlertBadgeVariant(alert.priority)}>
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Atividades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Renovação de contrato</h4>
                  <p className="text-sm text-muted-foreground">Apartamento Vila Madalena - Amanhã</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Vistoria programada</h4>
                  <p className="text-sm text-muted-foreground">Casa Jardins - 18/01/2024</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Reunião com inquilino</h4>
                  <p className="text-sm text-muted-foreground">Comercial Pinheiros - 20/01/2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Home className="h-6 w-6 mb-2" />
              Nova Propriedade
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-2" />
              Novo Contrato
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <DollarSign className="h-6 w-6 mb-2" />
              Lançar Receita
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Target className="h-6 w-6 mb-2" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
