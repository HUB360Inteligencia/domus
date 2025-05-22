
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionTable } from '@/components/finances/transaction-table';
import { TransactionModal } from '@/components/finances/transaction-modal';
import { TransactionFilters } from '@/components/finances/transaction-filters';
import { CategoryManagement } from '@/components/finances/category-management';
import { useFinancialTransactions, TransactionFormData } from '@/hooks/use-financial-transactions';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useProperties } from '@/hooks/use-properties';

export default function FinancesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<(TransactionFormData & { id: string }) | null>(null);
  
  const { 
    transactions, 
    isLoadingTransactions, 
    createTransaction, 
    updateTransaction,
    isCreating,
    isUpdating,
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

  // Calculate totals
  const incomeTotal = transactions
    .filter(tx => tx.transaction_type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const expenseTotal = transactions
    .filter(tx => tx.transaction_type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  const balance = incomeTotal - expenseTotal;

  return (
    <div className="container py-6">
      <PageHeader title="Financial Management" description="Track and manage your income and expenses">
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </PageHeader>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Income</h3>
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Expenses</h3>
          <p className="text-2xl font-bold text-red-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border">
          <h3 className="text-sm font-medium text-gray-500">Balance</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Filters</h2>
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
            <h2 className="text-lg font-medium p-4 border-b">Transactions</h2>
            <TransactionTable 
              transactions={transactions}
              isLoading={isLoadingTransactions}
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
    </div>
  );
}
