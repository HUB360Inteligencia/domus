
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

interface MonthlyTransaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryName: string;
}

interface RentalManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

const months = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

export const RentalManagementModal: React.FC<RentalManagementModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState<MonthlyTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for quick entry
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');

  const { categories } = useFinancialCategories();
  const { createTransaction } = useFinancialTransactions();

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const addIncome = () => {
    if (!incomeName || !incomeAmount || !incomeCategory) return;
    
    const category = incomeCategories.find(c => c.id === incomeCategory);
    const newTransaction: MonthlyTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      name: incomeName,
      amount: parseFloat(incomeAmount),
      type: 'income',
      category: incomeCategory,
      categoryName: category?.name || 'Categoria não encontrada'
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    setIncomeName('');
    setIncomeAmount('');
    setIncomeCategory('');
  };

  const addExpense = () => {
    if (!expenseName || !expenseAmount || !expenseCategory) return;
    
    const category = expenseCategories.find(c => c.id === expenseCategory);
    const newTransaction: MonthlyTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      name: expenseName,
      amount: parseFloat(expenseAmount),
      type: 'expense',
      category: expenseCategory,
      categoryName: category?.name || 'Categoria não encontrada'
    };
    
    setTransactions(prev => [...prev, newTransaction]);
    setExpenseName('');
    setExpenseAmount('');
    setExpenseCategory('');
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = async () => {
    if (transactions.length === 0) {
      toast.error('Adicione pelo menos uma receita ou despesa');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDate = new Date(selectedYear, selectedMonth, 1);
      const monthYear = format(selectedDate, 'MM/yyyy');
      const transactionDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Criar apenas uma transação resumo com os detalhes em JSON
      const rentalDetails = {
        items: transactions.map(t => ({
          name: t.name,
          amount: t.amount,
          type: t.type,
          categoryName: t.categoryName
        })),
        summary: `Gestão de Aluguéis - ${propertyTitle} (${monthYear})`,
        totalIncome,
        totalExpense,
        balance
      };

      // Usar nome mais amigável e JSON em description
      await createTransaction({
        name: `Gestão de Aluguéis - ${monthYear}`,
        amount: Math.abs(balance),
        transaction_type: balance >= 0 ? 'income' : 'expense',
        category: balance >= 0 ? 
          categories.find(c => c.type === 'income')?.id || '' : 
          categories.find(c => c.type === 'expense')?.id || '',
        description: JSON.stringify(rentalDetails),
        transaction_date: transactionDate,
        property_id: propertyId,
        subcategory: 'rental-management'
      });

      toast.success('Gestão de aluguéis salva com sucesso!');
      onClose();
      setTransactions([]);
    } catch (error) {
      console.error('Erro ao salvar gestão de aluguéis:', error);
      toast.error('Erro ao salvar gestão de aluguéis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTransactions([]);
    setIncomeName('');
    setIncomeAmount('');
    setIncomeCategory('');
    setExpenseName('');
    setExpenseAmount('');
    setExpenseCategory('');
    onClose();
  };

  const handleYearChange = (direction: 'up' | 'down') => {
    setSelectedYear(prev => direction === 'up' ? prev + 1 : prev - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Gestão de Aluguéis - {propertyTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Seletor de Mês/Ano */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium">Período:</label>
            
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleYearChange('down')}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium w-16 text-center">{selectedYear}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleYearChange('up')}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            </div>

            <span className="text-xs text-muted-foreground">
              {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>

          {/* Formulários Inline - Receitas */}
          <div className="border rounded-lg p-3 bg-green-50">
            <h4 className="text-sm font-medium text-green-700 mb-2">Adicionar Receita</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Input
                placeholder="Nome da receita"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className="h-8 text-xs"
              />
              <Select value={incomeCategory} onValueChange={setIncomeCategory}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={addIncome}
                className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                disabled={!incomeName || !incomeAmount || !incomeCategory}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Formulários Inline - Despesas */}
          <div className="border rounded-lg p-3 bg-red-50">
            <h4 className="text-sm font-medium text-red-700 mb-2">Adicionar Despesa</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Input
                placeholder="Nome da despesa"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="h-8 text-xs"
              />
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={addExpense}
                className="bg-red-600 hover:bg-red-700 h-8 text-xs"
                disabled={!expenseName || !expenseAmount || !expenseCategory}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Lista de Transações Adicionadas */}
          {transactions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Itens Adicionados:</h4>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTransaction(transaction.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo */}
          <TransactionSummary
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="h-8 text-xs">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={transactions.length === 0 || isSubmitting}
            className="h-8 text-xs"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Gestão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
