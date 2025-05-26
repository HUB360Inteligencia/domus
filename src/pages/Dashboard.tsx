
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Home, DollarSign, Calendar, BarChart3, Target, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useAdvancedReportsData } from '@/hooks/use-advanced-reports-data';

export default function Dashboard() {
  const { properties } = useProperties();
  const { transactions } = useFinancialTransactions();
  const { kpiMetrics } = useAdvancedReportsData();

  // Calculate basic metrics
  const totalProperties = properties.length;
  const totalRevenue = transactions
    .filter(tx => tx.transaction_type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpenses = transactions
    .filter(tx => tx.transaction_type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const netIncome = totalRevenue - totalExpenses;

  // Get latest metrics for preview
  const latestMetrics = kpiMetrics.length > 0 ? kpiMetrics[0] : null;

  return (
    <div className="container py-6">
      <PageHeader 
        title="Dashboard" 
        description="Visão geral do seu portfólio imobiliário"
      >
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Propriedade
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/finances/transactions">
              <DollarSign className="mr-2 h-4 w-4" />
              Nova Transação
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Propriedades</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">propriedades no portfólio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">receitas acumuladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">despesas acumuladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">receitas - despesas</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Preview Section */}
      {latestMetrics && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Avançados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(latestMetrics.value)}
                  </div>
                  <p className="text-sm text-muted-foreground">{latestMetrics.name}</p>
                  <div className="flex items-center justify-center mt-1">
                    {latestMetrics.changeType === 'increase' ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${latestMetrics.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                      {latestMetrics.change >= 0 ? '+' : ''}{latestMetrics.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {kpiMetrics.slice(1, 3).map((metric, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold">
                      {metric.name.includes('Taxa') 
                        ? `${metric.value.toFixed(1)}%` 
                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metric.value)
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.name}</p>
                    <div className="flex items-center justify-center mt-1">
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs ${metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link to="/advanced-reports">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver Relatórios Completos
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/advanced-reports?tab=analytics">
                    <Target className="mr-2 h-4 w-4" />
                    Analytics Avançados
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Propriedades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/properties">
                <Home className="mr-2 h-4 w-4" />
                Ver Todas as Propriedades
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Propriedade
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestão Financeira</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/finances/dashboard">
                <TrendingUp className="mr-2 h-4 w-4" />
                Painel Financeiro
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/finances/transactions">
                <DollarSign className="mr-2 h-4 w-4" />
                Transações
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios e Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/advanced-reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard Executivo
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/advanced-reports?tab=reports">
                <PieChart className="mr-2 h-4 w-4" />
                Relatórios Personalizados
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/activities">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Atividades
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
