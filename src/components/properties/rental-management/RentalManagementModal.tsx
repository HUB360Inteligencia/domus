
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { RentalStatementTable } from './RentalStatementTable';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { usePropertyActiveContract } from '@/hooks/use-property-active-contract';
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
  description: string;
  isEditable?: boolean;
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
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [items, setItems] = useState<RentalItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories, categoryOptions } = useFinancialCategories();
  const { createTransaction } = useFinancialTransactions();
  const { activeContract } = usePropertyActiveContract(property.id);

  // Reset form when modal opens and load contract data
  useEffect(() => {
    if (isOpen) {
      setItems([]);
      setSelectedMonth(currentDate.getMonth());
      setSelectedYear(currentDate.getFullYear());
      
      // Load contract data after categories are loaded
      if (activeContract && categories.length > 0) {
        loadContractData();
      }
    }
  }, [isOpen, activeContract, categories]);

  const loadContractData = () => {
    const newItems: RentalItem[] = [];
    
    // Find appropriate categories
    const incomeCategory = categories.find(c => c.type === 'income') || categoryOptions.find(c => c.label.toLowerCase().includes('receita'));
    const expenseCategory = categories.find(c => c.type === 'expense') || categoryOptions.find(c => c.label.toLowerCase().includes('despesa'));

    // Add rent income
    if (activeContract.value && incomeCategory) {
      newItems.push({
        id: 'rent-income',
        name: 'Aluguel',
        amount: activeContract.value,
        type: 'income',
        categoryId: incomeCategory.id || incomeCategory.value,
        categoryName: incomeCategory.name || incomeCategory.label,
        description: 'Valor do aluguel conforme contrato',
        isEditable: true
      });
    }

    // Add IPTU expense
    if (expenseCategory) {
      newItems.push({
        id: 'iptu-expense',
        name: 'IPTU',
        amount: 0,
        type: 'expense',
        categoryId: expenseCategory.id || expenseCategory.value,
        categoryName: expenseCategory.name || expenseCategory.label,
        description: 'Imposto Predial e Territorial Urbano',
        isEditable: true
      });
    }

    // Add commission expense
    if (activeContract.commission_value && activeContract.commission_type && expenseCategory) {
      let commissionAmount = 0;
      
      if (activeContract.commission_type === 'percentage') {
        commissionAmount = (activeContract.value * activeContract.commission_value) / 100;
      } else {
        commissionAmount = activeContract.commission_value;
      }

      newItems.push({
        id: 'commission-expense',
        name: 'Taxa de Comissão',
        amount: commissionAmount,
        type: 'expense',
        categoryId: expenseCategory.id || expenseCategory.value,
        categoryName: expenseCategory.name || expenseCategory.label,
        description: `Comissão ${activeContract.commission_type === 'percentage' ? `${activeContract.commission_value}%` : 'valor fixo'} conforme contrato`,
        isEditable: true
      });
    }

    setItems(newItems);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addItem = (type: 'income' | 'expense') => {
    const defaultCategory = categories.find(c => c.type === type) || 
                           categoryOptions.find(c => 
                             type === 'income' 
                               ? c.label.toLowerCase().includes('receita')
                               : c.label.toLowerCase().includes('despesa')
                           );

    const newItem: RentalItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      amount: 0,
      type,
      categoryId: defaultCategory?.id || defaultCategory?.value || '',
      categoryName: defaultCategory?.name || defaultCategory?.label || '',
      description: '',
      isEditable: true
    };
    
    setItems(prev => [...prev, newItem]);
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
      const transactionDate = new Date(selectedYear, selectedMonth, 1);
      const formattedDate = transactionDate.toISOString().split('T')[0];

      const rentalDetails = {
        items: items.map(item => ({
          name: item.name,
          amount: item.amount,
          type: item.type,
          categoryName: item.categoryName,
          description: item.description
        })),
        summary: `Gestão de Aluguéis - ${property.title} (${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear})`,
        totalIncome,
        totalExpense,
        balance
      };

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
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

          {/* Rental Statement Table */}
          <RentalStatementTable
            items={items}
            categories={categoryOptions}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onAddItem={addItem}
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
