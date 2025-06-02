
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, X } from 'lucide-react';
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
  id?: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  categoryName: string;
}

interface RentalHistoryItem {
  monthYear: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  individualItems: RentalItem[];
  transactionId?: string;
}

interface EditRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalData: RentalHistoryItem | null;
  propertyTitle: string;
  onSave: () => void;
}

export const EditRentalModal: React.FC<EditRentalModalProps> = ({
  isOpen,
  onClose,
  rentalData,
  propertyTitle,
  onSave
}) => {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for adding new items
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemType, setNewItemType] = useState<'income' | 'expense'>('income');
  const [newItemCategory, setNewItemCategory] = useState('');

  const { categories } = useFinancialCategories();
  const { updateTransaction } = useFinancialTransactions();

  useEffect(() => {
    if (rentalData) {
      setItems(rentalData.individualItems || []);
    }
  }, [rentalData]);

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const totalIncome = items.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = items.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const addNewItem = () => {
    if (!newItemName || !newItemAmount || !newItemCategory) {
      toast.error('Preencha todos os campos');
      return;
    }

    const categoryList = newItemType === 'income' ? incomeCategories : expenseCategories;
    const category = categoryList.find(c => c.id === newItemCategory);

    const newItem: RentalItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName,
      amount: parseFloat(newItemAmount),
      type: newItemType,
      categoryName: category?.name || 'Categoria não encontrada'
    };

    setItems(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemCategory('');
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemAmount = (index: number, newAmount: string) => {
    const amount = parseFloat(newAmount) || 0;
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, amount } : item
    ));
  };

  const handleSave = async () => {
    if (!rentalData?.transactionId) {
      toast.error('ID da transação não encontrado');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedRentalDetails = {
        items: items.map(item => ({
          name: item.name,
          amount: item.amount,
          type: item.type,
          categoryName: item.categoryName
        })),
        summary: `Gestão de Aluguéis - ${propertyTitle} (${rentalData.monthYear})`,
        totalIncome,
        totalExpense,
        balance
      };

      await updateTransaction({
        id: rentalData.transactionId,
        name: `Gestão de Aluguéis - ${rentalData.monthYear}`,
        amount: Math.abs(balance),
        transaction_type: balance >= 0 ? 'income' : 'expense',
        description: JSON.stringify(updatedRentalDetails),
      });

      toast.success('Gestão de aluguéis atualizada com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar gestão de aluguéis:', error);
      toast.error('Erro ao atualizar gestão de aluguéis');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rentalData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Editar Gestão de Aluguéis - {propertyTitle} ({rentalData.monthYear})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de itens existentes */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Itens do Período:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded border ${
                  item.type === 'income' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.categoryName}</div>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateItemAmount(index, e.target.value)}
                    className="w-24 h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 p-0 text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar novo item */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Adicionar Novo Item</h4>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <Input
                placeholder="Nome"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="h-8 text-xs"
              />
              <Select value={newItemType} onValueChange={(value: 'income' | 'expense') => setNewItemType(value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(newItemType === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={addNewItem}
                className="h-8 text-xs"
                disabled={!newItemName || !newItemAmount || !newItemCategory}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Resumo atualizado */}
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
            disabled={isSubmitting}
            className="h-8 text-xs"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
