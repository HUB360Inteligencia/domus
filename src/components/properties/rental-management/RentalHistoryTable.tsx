
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart3, Edit, Trash2 } from 'lucide-react';
import { useRentalHistory } from '@/hooks/use-rental-history';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { RentalItemsViewer } from './RentalItemsViewer';
import { EditRentalModal } from './EditRentalModal';
import { DeleteTransactionModal } from '@/components/finances/delete-transaction-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface RentalHistoryTableProps {
  propertyId: string;
}

export const RentalHistoryTable: React.FC<RentalHistoryTableProps> = ({
  propertyId
}) => {
  const { rentalHistory, isLoading, refetch } = useRentalHistory(propertyId);
  const { deleteTransaction, isDeleting } = useFinancialTransactions();
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<typeof rentalHistory[0] | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [editingHistoryItem, setEditingHistoryItem] = useState<typeof rentalHistory[0] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<typeof rentalHistory[0] | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleViewDetails = (item: typeof rentalHistory[0]) => {
    setSelectedHistoryItem(item);
    setIsViewerOpen(true);
  };

  const handleEdit = (item: typeof rentalHistory[0]) => {
    setEditingHistoryItem(item);
    setIsEditModalOpen(true);
  };

  const handleEditSave = () => {
    refetch();
    setIsEditModalOpen(false);
    setEditingHistoryItem(null);
  };

  const handleDelete = (item: typeof rentalHistory[0]) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem?.transactionId) {
      toast.error('ID da transação não encontrado');
      return;
    }

    try {
      await deleteTransaction(deletingItem.transactionId);
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      refetch();
    } catch (error) {
      console.error('Erro ao deletar histórico de aluguel:', error);
      toast.error('Erro ao deletar histórico de aluguel');
    }
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Histórico de Aluguéis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rentalHistory.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Histórico de Aluguéis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-center py-6 text-sm">
            Nenhum registro de gestão de aluguéis encontrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Histórico de Aluguéis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="text-xs">Período</TableHead>
                <TableHead className="text-right text-xs">Receitas</TableHead>
                <TableHead className="text-right text-xs">Despesas</TableHead>
                <TableHead className="text-right text-xs">Saldo</TableHead>
                <TableHead className="text-center text-xs">Itens</TableHead>
                <TableHead className="text-center text-xs w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentalHistory.map((item, index) => (
                <TableRow key={index} className="h-10">
                  <TableCell className="font-medium text-sm">
                    {item.monthYear}
                  </TableCell>
                  <TableCell className="text-right text-green-600 text-sm">
                    {item.totalIncome > 0 ? formatCurrency(item.totalIncome) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-600 text-sm">
                    {item.totalExpense > 0 ? formatCurrency(item.totalExpense) : '-'}
                  </TableCell>
                  <TableCell className={`text-right font-medium text-sm ${
                    item.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(item.balance)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-muted-foreground">
                      {item.individualItems.length} item{item.individualItems.length !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(item)}
                        className="h-7 w-7 p-0"
                        title="Ver extrato detalhado"
                      >
                        <BarChart3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="h-7 w-7 p-0"
                        title="Editar aluguel"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Excluir histórico"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Viewer Modal */}
      {selectedHistoryItem && (
        <RentalItemsViewer
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedHistoryItem(null);
          }}
          items={selectedHistoryItem.individualItems}
          monthYear={selectedHistoryItem.monthYear}
        />
      )}

      {/* Edit Modal */}
      {editingHistoryItem && (
        <EditRentalModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingHistoryItem(null);
          }}
          rentalData={editingHistoryItem}
          propertyTitle="Propriedade"
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={confirmDelete}
        transactionName={`Gestão de Aluguéis - ${deletingItem?.monthYear || ''}`}
        isDeleting={isDeleting}
      />
    </>
  );
};
