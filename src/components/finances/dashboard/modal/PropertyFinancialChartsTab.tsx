
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyAnalyticsData } from '@/api/property-analytics';
import { usePropertyFinancialMetrics } from '@/hooks/use-property-financial-metrics';
import { usePropertyTransactions } from '@/hooks/use-property-transactions';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '@/utils/currency';
import { TrendingUp, BarChart3, DollarSign, Calendar } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropertyFinancialChartsTabProps {
  property: PropertyAnalyticsData;
}

export function PropertyFinancialChartsTab({ property }: PropertyFinancialChartsTabProps) {
  const { financialMetrics, isLoadingMetrics } = usePropertyFinancialMetrics(property.id);
  const { monthlyRevenues, isLoading: isLoadingTransactions } = usePropertyTransactions(property.id, 12);

  // Gerar dados simulados para ROI histórico (últimos 12 meses)
  const generateROIHistory = () => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const baseROI = property.monthlyROI;
      const variation = (Math.random() - 0.5) * 0.5; // Variação de ±0.25%
      months.push({
        month: format(date, 'MMM/yy', { locale: ptBR }),
        roi: Math.max(0, baseROI + variation),
        accumulated: baseROI * (12 - i) / 12
      });
    }
    return months;
  };

  // Gerar dados de cash flow
  const generateCashFlowData = () => {
    return monthlyRevenues.map((revenue, index) => ({
      month: revenue.month,
      receita: revenue.totalRevenue,
      despesa: revenue.totalRevenue * 0.3, // Estimativa de 30% de despesas
      lucro: revenue.totalRevenue * 0.7
    }));
  };

  const roiHistory = generateROIHistory();
  const cashFlowData = generateCashFlowData();

  if (isLoadingMetrics || isLoadingTransactions) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="bg-gray-200 h-64 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ROI Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ROI Histórico (12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`, 
                    name === 'roi' ? 'ROI Mensal' : 'ROI Acumulado'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="accumulated" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#82ca9d' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise de Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="receita" fill="#10b981" name="Receita" />
                <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                <Bar dataKey="lucro" fill="#3b82f6" name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Comparativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Performance vs Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">ROI Meta: 1.0%</span>
                  <span className={`text-sm font-medium ${property.monthlyROI >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {property.monthlyROI >= 1 ? 'Alcançado' : 'Abaixo'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${property.monthlyROI >= 1 ? 'bg-green-600' : 'bg-red-600'}`}
                    style={{ width: `${Math.min(100, (property.monthlyROI / 1) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Vacância Meta: &lt;10%</span>
                  <span className={`text-sm font-medium ${property.vacancyRate < 10 ? 'text-green-600' : 'text-red-600'}`}>
                    {property.vacancyRate < 10 ? 'Alcançado' : 'Acima'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${property.vacancyRate < 10 ? 'bg-green-600' : 'bg-red-600'}`}
                    style={{ width: `${Math.min(100, property.vacancyRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Projeções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Receita Anual Projetada:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(property.averageRevenue * 12)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ROI Anual Projetado:</span>
                <span className="font-semibold text-blue-600">
                  {(property.monthlyROI * 12).toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payback Estimado:</span>
                <span className="font-semibold">
                  {property.monthlyROI > 0 
                    ? `${(100 / (property.monthlyROI * 12)).toFixed(1)} anos`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
