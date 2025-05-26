
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
} from 'lucide-react';
import { useExecutiveDashboardData } from '@/hooks/use-executive-dashboard-data';
import { GoalsEditor } from '@/components/dashboard/GoalsEditor';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const iconMap = {
  DollarSign,
  Building,
  Users,
  Target,
};

export function ExecutiveDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { 
    kpiData, 
    revenueData, 
    propertyTypeData, 
    alerts, 
    goals, 
    isLoading 
  } = useExecutiveDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector and Goals Editor */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
        <GoalsEditor />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const IconComponent = iconMap[kpi.icon as keyof typeof iconMap];
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
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
                  <span className="ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart */}
      {revenueData && revenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receitas de Locações vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => 
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
                  }
                />
                <Bar dataKey="revenue" fill="#8884d8" name="Receitas de Locações" />
                <Bar dataKey="expenses" fill="#82ca9d" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Types Distribution */}
        {propertyTypeData.length > 0 && (
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
        )}

        {/* Alerts and Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas e Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
            ) : (
              alerts.map((alert, index) => (
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
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Metas do Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal, index) => {
            const formatValue = (value: number) => {
              if (goal.unit === 'R$') {
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
              }
              return `${value.toFixed(goal.unit === '%' ? 1 : 0)}${goal.unit === '%' ? '%' : ''}`;
            };

            return (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{goal.name}</span>
                  <span>
                    {formatValue(goal.current)} / {formatValue(goal.target)}
                  </span>
                </div>
                <ProgressBar value={goal.progress} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
