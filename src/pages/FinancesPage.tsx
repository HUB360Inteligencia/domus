
import { useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
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
import { TransactionFormMobile } from '@/components/finances/transaction-form-mobile';
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
import { InfoIcon } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

export default function FinancesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [filters, setFilters] = useState<FinancialReportFilters>({});
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = useMobile();
  
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

  // Log para ajudar a depurar o problema
  console.log('FinancesPage render:', { 
    transactionsCount: transactions?.length || 0,
    analyticsExists: !!analytics,
    propertiesCount: properties?.length || 0,
    isLoadingTransactions,
    isLoadingAnalytics,
    isLoadingProperties,
    transactionsError,
    analyticsError
  });

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
            <Button className={`flex gap-2 ${isMobile ? 'hidden' : 'flex'}`}>
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
          ) : analytics && properties ? (
            transactions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <InfoIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma transação encontrada</h3>
                  <p className="text-muted-foreground mb-6">
                    Você ainda não possui transações financeiras registradas. Adicione sua primeira transação para começar a ver análises.
                  </p>
                  <Button onClick={() => isMobile ? setIsQuickAddOpen(true) : setIsDialogOpen(true)}>
                    Adicionar primeira transação
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <FinancialAnalytics 
                analytics={analytics} 
                properties={properties}
              />
            )
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px] text-center">
                <div className="text-xl font-semibold mb-2">Nenhum dado financeiro disponível</div>
                <p className="text-muted-foreground mb-4">
                  Não foi possível carregar as análises financeiras.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
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

      {/* Mobile Quick Add Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="px-4 py-4 sm:max-w-[500px]">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle>Adicionar Transação</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsQuickAddOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <TransactionFormMobile onSuccess={() => {
            setIsQuickAddOpen(false);
            toast.success("Transação adicionada com sucesso");
          }} />
        </DialogContent>
      </Dialog>

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setIsQuickAddOpen(true)}
          >
            <PlusIcon className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
