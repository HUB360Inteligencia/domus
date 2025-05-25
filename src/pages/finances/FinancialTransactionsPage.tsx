import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionTable } from '@/components/finances/transaction-table';
import { TransactionModal } from '@/components/finances/transaction-modal';
import { TransactionFilters } from '@/components/finances/transaction-filters';
import { useFinancialTransactions, TransactionFormData } from '@/hooks/use-financial-transactions';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useProperties } from '@/hooks/use-properties';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FinancialTransactionsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(() => {
    // Set initial tab based on URL parameter
    if (tabFromUrl === 'income' || tabFromUrl === 'expense') {
      return tabFromUrl;
    }
    return 'all';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<(TransactionFormData & { id: string }) | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [newTransactionType, setNewTransactionType] = useState<'income' | 'expense' | undefined>(undefined);
  
  const { 
    transactions: allTransactions, 
    isLoadingTransactions, 
    createTransaction, 
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
    filters,
    handleFilterChange
  } = useFinancialTransactions();

  const { properties } = useProperties();
  const { categories, categoryOptions } = useFinancialCategories();

  // Property options for dropdown
  const propertyOptions = properties?.map(property => ({
    label: property.title,
    value: property.id
  })) || [];

  // Filter transactions based on active tab
  const getFilteredTransactions = () => {
    switch (activeTab) {
      case 'income':
        return allTransactions.filter(tx => tx.transaction_type === 'income');
      case 'expense':
        return allTransactions.filter(tx => tx.transaction_type === 'expense');
      default:
        return allTransactions;
    }
  };

  const transactions = getFilteredTransactions();

  const handleOpenModal = (transaction?: any) => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setNewTransactionType(undefined);
    } else {
      // For new transactions, just set the type and clear selected transaction
      const transactionType = activeTab === 'income' ? 'income' : 
                             activeTab === 'expense' ? 'expense' : 
                             undefined;
      setSelectedTransaction(null);
      setNewTransactionType(transactionType);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setNewTransactionType(undefined);
  };

  const handleSubmit = async (data: TransactionFormData) => {
    // If on specific tab, ensure transaction type matches
    if (activeTab === 'income') {
      data.transaction_type = 'income';
    } else if (activeTab === 'expense') {
      data.transaction_type = 'expense';
    } else if (newTransactionType) {
      data.transaction_type = newTransactionType;
    }
    
    try {
      if (selectedTransaction?.id) {
        await updateTransaction({ ...data, id: selectedTransaction.id });
      } else {
        await createTransaction(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao enviar transação:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete);
        setDeleteConfirmOpen(false);
        setTransactionToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const resetFilters = () => {
    const baseFilters = {
      startDate: undefined,
      endDate: undefined,
      category: undefined,
      propertyId: undefined,
      minAmount: undefined,
      maxAmount: undefined
    };

    // Set type filter based on active tab
    if (activeTab === 'income') {
      handleFilterChange({ ...baseFilters, type: ['income'] });
    } else if (activeTab === 'expense') {
      handleFilterChange({ ...baseFilters, type: ['expense'] });
    } else {
      handleFilterChange({ ...baseFilters, type: undefined });
    }
  };

  const handleViewReceipt = (transaction: any) => {
    if (transaction.receipt_url) {
      window.open(transaction.receipt_url, '_blank');
    }
  };

  // Calculate totals
  const incomeTotal = allTransactions
    .filter(tx => tx.transaction_type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const expenseTotal = allTransactions
    .filter(tx => tx.transaction_type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const balance = incomeTotal - expenseTotal;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'income':
        return 'Nova Receita';
      case 'expense':
        return 'Nova Despesa';
      default:
        return 'Nova Transação';
    }
  };

  return (
    <div className="container py-6">
      <PageHeader title="Transações Financeiras" description="Gerencie todas as suas transações financeiras">
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          {getTabTitle()}
        </Button>
      </PageHeader>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Total de Receitas</h3>
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Total de Despesas</h3>
          <p className="text-2xl font-bold text-red-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Saldo</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas as Transações</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Filtros</h2>
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
              categories={categoryOptions}
              properties={propertyOptions}
            />
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow border">
            <h2 className="text-lg font-medium p-4 border-b">Todas as Transações</h2>
            <TransactionTable 
              transactions={transactions}
              isLoading={isLoadingTransactions}
              onEdit={handleOpenModal}
              onDelete={handleDeleteClick}
              onViewReceipt={handleViewReceipt}
            />
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          {/* Income Summary */}
          <div className="bg-white rounded-lg shadow p-4 border mb-6">
            <h3 className="text-sm font-medium text-gray-500">Total de Receitas</h3>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal)}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Filtros</h2>
            <TransactionFilters
              filters={{...filters, type: ['income']}}
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
              categories={categoryOptions}
              properties={propertyOptions}
            />
          </div>

          {/* Income Table */}
          <div className="bg-white rounded-lg shadow border">
            <h2 className="text-lg font-medium p-4 border-b">Receitas</h2>
            <TransactionTable 
              transactions={transactions}
              isLoading={isLoadingTransactions}
              onEdit={handleOpenModal}
              onDelete={handleDeleteClick}
              onViewReceipt={handleViewReceipt}
            />
          </div>
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          {/* Expense Summary */}
          <div className="bg-white rounded-lg shadow p-4 border mb-6">
            <h3 className="text-sm font-medium text-gray-500">Total de Despesas</h3>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseTotal)}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Filtros</h2>
            <TransactionFilters
              filters={{...filters, type: ['expense']}}
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
              categories={categoryOptions}
              properties={propertyOptions}
            />
          </div>

          {/* Expense Table */}
          <div className="bg-white rounded-lg shadow border">
            <h2 className="text-lg font-medium p-4 border-b">Despesas</h2>
            <TransactionTable 
              transactions={transactions}
              isLoading={isLoadingTransactions}
              onEdit={handleOpenModal}
              onDelete={handleDeleteClick}
              onViewReceipt={handleViewReceipt}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedTransaction ? { 
          ...selectedTransaction,
          transaction_type: selectedTransaction.transaction_type 
        } : newTransactionType ? { 
          transaction_type: newTransactionType 
        } as any : undefined}
        isSubmitting={isCreating || isUpdating}
        properties={propertyOptions}
        categories={categoryOptions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              transação selecionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
