
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
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

export default function FinancesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FinancialReportFilters>({});
  const [activeTab, setActiveTab] = useState('overview');
  
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useFinancialTransactions(filters);
  
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics,
    error: analyticsError 
  } = useFinancialAnalytics(filters);
  
  const { properties = [], isLoading: isLoadingProperties } = useProperties();

  const handleFilterChange = (newFilters: FinancialReportFilters) => {
    setFilters(newFilters);
  };

  if (transactionsError || analyticsError) {
    console.error('Error loading financial data:', { transactionsError, analyticsError });
    return (
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <PageHeader
          title="Finanças"
          description="Gerencie suas receitas e despesas, acompanhe o desempenho financeiro dos seus imóveis."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px] text-center">
            <div className="text-xl font-semibold mb-2">Não foi possível carregar os dados financeiros</div>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro ao buscar os dados financeiros. Tente novamente mais tarde.
            </p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <TransactionForm onSuccess={() => {
              setIsDialogOpen(false);
              toast.success("Transação adicionada com sucesso");
            }} />
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
          {isLoadingAnalytics || isLoadingProperties ? (
            <div className="flex justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <div className="text-muted-foreground">Carregando análises financeiras...</div>
              </div>
            </div>
          ) : !analytics || !properties ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px] text-center">
                <div className="text-xl font-semibold mb-2">Nenhum dado financeiro encontrado</div>
                <p className="text-muted-foreground mb-4">
                  Você ainda não possui transações financeiras registradas.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  Adicionar primeira transação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <FinancialAnalytics 
              analytics={analytics} 
              properties={properties}
            />
          )}
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionList 
            transactions={transactions} 
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
