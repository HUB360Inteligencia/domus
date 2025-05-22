
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';

export default function FinanceDashboardPage() {
  return (
    <div className="container py-6">
      <PageHeader title="Painel Financeiro" description="Visão geral das suas finanças">
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Receitas</h3>
          <p className="text-2xl font-bold text-green-600">
            R$ 0,00
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Despesas</h3>
          <p className="text-2xl font-bold text-red-600">
            R$ 0,00
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Saldo</h3>
          <p className="text-2xl font-bold text-blue-600">
            R$ 0,00
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-lg font-medium mb-4">Resumo Financeiro</h2>
        <p className="text-gray-500">
          Bem-vindo ao seu painel financeiro. Aqui você encontrará um resumo das suas finanças e poderá navegar para ver detalhes específicos de receitas, despesas e relatórios por imóvel.
        </p>
      </div>
    </div>
  );
}
