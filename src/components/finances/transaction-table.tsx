
import React from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, getSortedRowModel, SortingState } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Edit, Trash2, Receipt, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FinancialTransaction } from '@/hooks/use-financial-transactions';

interface TransactionTableProps {
  transactions: FinancialTransaction[];
  isLoading: boolean;
  onEdit?: (transaction: FinancialTransaction) => void;
  onDelete?: (transaction: FinancialTransaction) => void;
  onViewReceipt?: (transaction: FinancialTransaction) => void;
}

export function TransactionTable({ 
  transactions, 
  isLoading,
  onEdit,
  onDelete,
  onViewReceipt
}: TransactionTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const columnHelper = createColumnHelper<FinancialTransaction>();

  const columns = [
    columnHelper.accessor('transaction_date', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy'),
    }),
    columnHelper.accessor('name', {
      header: 'Nome',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('description', {
      header: 'Descrição',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('category_name', {
      header: 'Categoria',
      cell: info => info.getValue() || 'Sem categoria',
    }),
    columnHelper.accessor('property_title', {
      header: 'Propriedade',
      cell: info => info.getValue() || 'Nenhuma',
    }),
    columnHelper.accessor('transaction_type', {
      header: 'Tipo',
      cell: info => (
        <span className={`font-medium ${info.getValue() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {info.getValue() === 'income' ? 'Receita' : 'Despesa'}
        </span>
      ),
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: info => (
        <span className={`font-medium ${info.row.original.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(info.getValue()))}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: info => (
        <div className="flex items-center space-x-1">
          {info.row.original.receipt_url && onViewReceipt && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => onViewReceipt(info.row.original)}>
                    <Receipt className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver Comprovante</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onEdit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(info.row.original)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar Transação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onDelete && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(info.row.original)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Excluir Transação</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Carregando transações...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Nenhuma transação encontrada.</p>
        <p className="text-sm mt-2">Adicione uma nova transação para começar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="text-left p-4 font-medium text-muted-foreground text-sm">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr 
              key={row.id}
              className="border-b hover:bg-muted/20 transition-colors"
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="p-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
