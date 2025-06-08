
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  categories: Array<{ value: string; label: string; type: string }>;
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const EditableRentalRow: React.FC<EditableRentalRowProps> = React.memo(({
  item,
  categories,
  onUpdate,
  onRemove
}) => {
  // Local state for inputs to prevent re-render issues
  const [localName, setLocalName] = useState(item.name);
  const [localAmount, setLocalAmount] = useState(item.amount);
  const [localDescription, setLocalDescription] = useState(item.description);

  // Debounced values
  const debouncedName = useDebounce(localName, 300);
  const debouncedAmount = useDebounce(localAmount, 300);
  const debouncedDescription = useDebounce(localDescription, 300);

  // Update parent when debounced values change
  useEffect(() => {
    if (debouncedName !== item.name) {
      onUpdate(item.id, 'name', debouncedName);
    }
  }, [debouncedName, item.id, item.name, onUpdate]);

  useEffect(() => {
    if (debouncedAmount !== item.amount) {
      onUpdate(item.id, 'amount', debouncedAmount);
    }
  }, [debouncedAmount, item.id, item.amount, onUpdate]);

  useEffect(() => {
    if (debouncedDescription !== item.description) {
      onUpdate(item.id, 'description', debouncedDescription);
    }
  }, [debouncedDescription, item.id, item.description, onUpdate]);

  // Sync local state when item changes externally
  useEffect(() => {
    setLocalName(item.name);
  }, [item.name]);

  useEffect(() => {
    setLocalAmount(item.amount);
  }, [item.amount]);

  useEffect(() => {
    setLocalDescription(item.description);
  }, [item.description]);

  // Memoized filtered categories to prevent unnecessary re-renders
  const filteredCategories = useMemo(() => 
    categories.filter(cat => cat.type === item.type),
    [categories, item.type]
  );

  // Memoized callback functions
  const handleCategoryChange = useCallback((value: string) => {
    const category = categories.find(c => c.value === value);
    onUpdate(item.id, 'categoryId', value);
    onUpdate(item.id, 'categoryName', category?.label || '');
  }, [categories, item.id, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(item.id);
  }, [item.id, onRemove]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalDescription(e.target.value);
  }, []);

  const handleAmountChange = useCallback((value: number | undefined) => {
    setLocalAmount(value || 0);
  }, []);

  return (
    <tr className={`${item.type === 'income' ? 'bg-green-50' : 'bg-red-50'} border-b`}>
      <td className="p-2">
        <Input
          value={localName}
          onChange={handleNameChange}
          className="border-none bg-transparent text-sm"
          placeholder="Nome do item"
        />
      </td>
      <td className="p-2">
        <CurrencyInput
          value={localAmount}
          onValueChange={handleAmountChange}
          className="border-none bg-transparent text-sm text-right"
        />
      </td>
      <td className="p-2">
        <Select
          value={item.categoryId}
          onValueChange={handleCategoryChange}
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
          value={localDescription}
          onChange={handleDescriptionChange}
          className="border-none bg-transparent text-sm"
          placeholder="Descrição"
        />
      </td>
      <td className="p-2">
        {item.isEditable !== false && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </td>
    </tr>
  );
});

EditableRentalRow.displayName = 'EditableRentalRow';
