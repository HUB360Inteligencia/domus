
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Home, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';

export default function Dashboard() {
  const { properties } = useProperties();
  const { transactions } = useFinancialTransactions();

  // Calculate basic metrics
  const totalProperties = properties.length;
  const totalRevenue = transactions
    .filter(tx => tx.transaction_type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpenses = transactions
    .filter(tx => tx.transaction_type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const netIncome = totalRevenue - totalExpenses;

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
            <CardTitle>Atividades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/activities">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Atividades
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/activities/new">
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
