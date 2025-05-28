
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import { useRentalHistory } from '@/hooks/use-rental-history';
import { Skeleton } from '@/components/ui/skeleton';

interface RentalHistoryTableProps {
  propertyId: string;
}

export const RentalHistoryTable: React.FC<RentalHistoryTableProps> = ({
  propertyId
}) => {
  const { rentalHistory, isLoading } = useRentalHistory(propertyId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Aluguéis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rentalHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Aluguéis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum registro de gestão de aluguéis encontrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico de Aluguéis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês/Ano</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Receitas</TableHead>
              <TableHead className="text-right">Despesas</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentalHistory.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {item.monthYear}
                </TableCell>
                <TableCell className="max-w-xs truncate" title={item.description}>
                  {item.description}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {item.totalIncome > 0 ? formatCurrency(item.totalIncome) : '-'}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {item.totalExpense > 0 ? formatCurrency(item.totalExpense) : '-'}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  item.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(item.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
