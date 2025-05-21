
import React from 'react';
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
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseAnalytics } from '@/types/property-expense';

interface ExpenseAnalyticsProps {
  analytics: ExpenseAnalytics;
}

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function ExpenseAnalyticsDisplay({ analytics }: ExpenseAnalyticsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format data for pie chart
  const pieData = Object.entries(analytics.expensesByType).map(([key, value], index) => {
    const expenseTypeMap: Record<string, string> = {
      'maintenance': 'Manutenção',
      'condo_fee': 'Condomínio',
      'tax': 'Impostos',
      'inspection': 'Vistoria',
      'renovation': 'Reforma',
      'insurance': 'Seguro',
      'other': 'Outro'
    };
    
    return {
      name: expenseTypeMap[key] || key,
      value: Number(value)
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Despesas (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalExpenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.lastMonthExpenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.monthlyAverage)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">Despesas Mensais</TabsTrigger>
          <TabsTrigger value="byType">Despesas por Tipo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas Mensais (Últimos 12 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.expensesByMonth}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{fontSize: 12}}
                      interval={0}
                      tickMargin={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${value}`}
                      tick={{fontSize: 12}}
                    />
                    <Tooltip 
                      formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Valor"]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Bar dataKey="total" fill="#0088FE" name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="byType" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria (Últimos 12 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Valor"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Sem dados para exibir</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
