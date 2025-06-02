
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, X } from 'lucide-react';
import { MonthlyTransactionForm } from './MonthlyTransactionForm';
import { TransactionSummary } from './TransactionSummary';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RentalItem {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  categoryName: string;
}

interface RentalManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
  };
  onSuccess?: () => void;
}

export const RentalManagementModal: React.FC<RentalManagementModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-based month
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [items, setItems] = useState<RentalItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories, categoryOptions } = useFinancialCategories();
  const { createTransaction } = useFinancialTransactions();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setItems([]);
      setSelectedMonth(currentDate.getMonth());
      setSelectedYear(currentDate.getFullYear());
    }
  }, [isOpen]);

  const addItem = (item: Omit<RentalItem, 'id'>) => {
    const newItem: RentalItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updatedItem: Partial<RentalItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ));
  };

  const totalIncome = items.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = items.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item antes de salvar');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the correct date for the selected month/year (first day of the month)
      const transactionDate = new Date(selectedYear, selectedMonth, 1);
      const formattedDate = transactionDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      const rentalDetails = {
        items: items.map(item => ({
          name: item.name,
          amount: item.amount,
          type: item.type,
          categoryName: item.categoryName
        })),
        summary: `Gestão de Aluguéis - ${property.title} (${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear})`,
        totalIncome,
        totalExpense,
        balance
      };

      // Find a default category
      const defaultCategory = categories.find(c => c.type === (balance >= 0 ? 'income' : 'expense'));

      await createTransaction({
        name: `Gestão de Aluguéis - ${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`,
        amount: Math.abs(balance),
        transaction_type: balance >= 0 ? 'income' : 'expense',
        category: defaultCategory?.id || categoryOptions[0]?.value || '',
        subcategory: 'rental-management',
        description: JSON.stringify(rentalDetails),
        transaction_date: formattedDate,
        property_id: property.id,
        payment_method: null,
        recurring: false,
        recurring_frequency: null,
        recurring_end_date: null,
        receipt_url: null,
      });

      toast.success('Gestão de aluguéis salva com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar gestão de aluguéis:', error);
      toast.error('Erro ao salvar gestão de aluguéis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Gestão de Aluguéis - {property.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month/Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Form */}
          <MonthlyTransactionForm
            categories={categories}
            onAddItem={addItem}
          />

          {/* Items List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Itens Adicionados:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded border ${
                  item.type === 'income' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.categoryName}</div>
                  </div>
                  <div className="text-sm font-medium">
                    R$ {item.amount.toFixed(2)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 p-0 text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <TransactionSummary
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-8 text-xs">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || items.length === 0}
            className="h-8 text-xs"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Gestão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
