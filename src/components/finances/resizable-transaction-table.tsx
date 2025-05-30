
import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnResizeMode,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Trash2, FileText } from 'lucide-react';
import { FinancialTransaction } from '@/hooks/use-financial-transactions';
import { Skeleton } from '@/components/ui/skeleton';

interface ResizableTransactionTableProps {
  transactions: FinancialTransaction[];
  isLoading: boolean;
  onEdit: (transaction: FinancialTransaction) => void;
  onDelete: (transaction: FinancialTransaction) => void;
  onViewReceipt: (transaction: FinancialTransaction) => void;
  onViewDetails: (transaction: FinancialTransaction) => void;
}

const columnHelper = createColumnHelper<FinancialTransaction>();

export const ResizableTransactionTable: React.FC<ResizableTransactionTableProps> = ({
  transactions,
  isLoading,
  onEdit,
  onDelete,
  onViewReceipt,
  onViewDetails
}) => {
  const [columnResizeMode] = useState<ColumnResizeMode>('onChange');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yy', { locale: ptBR });
  };

  const columns = [
    columnHelper.accessor('transaction_date', {
      header: 'Data',
      size: 80,
      minSize: 70,
      cell: info => (
        <span className="text-xs font-medium">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Descrição',
      size: 200,
      minSize: 150,
      cell: info => (
        <div className="max-w-[200px]">
          <div className="text-xs font-medium truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
          {info.row.original.property_title && (
            <div className="text-xs text-muted-foreground truncate">
              {info.row.original.property_title}
            </div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('transaction_type', {
      header: 'Tipo',
      size: 70,
      minSize: 60,
      cell: info => (
        <Badge 
          variant={info.getValue() === 'income' ? 'default' : 'destructive'}
          className="text-xs px-1 py-0 h-5"
        >
          {info.getValue() === 'income' ? 'Rec.' : 'Desp.'}
        </Badge>
      ),
    }),
    columnHelper.accessor('category_name', {
      header: 'Categoria',
      size: 120,
      minSize: 100,
      cell: info => (
        <span className="text-xs text-muted-foreground truncate block" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Valor',
      size: 100,
      minSize: 80,
      cell: info => (
        <span className={`text-xs font-semibold ${
          info.row.original.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(info.getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      size: 120,
      minSize: 100,
      cell: info => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails(info.row.original)}
            className="h-6 w-6 p-0"
            title="Ver detalhes"
          >
            <Eye className="h-3 w-3" />
          </Button>
          {info.row.original.receipt_url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewReceipt(info.row.original)}
              className="h-6 w-6 p-0"
              title="Ver comprovante"
            >
              <FileText className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(info.row.original)}
            className="h-6 w-6 p-0"
            title="Editar"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(info.row.original)}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            title="Excluir"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    enableColumnResizing: true,
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Transações</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Transações</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-center py-6 text-xs text-muted-foreground">
            Nenhuma transação encontrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Transações</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-auto">
          <table 
            className="w-full caption-bottom text-xs"
            style={{ width: table.getCenterTotalSize() }}
          >
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b h-8">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-2 text-left align-middle font-medium text-muted-foreground relative"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize select-none touch-none ${
                          header.column.getIsResizing() ? 'bg-blue-500' : ''
                        }`}
                      />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/50 h-10"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-2 align-middle" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
