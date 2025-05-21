
import { useState } from 'react';
import { format } from 'date-fns';
import { Edit2Icon, Trash2Icon, EyeIcon } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransactionForm } from './transaction-form';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialMutations } from '@/hooks/use-financial-transactions';
import { FinancialTransaction } from '@/types/financial';

interface TransactionListProps {
  transactions: FinancialTransaction[];
  isLoading?: boolean;
  propertyId?: string;
}

export const TransactionList = ({ 
  transactions, 
  isLoading, 
  propertyId 
}: TransactionListProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { properties } = useProperties();
  const { deleteTransaction } = useFinancialMutations();

  const handleDelete = async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction.mutateAsync(selectedTransaction.id);
        setIsDeleteDialogOpen(false);
        setSelectedTransaction(null);
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
      }
    }
  };

  const getPropertyTitle = (propertyId: string | null) => {
    if (!propertyId) return 'Geral';
    const property = properties?.find(p => p.id === propertyId);
    return property ? property.title : 'Imóvel desconhecido';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-center">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Data</TableHead>
              {!propertyId && <TableHead>Imóvel</TableHead>}
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(transaction => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                  {transaction.recurring && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      Recorrente
                    </Badge>
                  )}
                </TableCell>
                {!propertyId && (
                  <TableCell>{getPropertyTitle(transaction.property_id)}</TableCell>
                )}
                <TableCell>
                  <div className="font-medium">{transaction.category}</div>
                  {transaction.subcategory && (
                    <div className="text-xs text-muted-foreground">{transaction.subcategory}</div>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {transaction.description || '-'}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.transaction_type === 'income' ? '+' : '-'} 
                  {formatCurrency(Number(transaction.amount))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit2Icon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de detalhes */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Tipo:</div>
                <div className="col-span-3">
                  <Badge className={selectedTransaction.transaction_type === 'income' ? 'bg-green-600' : 'bg-red-600'}>
                    {selectedTransaction.transaction_type === 'income' ? 'Receita' : 'Despesa'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Data:</div>
                <div className="col-span-3">
                  {format(new Date(selectedTransaction.transaction_date), 'dd/MM/yyyy')}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Imóvel:</div>
                <div className="col-span-3">
                  {getPropertyTitle(selectedTransaction.property_id)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Categoria:</div>
                <div className="col-span-3">
                  {selectedTransaction.category}
                  {selectedTransaction.subcategory && ` / ${selectedTransaction.subcategory}`}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Valor:</div>
                <div className="col-span-3 font-semibold">
                  {formatCurrency(Number(selectedTransaction.amount))}
                </div>
              </div>
              {selectedTransaction.payment_method && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="font-medium">Método de Pagamento:</div>
                  <div className="col-span-3">
                    {selectedTransaction.payment_method}
                  </div>
                </div>
              )}
              {selectedTransaction.recurring && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="font-medium">Recorrência:</div>
                    <div className="col-span-3">
                      {selectedTransaction.recurring_frequency === 'monthly' && 'Mensal'}
                      {selectedTransaction.recurring_frequency === 'quarterly' && 'Trimestral'}
                      {selectedTransaction.recurring_frequency === 'semiannual' && 'Semestral'}
                      {selectedTransaction.recurring_frequency === 'annual' && 'Anual'}
                    </div>
                  </div>
                  {selectedTransaction.recurring_end_date && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Data Final:</div>
                      <div className="col-span-3">
                        {format(new Date(selectedTransaction.recurring_end_date), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedTransaction.description && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="font-medium">Descrição:</div>
                  <div className="col-span-3 whitespace-pre-wrap">
                    {selectedTransaction.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <TransactionForm 
              transaction={selectedTransaction} 
              onSuccess={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
