
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Calendar } from 'lucide-react';
import { Property } from '@/types/property';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { useFinancialTransactions, FinancialTransaction } from '@/hooks/use-financial-transactions';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { TransactionModal } from '@/components/finances/transaction-modal';
import { TransactionTable } from '@/components/finances/transaction-table';
import { FinancialSummaryCards } from '@/components/finances/financial-summary-cards';
import { DeleteTransactionModal } from '@/components/finances/delete-transaction-modal';
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
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<FinancialTransaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly' | 'last12months'>('monthly');
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>();
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>();

  // Initialize financial categories
  const { 
    categories, 
    categoryOptions,
    isLoadingCategories,
    initializeDefaultCategories 
  } = useFinancialCategories();

  // Initialize categories if none exist
  React.useEffect(() => {
    if (!isLoadingCategories && categories.length === 0) {
      initializeDefaultCategories();
    }
  }, [isLoadingCategories, categories.length, initializeDefaultCategories]);

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

  // Calculate summary data based on view mode
  const getSummaryDates = () => {
    const now = new Date();
    switch (viewMode) {
      case 'monthly':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1))
        };
      case 'yearly':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      case 'last12months':
        return {
          start: subYears(now, 1),
          end: now
        };
      default:
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1))
        };
    }
  };

  const { start: summaryStartDate, end: summaryEndDate } = getSummaryDates();

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
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (transaction: FinancialTransaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingTransaction) {
      await deleteTransaction(deletingTransaction.id);
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
    }
  };

  const handleCreateTransaction = async (data: any) => {
    await createTransaction({
      ...data,
      property_id: property?.id || null,
    });
    setIsModalOpen(false);
  };

  const handleUpdateTransaction = async (data: any) => {
    if (editingTransaction) {
      await updateTransaction({
        ...data,
        id: editingTransaction.id,
        property_id: property?.id || null,
      });
      setIsModalOpen(false);
      setEditingTransaction(null);
    }
  };

  const handleSubmitTransaction = async (data: any) => {
    if (editingTransaction) {
      await handleUpdateTransaction(data);
    } else {
      await handleCreateTransaction(data);
    }
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
      <FinancialSummaryCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        balance={balance}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

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
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onViewReceipt={(transaction) => {
            if (transaction.receipt_url) {
              window.open(transaction.receipt_url, '_blank');
            }
          }}
        />
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSubmitTransaction}
        isSubmitting={isCreating || isUpdating}
        properties={property ? [{ value: property.id, label: property.title }] : []}
        categories={categoryOptions}
        initialData={editingTransaction || {
          name: '',
          amount: 0,
          transaction_type: 'expense' as const,
          category: '',
          subcategory: null,
          description: '',
          transaction_date: format(new Date(), 'yyyy-MM-dd'),
          property_id: property?.id || null,
          payment_method: null,
          recurring: false,
          recurring_frequency: null,
          recurring_end_date: null,
          receipt_url: null,
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTransaction(null);
        }}
        onConfirm={handleConfirmDelete}
        transactionName={deletingTransaction?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
};
