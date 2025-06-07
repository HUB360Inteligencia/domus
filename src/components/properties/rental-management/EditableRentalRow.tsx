
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';

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

interface EditableRentalRowProps {
  item: RentalItem;
  categories: Array<{ value: string; label: string }>;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
}

export const EditableRentalRow: React.FC<EditableRentalRowProps> = ({
  item,
  categories,
  onUpdate,
  onRemove
}) => {
  const filteredCategories = categories.filter(cat => 
    (item.type === 'income' && cat.label.toLowerCase().includes('receita')) ||
    (item.type === 'expense' && cat.label.toLowerCase().includes('despesa'))
  );

  return (
    <tr className={`${item.type === 'income' ? 'bg-green-50' : 'bg-red-50'} border-b`}>
      <td className="p-2">
        <Input
          value={item.name}
          onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
          className="border-none bg-transparent text-sm"
          placeholder="Nome do item"
        />
      </td>
      <td className="p-2">
        <CurrencyInput
          value={item.amount}
          onValueChange={(value) => onUpdate(item.id, 'amount', value || 0)}
          className="border-none bg-transparent text-sm text-right"
        />
      </td>
      <td className="p-2">
        <Select
          value={item.categoryId}
          onValueChange={(value) => {
            const category = categories.find(c => c.value === value);
            onUpdate(item.id, 'categoryId', value);
            onUpdate(item.id, 'categoryName', category?.label || '');
          }}
        >
          <SelectTrigger className="border-none bg-transparent text-sm">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-2">
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          className="border-none bg-transparent text-sm"
          placeholder="Descrição"
        />
      </td>
      <td className="p-2">
        {item.isEditable !== false && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(item.id)}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </td>
    </tr>
  );
};
