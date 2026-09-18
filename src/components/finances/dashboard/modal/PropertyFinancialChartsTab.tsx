import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyAnalyticsData } from '@/api/property-analytics';
import { usePropertyFinancialMetrics } from '@/hooks/use-property-financial-metrics';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { formatCurrency } from '@/utils/currency';
import { toDateOnlyString, toMonthKey } from '@/lib/dates';
import { TrendingUp, BarChart3, DollarSign, Calendar } from 'lucide-react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropertyFinancialChartsTabProps {
  property: PropertyAnalyticsData;
}

const MONTHS = 12;

export function PropertyFinancialChartsTab({ property }: PropertyFinancialChartsTabProps) {
  const { financialMetrics, isLoadingMetrics } = usePropertyFinancialMetrics(property.id);

  const windowStart = useMemo(() => startOfMonth(subMonths(new Date(), MONTHS - 1)), []);

  // Lançamentos reais do imóvel nos últimos 12 meses (receitas e despesas)
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['property-transactions-monthly', property.id, toDateOnlyString(windowStart)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('property_id', property.id)
        .gte('transaction_date', toDateOnlyString(windowStart));
      if (error) throw error;
      return data || [];
    },
  });

  const capitalBase = financialMetrics?.capitalBase || property.totalInvestment || property.marketValue || 0;

  const monthlySeries = useMemo(() => {
    const totals = new Map<string, { receita: number; despesa: number }>();
    transactions.forEach((transaction) => {
      const key = toMonthKey(transaction.transaction_date);
      const entry = totals.get(key) || { receita: 0, despesa: 0 };
      if (transaction.transaction_type === 'income') entry.receita += Number(transaction.amount || 0);
      else entry.despesa += Number(transaction.amount || 0);
      totals.set(key, entry);
    });

    let accumulatedNet = 0;
    return Array.from({ length: MONTHS }, (_, index) => {
      const date = startOfMonth(subMonths(new Date(), MONTHS - 1 - index));
      const { receita, despesa } = totals.get(toMonthKey(date)) || { receita: 0, despesa: 0 };
      const lucro = receita - despesa;
      accumulatedNet += lucro;
      return {
        month: format(date, 'MMM/yy', { locale: ptBR }),
        receita,
        despesa,
        lucro,
        roi: capitalBase > 0 ? (lucro / capitalBase) * 100 : 0,
        accumulated: capitalBase > 0 ? (accumulatedNet / capitalBase) * 100 : 0,
      };
    });
  }, [transactions, capitalBase]);

  const roiHistory = monthlySeries;
  const cashFlowData = monthlySeries;

  if (isLoadingMetrics || isLoadingTransactions) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 rounded-2xl bg-muted" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,110,100,0.18)" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`, 
                    name === 'roi' ? 'ROI Mensal' : 'ROI Acumulado'
                  ]}
                />
                <Legend formatter={(value) => (value === 'roi' ? 'ROI mensal' : 'ROI acumulado no período')} />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="#c4934f" 
                  strokeWidth={2}
                  dot={{ fill: '#c4934f' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="accumulated" 
                  stroke="#4f6f85" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#4f6f85' }}
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,110,100,0.18)" />
                <XAxis dataKey="month" />
                <YAxis width={90} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="receita" fill="#6f8f74" name="Receita" radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesa" fill="#9f5d4c" name="Despesa" radius={[8, 8, 0, 0]} />
                <Bar dataKey="lucro" fill="#c4934f" name="Resultado" radius={[8, 8, 0, 0]} />
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
                <div className="h-2 w-full rounded-full bg-muted">
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
                <div className="h-2 w-full rounded-full bg-muted">
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
