
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Home, 
  Users, 
  AlertTriangle,
  Calendar,
  Target,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRealRentalData } from '@/hooks/use-real-rental-data';
import { useRegionalAnalysis } from '@/hooks/use-regional-analysis';

export function ExecutiveDashboard() {
  const { kpiData, analyticsData, alerts, isLoading } = useRealRentalData();
  const { propertyTypeAnalysis } = useRegionalAnalysis();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  // Preparar dados para o gráfico de performance
  const monthlyPerformance = analyticsData.map(data => ({
    mes: data.month,
    receita: data.revenue,
    meta: data.revenue * 0.9, // Meta seria 90% da receita atual (exemplo)
    ocupacao: data.occupancy
  }));

  // Preparar dados de composição do portfolio baseado em dados reais
  const portfolioComposition = propertyTypeAnalysis.map((item, index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const totalQuantity = propertyTypeAnalysis.reduce((sum, p) => sum + p.quantidade, 0);
    const percentage = totalQuantity > 0 ? (item.quantidade / totalQuantity) * 100 : 0;
    
    return {
      tipo: item.tipo,
      valor: Math.round(percentage),
      count: item.quantidade,
      color: colors[index % colors.length]
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calcular valores para o resumo financeiro
  const latestData = analyticsData[analyticsData.length - 1];
  const previousData = analyticsData[analyticsData.length - 2];
  
  const revenueChange = previousData ? ((latestData?.revenue - previousData.revenue) / previousData.revenue) * 100 : 0;
  const expenseChange = previousData ? ((latestData?.expenses - previousData.expenses) / previousData.expenses) * 100 : 0;
  const profitChange = previousData ? ((latestData?.profit - previousData.profit) / (Math.abs(previousData.profit) || 1)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Executivo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Dashboard Executivo</h1>
        <p className="text-blue-100">Visão estratégica do seu portfolio imobiliário</p>
        <div className="mt-4 text-sm">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const icons = [DollarSign, Home, Target, TrendingUp];
          const Icon = icons[index] || DollarSign;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant={kpi.trend === 'up' ? 'default' : 'destructive'}>
                    {kpi.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance vs Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance vs Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'receita' ? 'Receita Real' : 'Meta'
                  ]}
                />
                <Bar dataKey="meta" fill="#e5e7eb" name="meta" />
                <Bar dataKey="receita" fill="#3b82f6" name="receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Composição do Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioComposition.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioComposition}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="valor"
                    >
                      {portfolioComposition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name, props: any) => [
                        `${value}% (${props.payload.count} unidades)`,
                        props.payload.tipo
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {portfolioComposition.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.tipo}</span>
                      </div>
                      <span className="font-medium">{item.count} unidades</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Prioritárias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Ações Prioritárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getPriorityColor(alert.priority)}>
                      {alert.priority === 'high' ? 'Alta' : 
                       alert.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ação prioritária no momento
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {latestData ? formatCurrency(latestData.revenue) : 'R$ 0,00'}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
              </span> vs mês anterior
            </div>
            {analyticsData.length > 0 && (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={analyticsData.slice(-6)}>
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Despesas Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-2">
              {latestData ? formatCurrency(latestData.expenses) : 'R$ 0,00'}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className={expenseChange <= 0 ? "text-green-600" : "text-red-600"}>
                {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
              </span> vs mês anterior
            </div>
            <div className="mt-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Despesas Gerais</span>
                <span>{latestData ? formatCurrency(latestData.expenses) : 'R$ 0,00'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {latestData ? formatCurrency(latestData.profit) : 'R$ 0,00'}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className={profitChange >= 0 ? "text-blue-600" : "text-red-600"}>
                {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}%
              </span> vs mês anterior
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: latestData && latestData.revenue > 0 
                      ? `${Math.min((latestData.profit / latestData.revenue) * 100, 100)}%` 
                      : '0%' 
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {latestData && latestData.revenue > 0 
                  ? `${Math.round((latestData.profit / latestData.revenue) * 100)}% da receita`
                  : '0% da receita'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
