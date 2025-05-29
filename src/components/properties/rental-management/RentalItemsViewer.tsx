
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RentalItem } from '@/hooks/use-rental-history';

interface RentalItemsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  items: RentalItem[];
  monthYear: string;
}

export const RentalItemsViewer: React.FC<RentalItemsViewerProps> = ({
  isOpen,
  onClose,
  items,
  monthYear
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const incomeItems = items.filter(item => item.type === 'income');
  const expenseItems = items.filter(item => item.type === 'expense');

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes - {monthYear}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Receitas</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Despesas</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(totalExpense)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Saldo</div>
              <div className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </div>
            </div>
          </div>

          {/* Receitas */}
          {incomeItems.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-green-700 mb-3">
                Receitas ({incomeItems.length})
              </h4>
              <div className="space-y-2">
                {incomeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-2">{item.categoryName}</Badge>
                        {item.description && <span>{item.description}</span>}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incomeItems.length > 0 && expenseItems.length > 0 && <Separator />}

          {/* Despesas */}
          {expenseItems.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-red-700 mb-3">
                Despesas ({expenseItems.length})
              </h4>
              <div className="space-y-2">
                {expenseItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-2">{item.categoryName}</Badge>
                        {item.description && <span>{item.description}</span>}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-red-600">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incomeItems.length === 0 && expenseItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item encontrado para este período.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
