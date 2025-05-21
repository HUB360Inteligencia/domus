
import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionForm } from '@/components/finances/transaction-form';
import { TransactionList } from '@/components/finances/transaction-list';
import { FinancialAnalytics } from '@/components/finances/financial-analytics';
import { FinancialFilters } from '@/components/finances/financial-filters';
import { FinancialReport } from '@/components/finances/financial-report';
import { PageHeader } from '@/components/ui/page-header';
import { 
  useFinancialTransactions,
  useFinancialAnalytics
} from '@/hooks/use-financial-transactions';
import { useProperties } from '@/hooks/use-properties';
import { FinancialReportFilters } from '@/types/financial';

export default function FinancesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FinancialReportFilters>({});
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    data: transactions, 
    isLoading: isLoadingTransactions 
  } = useFinancialTransactions(filters);
  
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics 
  } = useFinancialAnalytics(filters);
  
  const { properties, isLoading: isLoadingProperties } = useProperties();

  const handleFilterChange = (newFilters: FinancialReportFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <PageHeader
        title="Finanças"
        description="Gerencie suas receitas e despesas, acompanhe o desempenho financeiro dos seus imóveis."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <PlusIcon className="h-4 w-4" />
              Adicionar Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Nova Transação Financeira</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <FinancialFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {analytics && properties && !isLoadingAnalytics && !isLoadingProperties ? (
            <FinancialAnalytics 
              analytics={analytics} 
              properties={properties}
            />
          ) : (
            <div className="flex justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <div className="text-muted-foreground">Carregando análises financeiras...</div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionList 
            transactions={transactions || []} 
            isLoading={isLoadingTransactions} 
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <FinancialReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
