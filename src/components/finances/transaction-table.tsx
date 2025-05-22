
import React from 'react';
import { format } from 'date-fns';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface FinancialTransaction {
  id: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  subcategory?: string | null;
  description?: string | null;
  transaction_date: string;
  property_id?: string | null;
  property_title?: string;
}

interface TransactionTableProps {
  transactions: FinancialTransaction[];
  isLoading?: boolean;
}

export function TransactionTable({ transactions, isLoading = false }: TransactionTableProps) {
  if (isLoading) {
    return <div className="flex justify-center p-6">Loading transactions...</div>;
  }

  if (!transactions || transactions.length === 0) {
    return <div className="text-center p-6 text-muted-foreground">No transactions found</div>;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Property</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {transaction.transaction_type === 'income' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3" />
                      Income
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                      <ArrowDownCircle className="w-3 h-3" />
                      Expense
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {transaction.category}
                {transaction.subcategory && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({transaction.subcategory})
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {transaction.description || '-'}
              </TableCell>
              <TableCell>{transaction.property_title || '-'}</TableCell>
              <TableCell className={`text-right font-medium ${
                transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.transaction_type === 'income' ? '+' : '-'} 
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(Math.abs(transaction.amount))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
