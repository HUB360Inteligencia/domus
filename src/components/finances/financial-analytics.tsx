
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialAnalytics as FinancialAnalyticsType } from '@/types/financial';
import { Property } from '@/types/property';

interface FinancialAnalyticsProps {
  analytics: FinancialAnalyticsType;
  properties: Property[];
}

export const FinancialAnalytics = ({ analytics, properties }: FinancialAnalyticsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Dados para o gráfico de categorias de despesa
  const expensesChartData = useMemo(() => {
    return Object.entries(analytics.expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: Number(amount)
    }));
  }, [analytics.expensesByCategory]);

  // Dados para o gráfico de categorias de receita
  const incomeChartData = useMemo(() => {
    return Object.entries(analytics.incomeByCategory).map(([category, amount]) => ({
      name: category,
      value: Number(amount)
    }));
  }, [analytics.incomeByCategory]);

  // Cores para os gráficos
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28AD2',
    '#FF6B6B', '#4ECDC4', '#F9D423', '#B5D99C', '#E27D60'
  ];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card de Receita Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalIncome)}</div>
          </CardContent>
        </Card>

        {/* Card de Despesa Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalExpenses)}</div>
          </CardContent>
        </Card>

        {/* Card de Receita Líquida */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
            {analytics.netIncome >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              analytics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(analytics.netIncome)}
            </div>
          </CardContent>
        </Card>

        {/* Card de ROI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI Anual</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics.annualROI)}</div>
            <p className="text-xs text-muted-foreground">
              Mensal: {formatPercentage(analytics.monthlyROI)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receitas vs Despesas por Mês */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Receitas vs Despesas (Mensal)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={70} />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="#10b981" />
                <Bar dataKey="expense" name="Despesas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Valor Total do Patrimônio */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Valor Total do Patrimônio: {formatCurrency(analytics.propertyValues.totalValue)}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <div className="h-60">
              {properties.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={properties.map(p => ({ 
                        name: p.title,
                        value: Number(p.value)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {properties.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-1">
              {properties.map((property, index) => (
                <div key={property.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{property.title}</span>
                  </div>
                  <span>{formatCurrency(Number(property.value))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Categorias de Despesa */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {expensesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhuma despesa registrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Categorias de Receita */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {incomeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Nenhuma receita registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de ROI por Imóvel */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de ROI por Imóvel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="py-2 px-4 text-left">Imóvel</th>
                  <th className="py-2 px-4 text-right">Valor</th>
                  <th className="py-2 px-4 text-right">ROI Mensal</th>
                  <th className="py-2 px-4 text-right">ROI Anual</th>
                </tr>
              </thead>
              <tbody>
                {analytics.propertiesROI.map((item) => (
                  <tr key={item.propertyId} className="border-b">
                    <td className="py-2 px-4">{item.propertyTitle}</td>
                    <td className="py-2 px-4 text-right">
                      {formatCurrency(analytics.propertyValues.byProperty[item.propertyId] || 0)}
                    </td>
                    <td className="py-2 px-4 text-right">{formatPercentage(item.monthlyROI)}</td>
                    <td className="py-2 px-4 text-right">{formatPercentage(item.annualROI)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
