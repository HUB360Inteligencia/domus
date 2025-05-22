import React from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Edit, Trash2, Receipt } from 'lucide-react';
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
  onDelete?: (id: string) => void;
  onViewReceipt?: (transaction: FinancialTransaction) => void;
}

export function TransactionTable({ 
  transactions, 
  isLoading,
  onEdit,
  onDelete,
  onViewReceipt
}: TransactionTableProps) {
  const columnHelper = createColumnHelper<FinancialTransaction>();

  const columns = [
    columnHelper.accessor('transaction_date', {
      header: 'Date',
      cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy'),
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('transaction_type', {
      header: 'Type',
      cell: info => (
        <span className={`font-medium ${info.getValue() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {info.getValue() === 'income' ? 'Income' : 'Expense'}
        </span>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: info => (
        <span className={`font-medium ${info.row.original.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(info.getValue()))}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
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
                  <p>View Receipt</p>
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
                  <p>Edit Transaction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onDelete && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(info.row.original.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Transaction</p>
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
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No transactions found.</p>
        <p className="text-sm mt-2">Add a new transaction to get started.</p>
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
