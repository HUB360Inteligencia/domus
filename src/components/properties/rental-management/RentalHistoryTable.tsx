
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, BarChart3 } from 'lucide-react';
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
                <TableHead className="text-center text-xs w-16">Ações</TableHead>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(item)}
                      className="h-7 w-7 p-0"
                      title="Ver extrato detalhado"
                    >
                      <BarChart3 className="h-3 w-3" />
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
