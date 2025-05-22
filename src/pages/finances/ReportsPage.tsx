
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useProperties } from '@/hooks/use-properties';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { transactions } = useFinancialTransactions();
  const { properties } = useProperties();
  
  // Filtragem por propriedade, se selecionada
  const filteredTransactions = selectedPropertyId 
    ? transactions.filter(tx => tx.property_id === selectedPropertyId)
    : transactions;
    
  // Dados para relatório
  const incomeTotal = filteredTransactions
    .filter(tx => tx.transaction_type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
    
  const expenseTotal = filteredTransactions
    .filter(tx => tx.transaction_type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
    
  const balance = incomeTotal - expenseTotal;

  // Agrupar por categoria para relatório detalhado
  const categoryTotals = filteredTransactions.reduce((acc: Record<string, { income: number, expense: number }>, tx) => {
    const category = tx.category;
    if (!acc[category]) {
      acc[category] = { income: 0, expense: 0 };
    }
    
    if (tx.transaction_type === 'income') {
      acc[category].income += Number(tx.amount);
    } else {
      acc[category].expense += Number(tx.amount);
    }
    
    return acc;
  }, {});
  
  // Property options for dropdown
  const propertyOptions = properties?.map(property => ({
    label: property.title,
    value: property.id
  })) || [];
  
  return (
    <div className="container py-6">
      <PageHeader title="Relatórios Financeiros" description="Análise detalhada das suas finanças por imóvel">
        <div className="w-64">
          <Select 
            onValueChange={(value) => setSelectedPropertyId(value === "all" ? null : value)} 
            defaultValue="all"
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por imóvel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Imóveis</SelectItem>
              {propertyOptions.map((property) => (
                <SelectItem key={property.value} value={property.value}>
                  {property.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-red-600">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={balance >= 0 ? "text-green-600" : "text-red-600"}>Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relatório por Categorias */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Relatório por Categorias</CardTitle>
          <CardDescription>Análise de receitas e despesas por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(categoryTotals).map(([category, { income, expense }]) => (
              <div key={category} className="flex items-center justify-between py-2 border-b">
                <div className="font-medium">{category}</div>
                <div className="space-x-4 flex">
                  <span className="text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}
                  </span>
                  <span className="text-red-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense)}
                  </span>
                  <span className={income - expense >= 0 ? "text-green-600" : "text-red-600"}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income - expense)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            {selectedPropertyId 
              ? `Mostrando dados para o imóvel selecionado`
              : `Mostrando dados para todos os imóveis`}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
