
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';

export default function FinancialTransactionsPage() {
  return (
    <div className="container py-6">
      <PageHeader
        title="Transações Financeiras"
        description="Gerencie todas as transações financeiras dos seus imóveis"
      />
      
      <div className="space-y-6">
        <div className="text-center text-muted-foreground">
          Página de transações financeiras em desenvolvimento
        </div>
      </div>
    </div>
  );
}
