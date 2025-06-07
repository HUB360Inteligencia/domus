
import React from 'react';
import { EditableRentalRow } from './EditableRentalRow';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface RentalItem {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  type: 'income' | 'expense';
  isEditable?: boolean;
}

interface RentalStatementTableProps {
  items: RentalItem[];
  categories: Array<{ value: string; label: string; type: string }>;
  onUpdateItem: (id: string, field: string, value: any) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (type: 'income' | 'expense') => void;
}

export const RentalStatementTable: React.FC<RentalStatementTableProps> = ({
  items,
  categories,
  onUpdateItem,
  onRemoveItem,
  onAddItem
}) => {
  const incomeItems = items.filter(item => item.type === 'income');
  const expenseItems = items.filter(item => item.type === 'expense');
  
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const TableSection = ({ 
    title, 
    items, 
    type, 
    bgColor 
  }: { 
    title: string; 
    items: RentalItem[]; 
    type: 'income' | 'expense';
    bgColor: string;
  }) => (
    <div className="mb-4">
      <div className={`${bgColor} p-3 rounded-t-lg`}>
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-white">{title}</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddItem(type)}
            className="text-white hover:bg-white/20 h-6 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
      
      <div className="border border-t-0 rounded-b-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 text-xs font-medium text-gray-600">Nome</th>
              <th className="text-right p-2 text-xs font-medium text-gray-600">Valor</th>
              <th className="text-left p-2 text-xs font-medium text-gray-600">Categoria</th>
              <th className="text-left p-2 text-xs font-medium text-gray-600">Descrição</th>
              <th className="w-10 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <EditableRentalRow
                key={item.id}
                item={item}
                categories={categories}
                onUpdate={onUpdateItem}
                onRemove={onRemoveItem}
              />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500 text-sm">
                  Nenhum item adicionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <TableSection
        title="RECEITAS"
        items={incomeItems}
        type="income"
        bgColor="bg-green-600"
      />
      
      <TableSection
        title="DESPESAS"
        items={expenseItems}
        type="expense"
        bgColor="bg-red-600"
      />

      {/* Resumo */}
      <div className="bg-gray-900 rounded-lg p-4 text-white">
        <h4 className="font-medium mb-3">RESUMO</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total de Receitas:</span>
            <span className="text-green-400 font-medium">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total de Despesas:</span>
            <span className="text-red-400 font-medium">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Saldo Líquido:</span>
              <span className={balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatCurrency(Math.abs(balance))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
