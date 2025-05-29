
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Eye } from 'lucide-react';
import { useRentalHistory } from '@/hooks/use-rental-history';
import { RentalItemsViewer } from './RentalItemsViewer';
import { Skeleton } from '@/components/ui/skeleton';

interface RentalHistoryTableProps {
  propertyId: string;
}

export const RentalHistoryTable: React.FC<RentalHistoryTableProps> = ({
  propertyId
}) => {
  const { rentalHistory, isLoading } = useRentalHistory(propertyId);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<typeof rentalHistory[0] | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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
    <>
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
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentalHistory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.monthYear}
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
                  <TableCell className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {item.individualItems.length} item{item.individualItems.length !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(item)}
                      className="h-8 w-8 p-0"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </>
  );
};
