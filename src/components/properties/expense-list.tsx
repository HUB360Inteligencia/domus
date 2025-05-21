import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Edit, FileText, Loader2, MoreHorizontal, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PropertyExpense } from '@/types/property-expense';

interface ExpenseListProps {
  expenses: PropertyExpense[];
  isLoading: boolean;
  onAddClick: () => void;
  onEditClick: (expense: PropertyExpense) => void;
  onDeleteClick: (id: string) => void;
  onUploadReceiptClick: (expense: PropertyExpense) => void;
  isDeleting: boolean;
}

const expenseTypeMap: Record<string, string> = {
  'maintenance': 'Manutenção',
  'condo_fee': 'Taxa de Condomínio',
  'tax': 'Imposto/Taxa',
  'inspection': 'Vistoria',
  'renovation': 'Reforma',
  'insurance': 'Seguro',
  'other': 'Outro'
};

export function ExpenseList({
  expenses,
  isLoading,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onUploadReceiptClick,
  isDeleting
}: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<PropertyExpense | null>(null);

  // Filter expenses based on search term and type filter
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          expense.maintenance_details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === '' || expense.expense_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const confirmDelete = (expense: PropertyExpense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (expenseToDelete) {
      onDeleteClick(expenseToDelete.id);
    }
    setDeleteDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando despesas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Despesas</h3>
        <Button onClick={onAddClick} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Adicionar Despesa
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar despesas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Tipo de Despesa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os tipos</SelectItem>
            {Object.entries(expenseTypeMap).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredExpenses.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {format(new Date(expense.paid_at), 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {expenseTypeMap[expense.expense_type] || expense.expense_type}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {expense.description || (
                      expense.expense_type === 'maintenance' ? 
                      expense.maintenance_details : 
                      <span className="text-muted-foreground italic">Sem descrição</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(expense.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditClick(expense)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUploadReceiptClick(expense)}>
                          <Receipt className="h-4 w-4 mr-2" />
                          {expense.receipt_url ? 'Ver/Alterar Comprovante' : 'Adicionar Comprovante'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmDelete(expense)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 border rounded-md bg-muted/30">
          <FileText className="h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">Nenhuma despesa encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm || typeFilter ? 
              'Tente ajustar os filtros de busca.' : 
              'Cadastre sua primeira despesa para este imóvel.'}
          </p>
          {!searchTerm && !typeFilter && (
            <Button onClick={onAddClick} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
          )}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
