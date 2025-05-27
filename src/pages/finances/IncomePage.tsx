
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { TransactionTable } from '@/components/finances/transaction-table';
import { TransactionModal } from '@/components/finances/transaction-modal';
import { TransactionFilters } from '@/components/finances/transaction-filters';
import { useFinancialTransactions, TransactionFormData, FinancialTransaction } from '@/hooks/use-financial-transactions';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useProperties } from '@/hooks/use-properties';
import { DeleteTransactionModal } from '@/components/finances/delete-transaction-modal';

export default function IncomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<(TransactionFormData & { id: string }) | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);
  
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

  // Filtrar apenas receitas
  const transactions = allTransactions.filter(tx => tx.transaction_type === 'income');
  
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
      // Pré-configura para receita quando criar novo
      setSelectedTransaction({ ...transaction, transaction_type: 'income' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleSubmit = async (data: TransactionFormData) => {
    // Garante que é sempre uma receita
    data.transaction_type = 'income';
    
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

  const handleDeleteClick = (transaction: FinancialTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete.id);
        setDeleteModalOpen(false);
        setTransactionToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
      }
    }
  };

  const resetFilters = () => {
    handleFilterChange({
      startDate: undefined,
      endDate: undefined,
      type: ['income'], // Mantém filtro por receitas
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

  // Calcular total
  const incomeTotal = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <div className="container py-6">
      <PageHeader title="Gestão de Receitas" description="Controle e análise de todas as suas receitas">
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Receita
        </Button>
      </PageHeader>

      {/* Resumo */}
      <div className="bg-white rounded-lg shadow p-4 border mb-6">
        <h3 className="text-sm font-medium text-gray-500">Total de Receitas</h3>
        <p className="text-2xl font-bold text-green-600">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal)}
        </p>
      </div>

      {/* Filtros */}
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

      {/* Tabela de Transações */}
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

      {/* Modal de Transação */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedTransaction || undefined}
        isSubmitting={isCreating || isUpdating}
        properties={propertyOptions}
        categories={categoryOptions}
      />

      {/* Modal de Confirmação de Exclusão */}
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
