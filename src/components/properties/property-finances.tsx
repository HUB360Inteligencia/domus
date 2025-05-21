import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { PlusIcon } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart,
  Bar,
  PieChart, 
  Pie,
  Cell, 
  ResponsiveContainer,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { TransactionForm } from '@/components/finances/transaction-form';
import { TransactionList } from '@/components/finances/transaction-list';
import { fetchPropertyFinancialTransactions } from '@/api/financial-transactions';
import { useQuery } from '@tanstack/react-query';
import { usePropertyQueries } from '@/hooks/use-property-queries';
import { Property } from '@/types/property';
import { FinancialTransaction } from '@/types/financial';
import { toast } from 'sonner';

export const PropertyFinances = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const propertyId = id || '';
  
  // Fix: Get the usePropertyDetails method from usePropertyQueries
  const { usePropertyDetails } = usePropertyQueries();
  const { 
    data: property,
    isLoading: isLoadingProperty,
    error: propertyError
  } = usePropertyDetails(propertyId);
  
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
    error: transactionsError
  } = useQuery({
    queryKey: ['property-finances', propertyId],
    queryFn: () => fetchPropertyFinancialTransactions(propertyId),
    enabled: !!propertyId,
  });

  // Handle errors
  if (propertyError || transactionsError) {
    console.error('Error loading property finances:', { propertyError, transactionsError });
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px] text-center">
          <div className="text-xl font-semibold mb-2">Erro ao carregar dados financeiros</div>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro ao buscar as informações financeiras deste imóvel. Tente novamente mais tarde.
          </p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle loading state
  if (isLoadingProperty || isLoadingTransactions) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <div className="text-muted-foreground">Carregando dados financeiros...</div>
        </div>
      </div>
    );
  }

  if (!property || !propertyId) {
    return (
      <div className="text-center py-8">
        <div className="text-xl font-semibold mb-2">Imóvel não encontrado</div>
        <p className="text-muted-foreground">
          Não foi possível encontrar informações para este imóvel.
        </p>
      </div>
    );
  }

  const incomeTransactions = transactions?.filter(t => t.transaction_type === 'income') || [];
  const expenseTransactions = transactions?.filter(t => t.transaction_type === 'expense') || [];
  
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;
  
  // ROI mensal
  const monthlyROI = property.value ? ((netIncome / Number(property.value)) * 100) / 12 : 0;
  
  // ROI anual
  const annualROI = property.value ? (netIncome / Number(property.value)) * 100 : 0;

  // Formatadores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Preparar dados para gráficos
  const prepareMonthlyData = (transactions: FinancialTransaction[]) => {
    const monthlyData: Record<string, { income: number; expense: number; net: number }> = {};
    
    // Inicializar dados dos últimos 12 meses
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { income: 0, expense: 0, net: 0 };
    }
    
    // Agrupar transações por mês
    transactions?.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        if (transaction.transaction_type === 'income') {
          monthlyData[monthKey].income += Number(transaction.amount);
        } else {
          monthlyData[monthKey].expense += Number(transaction.amount);
        }
        monthlyData[monthKey].net = 
          monthlyData[monthKey].income - monthlyData[monthKey].expense;
      }
    });
    
    // Converter para array e adicionar nome do mês para exibição
    return Object.entries(monthlyData).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: format(date, 'MMM/yy'),
        ...data
      };
    }).reverse();
  };
  
  const prepareCategoryData = (transactions: FinancialTransaction[]) => {
    const categoryData: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category;
      categoryData[category] = (categoryData[category] || 0) + Number(transaction.amount);
    });
    
    return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  };
  
  const monthlyData = prepareMonthlyData(transactions || []);
  const incomeByCategory = prepareCategoryData(incomeTransactions);
  const expensesByCategory = prepareCategoryData(expenseTransactions);
  
  // Cores para os gráficos
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28AD2',
    '#FF6B6B', '#4ECDC4', '#F9D423', '#B5D99C', '#E27D60'
  ];

  // Create a custom bar style function for recharts
  const getBarFill = (entry: any) => {
    return entry.net >= 0 ? '#10b981' : '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receitas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercentage(annualROI)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mensal: {formatPercentage(monthlyROI)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <PlusIcon className="h-4 w-4" />
              Adicionar Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Nova Transação para {property.title}</DialogTitle>
            </DialogHeader>
            <TransactionForm 
              onSuccess={() => {
                setIsDialogOpen(false);
                toast.success("Transação adicionada com sucesso");
              }} 
              defaultPropertyId={propertyId}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas (Mensal)</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
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
            
            <Card>
              <CardHeader>
                <CardTitle>Resultado Líquido Mensal</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
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
                    <Bar 
                      dataKey="net" 
                      name="Resultado" 
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesByCategory.map((_, index) => (
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
            
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {incomeByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {incomeByCategory.map((_, index) => (
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
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionList 
            transactions={transactions || []} 
            isLoading={isLoadingTransactions} 
            propertyId={propertyId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
