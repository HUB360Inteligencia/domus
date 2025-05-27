
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, DollarSign, Home, Percent } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useAdvancedReports } from '@/hooks/use-advanced-reports';

export function AdvancedAnalytics() {
  const { metrics, isLoadingMetrics } = useAdvancedReports();

  // Dados exemplo para os gráficos (em uma implementação real, viriam da API)
  const monthlyTrends = [
    { mes: 'Jan', receita: 15000, despesas: 8000, roi: 87.5 },
    { mes: 'Fev', receita: 18000, despesas: 9200, roi: 95.7 },
    { mes: 'Mar', receita: 16500, despesas: 8800, roi: 87.5 },
    { mes: 'Abr', receita: 19200, despesas: 9500, roi: 102.1 },
    { mes: 'Mai', receita: 20100, despesas: 9800, roi: 105.2 },
    { mes: 'Jun', receita: 22500, despesas: 10200, roi: 120.6 }
  ];

  const propertyTypeData = [
    { tipo: 'Apartamentos', quantidade: 12, receita: 45000 },
    { tipo: 'Casas', quantidade: 8, receita: 32000 },
    { tipo: 'Comercial', quantidade: 3, receita: 18000 },
    { tipo: 'Terrenos', quantidade: 2, receita: 5000 }
  ];

  const occupancyData = [
    { name: 'Ocupado', value: 85, color: '#10b981' },
    { name: 'Vago', value: 15, color: '#ef4444' }
  ];

  const regionAnalysis = [
    { regiao: 'Centro', propriedades: 8, valorMedio: 450000, ocupacao: 92 },
    { regiao: 'Zona Sul', propriedades: 6, valorMedio: 680000, ocupacao: 88 },
    { regiao: 'Zona Norte', propriedades: 7, valorMedio: 320000, ocupacao: 85 },
    { regiao: 'Zona Oeste', propriedades: 4, valorMedio: 280000, ocupacao: 90 }
  ];

  const getTrendIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
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
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                  <p className="text-2xl font-bold">
                    {metric.name.includes('Receita') ? formatCurrency(metric.value) : 
                     metric.name.includes('Taxa') ? `${metric.value.toFixed(1)}%` : 
                     `${metric.value.toFixed(1)}%`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.changeType)}
                  <span className={`text-sm ${
                    metric.changeType === 'increase' ? 'text-green-600' : 
                    metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos de Tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Receitas vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stackId="1" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Receita"
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  stackId="2" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  name="Despesas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              ROI Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Tipo de Propriedade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Receita por Tipo de Propriedade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="receita" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Taxa de Ocupação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise Regional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Análise por Região
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Região</th>
                  <th className="text-left p-4">Propriedades</th>
                  <th className="text-left p-4">Valor Médio</th>
                  <th className="text-left p-4">Taxa de Ocupação</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {regionAnalysis.map((region, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{region.regiao}</td>
                    <td className="p-4">{region.propriedades}</td>
                    <td className="p-4">{formatCurrency(region.valorMedio)}</td>
                    <td className="p-4">{region.ocupacao}%</td>
                    <td className="p-4">
                      <Badge variant={region.ocupacao >= 90 ? "default" : region.ocupacao >= 80 ? "secondary" : "destructive"}>
                        {region.ocupacao >= 90 ? "Excelente" : region.ocupacao >= 80 ? "Bom" : "Atenção"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">🎯 Oportunidade</h4>
            <p className="text-green-700">
              A Zona Sul apresenta o maior valor médio por propriedade. Considere investir mais nesta região para maximizar retornos.
            </p>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">⚠️ Atenção</h4>
            <p className="text-amber-700">
              A taxa de ocupação da Zona Norte está abaixo da média. Revise preços ou estratégias de marketing para esta região.
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Dica</h4>
            <p className="text-blue-700">
              Seu ROI está crescendo consistentemente. Continue monitorando para identificar padrões sazonais.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
