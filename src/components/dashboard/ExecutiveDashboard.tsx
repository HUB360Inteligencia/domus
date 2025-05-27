
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
import { useAdvancedReports } from '@/hooks/use-advanced-reports';

export function ExecutiveDashboard() {
  const { metrics, isLoadingMetrics } = useAdvancedReports();

  // Dados executivos simulados
  const executiveKPIs = [
    {
      title: 'Receita Total',
      value: 'R$ 247.500',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      description: 'Últimos 6 meses'
    },
    {
      title: 'Propriedades Ativas',
      value: '25',
      change: '+2',
      trend: 'up',
      icon: Home,
      description: 'Portfolio total'
    },
    {
      title: 'Taxa Ocupação',
      value: '87.5%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      description: 'Média geral'
    },
    {
      title: 'ROI Médio',
      value: '9.8%',
      change: '-0.3%',
      trend: 'down',
      icon: TrendingUp,
      description: 'Anual'
    }
  ];

  const monthlyPerformance = [
    { mes: 'Jan', receita: 38000, meta: 40000, ocupacao: 85 },
    { mes: 'Fev', receita: 42000, meta: 40000, ocupacao: 88 },
    { mes: 'Mar', receita: 39500, meta: 40000, ocupacao: 86 },
    { mes: 'Abr', receita: 43200, meta: 42000, ocupacao: 89 },
    { mes: 'Mai', receita: 41500, meta: 42000, ocupacao: 87 },
    { mes: 'Jun', receita: 45300, meta: 45000, ocupacao: 90 }
  ];

  const portfolioComposition = [
    { tipo: 'Apartamentos', valor: 65, count: 16, color: '#3b82f6' },
    { tipo: 'Casas', valor: 25, count: 6, color: '#10b981' },
    { tipo: 'Comercial', valor: 10, count: 3, color: '#f59e0b' }
  ];

  const upcomingActions = [
    { type: 'contract', title: 'Renovação Contrato - Apt 101', due: '15 dias', priority: 'high' },
    { type: 'maintenance', title: 'Manutenção Programada - Casa Centro', due: '3 dias', priority: 'medium' },
    { type: 'inspection', title: 'Vistoria Semestral - Ed. Solar', due: '7 dias', priority: 'low' },
    { type: 'payment', title: 'Inadimplência - Apt 205', due: 'Vencido', priority: 'high' }
  ];

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

  if (isLoadingMetrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        {executiveKPIs.map((kpi, index) => {
          const Icon = kpi.icon;
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
                  <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
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
            {upcomingActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm text-muted-foreground">Vencimento: {action.due}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getPriorityColor(action.priority)}>
                    {action.priority === 'high' ? 'Alta' : 
                     action.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
            <div className="text-2xl font-bold text-green-600 mb-2">R$ 45.300</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-green-600">+8.2%</span> vs mês anterior
            </div>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={monthlyPerformance.slice(-6)}>
                  <Area 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Despesas Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 mb-2">R$ 12.800</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-red-600">+3.1%</span> vs mês anterior
            </div>
            <div className="mt-4 text-sm">
              <div className="flex justify-between">
                <span>Manutenção:</span>
                <span>R$ 8.200</span>
              </div>
              <div className="flex justify-between">
                <span>Impostos:</span>
                <span>R$ 4.600</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">R$ 32.500</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-blue-600">+11.8%</span> vs mês anterior
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: '72%' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                72% da receita
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
