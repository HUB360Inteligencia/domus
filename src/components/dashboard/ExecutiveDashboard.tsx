
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Users,
  AlertTriangle,
  Target,
  Calendar,
} from 'lucide-react';
import { useAdvancedReports } from '@/hooks/use-advanced-reports';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ExecutiveDashboard() {
  const { metrics, isLoadingMetrics } = useAdvancedReports();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data for demonstration
  const kpiData = [
    {
      title: 'Receita Total',
      value: 'R$ 348.500',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Propriedades Ativas',
      value: '45',
      change: '+3',
      trend: 'up',
      icon: Building,
    },
    {
      title: 'Taxa de Ocupação',
      value: '94%',
      change: '+2.1%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'ROI Médio',
      value: '8.2%',
      change: '-0.3%',
      trend: 'down',
      icon: Target,
    },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 42000, expenses: 28000 },
    { month: 'Fev', revenue: 45000, expenses: 30000 },
    { month: 'Mar', revenue: 48000, expenses: 32000 },
    { month: 'Abr', revenue: 51000, expenses: 35000 },
    { month: 'Mai', revenue: 53000, expenses: 36000 },
    { month: 'Jun', revenue: 58000, expenses: 38000 },
  ];

  const propertyTypeData = [
    { name: 'Apartamentos', value: 40, count: 18 },
    { name: 'Casas', value: 35, count: 16 },
    { name: 'Comercial', value: 15, count: 7 },
    { name: 'Terrenos', value: 10, count: 4 },
  ];

  const alerts = [
    {
      type: 'warning',
      title: 'Contratos Vencendo',
      description: '3 contratos vencem nos próximos 30 dias',
      priority: 'high',
    },
    {
      type: 'info',
      title: 'Manutenção Agendada',
      description: '5 propriedades com manutenção pendente',
      priority: 'medium',
    },
    {
      type: 'success',
      title: 'Meta Atingida',
      description: 'Meta de ocupação do mês foi atingida',
      priority: 'low',
    },
  ];

  if (isLoadingMetrics) {
    return <div>Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {['week', 'month', 'quarter', 'year'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'week' && 'Semana'}
            {period === 'month' && 'Mês'}
            {period === 'quarter' && 'Trimestre'}
            {period === 'year' && 'Ano'}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {kpi.change}
                </span>
                <span className="ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas vs Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#8884d8" name="Receitas" />
              <Bar dataKey="expenses" fill="#82ca9d" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={propertyTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {propertyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts and Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas e Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => (
              <Alert key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.description}
                      </div>
                    </div>
                    <Badge
                      variant={
                        alert.priority === 'high'
                          ? 'destructive'
                          : alert.priority === 'medium'
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {alert.priority === 'high' && 'Alto'}
                      {alert.priority === 'medium' && 'Médio'}
                      {alert.priority === 'low' && 'Baixo'}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Metas do Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Meta de Ocupação</span>
              <span>94% / 95%</span>
            </div>
            <Progress value={94} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Meta de Receita</span>
              <span>R$ 348.500 / R$ 400.000</span>
            </div>
            <Progress value={87} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Novos Contratos</span>
              <span>12 / 15</span>
            </div>
            <Progress value={80} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
