
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Property } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { TransactionModal } from '@/components/finances/transaction-modal';
import { TransactionTable } from '@/components/finances/transaction-table';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyTransactionsSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyTransactionsSection: React.FC<PropertyTransactionsSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(subMonths(new Date(), 1)));
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>();
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>();

  // Filter transactions by property
  const filters = {
    propertyId: property?.id,
    startDate: periodStartDate ? format(periodStartDate, 'yyyy-MM-dd') : undefined,
    endDate: periodEndDate ? format(periodEndDate, 'yyyy-MM-dd') : undefined,
  };

  const {
    transactions,
    isLoadingTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFinancialTransactions(filters);

  // Calculate summary data
  const summaryStartDate = viewMode === 'monthly' ? startDate : startOfYear(new Date());
  const summaryEndDate = viewMode === 'monthly' ? endDate : endOfYear(new Date());

  const summaryTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date);
    return transactionDate >= summaryStartDate && transactionDate <= summaryEndDate;
  });

  const totalIncome = summaryTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = summaryTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Calculate period analysis
  const periodTransactions = periodStartDate && periodEndDate ? transactions.filter(t => {
    const transactionDate = new Date(t.transaction_date);
    return transactionDate >= periodStartDate && transactionDate <= periodEndDate;
  }) : [];

  const periodIncome = periodTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const periodExpenses = periodTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const periodBalance = periodIncome - periodExpenses;

  const handleNewTransaction = () => {
    setIsModalOpen(true);
  };

  const handleCreateTransaction = async (data: any) => {
    await createTransaction({
      ...data,
      property_id: property?.id || null,
    });
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with New Transaction Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Transações Financeiras</h3>
        <Button onClick={handleNewTransaction} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">Resumo Financeiro</h4>
          <Select value={viewMode} onValueChange={(value: 'monthly' | 'yearly') => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mês Anterior</SelectItem>
              <SelectItem value="yearly">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                {viewMode === 'monthly' 
                  ? format(startDate, 'MMMM yyyy', { locale: ptBR })
                  : format(new Date(), 'yyyy')
                }
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {viewMode === 'monthly' 
                  ? format(startDate, 'MMMM yyyy', { locale: ptBR })
                  : format(new Date(), 'yyyy')
                }
              </p>
            </CardContent>
          </Card>

          {/* Balance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(balance))}
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={balance >= 0 ? 'default' : 'destructive'}>
                  {balance >= 0 ? 'Positivo' : 'Negativo'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Period Analysis Widget */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Análise por Período</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Início</Label>
            <DatePicker
              date={periodStartDate}
              onSelect={setPeriodStartDate}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <DatePicker
              date={periodEndDate}
              onSelect={setPeriodEndDate}
            />
          </div>
        </div>

        {periodStartDate && periodEndDate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Receitas do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(periodIncome)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Despesas do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(periodExpenses)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Saldo do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${periodBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(periodBalance))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Separator />

      {/* Transactions Table */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium">Histórico de Transações</h4>
        <TransactionTable
          transactions={transactions}
          isLoading={isLoadingTransactions}
          onEdit={(transaction) => {
            // Handle edit transaction
            console.log('Edit transaction:', transaction);
          }}
          onDelete={deleteTransaction}
        />
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransaction}
        isSubmitting={isCreating}
        properties={property ? [{ value: property.id, label: property.title }] : []}
        categories={[]}
        initialData={{
          name: '',
          amount: 0,
          transaction_type: 'expense' as const,
          category: '',
          transaction_date: format(new Date(), 'yyyy-MM-dd'),
          property_id: property?.id || null,
          subcategory: null,
          description: '',
          payment_method: null,
          recurring: false,
          recurring_frequency: null,
          recurring_end_date: null,
          receipt_url: null,
        }}
      />
    </div>
  );
};
