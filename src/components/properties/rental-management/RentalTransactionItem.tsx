
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface MonthlyTransaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryName: string;
  description?: string;
}

interface RentalTransactionItemProps {
  transaction: MonthlyTransaction;
  onRemove: (id: string) => void;
}

export const RentalTransactionItem: React.FC<RentalTransactionItemProps> = ({
  transaction,
  onRemove
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const typeColor = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  const borderColor = transaction.type === 'income' ? 'border-l-green-500' : 'border-l-red-500';

  return (
    <Card className={`border-l-4 ${borderColor} hover:shadow-md transition-shadow`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{transaction.name}</h4>
              <p className={`font-bold ${typeColor}`}>
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-muted-foreground">
                {transaction.categoryName}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(transaction.id)}
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {transaction.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
