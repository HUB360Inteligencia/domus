
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableTransactionTable } from '@/components/finances/resizable-transaction-table';
import { TransactionModal } from '@/components/finances/transaction-modal';
import { TransactionViewer } from '@/components/finances/transaction-viewer';
import { TransactionFilters } from '@/components/finances/transaction-filters';
import { CategoryManagement } from '@/components/finances/category-management';
import { useFinancialTransactions, TransactionFormData, FinancialTransaction } from '@/hooks/use-financial-transactions';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useProperties } from '@/hooks/use-properties';
import { DeleteTransactionModal } from '@/components/finances/delete-transaction-modal';
import { useIsMobile } from '@/hooks/use-mobile';

export default function FinancesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<(TransactionFormData & { id: string }) | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [transactionToView, setTransactionToView] = useState<FinancialTransaction | null>(null);
  const isMobile = useIsMobile();
  
  const { 
    transactions, 
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

  const handleOpenModal = (transaction?: any) => {
    if (transaction) {
      setSelectedTransaction(transaction);
    } else {
      setSelectedTransaction(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      if (selectedTransaction?.id) {
        await updateTransaction({ ...data, id: selectedTransaction.id });
      } else {
        await createTransaction(data);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  };

  const handleDeleteClick = (transaction: FinancialTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleViewDetails = (transaction: FinancialTransaction) => {
    setTransactionToView(transaction);
    setViewerOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete.id);
        setDeleteModalOpen(false);
        setTransactionToDelete(null);
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const resetFilters = () => {
    handleFilterChange({
      startDate: undefined,
      endDate: undefined,
      type: undefined,
      category: undefined,
      propertyId: undefined,
      minAmount: undefined,
      maxAmount: undefined
    });
  };

  const handleViewReceipt = (transaction: any) => {
    if (transaction.receipt_url) {
      window.open(transaction.receipt_url, '_blank');
    }
  };

  // Calculate totals
  const incomeTotal = transactions
    .filter(tx => tx.transaction_type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const expenseTotal = transactions
    .filter(tx => tx.transaction_type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const balance = incomeTotal - expenseTotal;

  return (
    <div className="container py-4">
      <PageHeader title="Gestão Financeira" description="Controle suas receitas e despesas">
        <Button onClick={() => handleOpenModal()} className="h-8 text-xs">
          <Plus className="mr-2 h-3 w-3" />
          Adicionar Transação
        </Button>
      </PageHeader>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-3 border">
          <h3 className="text-xs font-medium text-gray-500">Receitas</h3>
          <p className="text-lg font-bold text-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border">
          <h3 className="text-xs font-medium text-gray-500">Despesas</h3>
          <p className="text-lg font-bold text-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseTotal)}
          </p>
        </div>
        <div className="bg-black rounded-lg shadow-sm p-3 border">
          <h3 className="text-xs font-medium text-white">Saldo</h3>
          <p className="text-lg font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-3">
        <TabsList>
          <TabsTrigger value="transactions" className="text-xs">Transações</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-3">
          {/* Filters */}
          <div className="mb-4">
            <h2 className="text-sm font-medium mb-2">Filtros</h2>
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
              categories={categoryOptions}
              properties={propertyOptions}
            />
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <ResizableTransactionTable 
              transactions={transactions}
              isLoading={isLoadingTransactions}
              onEdit={handleOpenModal}
              onDelete={handleDeleteClick}
              onViewReceipt={handleViewReceipt}
              onViewDetails={handleViewDetails}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>
      </Tabs>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedTransaction || undefined}
        isSubmitting={isCreating || isUpdating}
        properties={propertyOptions}
        categories={categoryOptions}
      />

      {/* Transaction Viewer */}
      <TransactionViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setTransactionToView(null);
        }}
        transaction={transactionToView}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        transactionName={transactionToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
