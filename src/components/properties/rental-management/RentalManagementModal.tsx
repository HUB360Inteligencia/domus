
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthlyTransactionForm } from './MonthlyTransactionForm';
import { TransactionSummary } from './TransactionSummary';
import { RentalTransactionItem } from './RentalTransactionItem';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { toast } from 'sonner';

interface MonthlyTransaction {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryName: string;
  description?: string;
}

interface RentalManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

export const RentalManagementModal: React.FC<RentalManagementModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [transactions, setTransactions] = useState<MonthlyTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories } = useFinancialCategories();
  const { createTransaction } = useFinancialTransactions();

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleAddTransaction = (transaction: Omit<MonthlyTransaction, 'id'>) => {
    const newTransaction: MonthlyTransaction = {
      ...transaction,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTransactions(prev => [...prev, newTransaction]);
    setShowIncomeForm(false);
    setShowExpenseForm(false);
  };

  const handleRemoveTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = async () => {
    if (transactions.length === 0) {
      toast.error('Adicione pelo menos uma receita ou despesa');
      return;
    }

    setIsSubmitting(true);
    try {
      const monthYear = format(selectedMonth, 'MM/yyyy');
      const groupId = `rental-${propertyId}-${format(selectedMonth, 'yyyy-MM')}`;

      // Criar transação de resumo principal
      const summaryDescription = `Gestão de Aluguéis - ${propertyTitle} (${monthYear})
${incomeTransactions.length} receita(s): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
${expenseTransactions.length} despesa(s): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
Saldo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}`;

      await createTransaction({
        name: `Gestão de Aluguéis - ${propertyTitle} (${monthYear})`,
        amount: Math.abs(balance),
        transaction_type: balance >= 0 ? 'income' : 'expense',
        category: balance >= 0 ? 
          categories.find(c => c.type === 'income')?.id || '' : 
          categories.find(c => c.type === 'expense')?.id || '',
        description: summaryDescription,
        transaction_date: format(selectedMonth, 'yyyy-MM-dd'),
        property_id: propertyId,
        subcategory: `grupo:${groupId}`
      });

      // Criar transações individuais como detalhes
      for (const transaction of transactions) {
        await createTransaction({
          name: transaction.name,
          amount: transaction.amount,
          transaction_type: transaction.type,
          category: transaction.category,
          description: `${transaction.description || ''} (Detalhe: ${monthYear})`,
          transaction_date: format(selectedMonth, 'yyyy-MM-dd'),
          property_id: propertyId,
          subcategory: `detalhe:${groupId}`
        });
      }

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
    setShowIncomeForm(false);
    setShowExpenseForm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestão de Aluguéis - {propertyTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Período:</label>
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value + '-01'))}
              className="px-3 py-2 border rounded-md"
            />
            <span className="text-muted-foreground">
              {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>

          {/* Botões de Adicionar */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowIncomeForm(true)}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              + Receita
            </Button>
            <Button
              onClick={() => setShowExpenseForm(true)}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              + Despesa
            </Button>
          </div>

          {/* Formulários Inline */}
          {showIncomeForm && (
            <MonthlyTransactionForm
              type="income"
              onSubmit={handleAddTransaction}
              onCancel={() => setShowIncomeForm(false)}
            />
          )}

          {showExpenseForm && (
            <MonthlyTransactionForm
              type="expense"
              onSubmit={handleAddTransaction}
              onCancel={() => setShowExpenseForm(false)}
            />
          )}

          {/* Lista de Transações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Receitas */}
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                Receitas ({incomeTransactions.length})
              </h3>
              <div className="space-y-2">
                {incomeTransactions.map((transaction) => (
                  <RentalTransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onRemove={handleRemoveTransaction}
                  />
                ))}
                {incomeTransactions.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma receita adicionada
                  </p>
                )}
              </div>
            </div>

            {/* Despesas */}
            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-3">
                Despesas ({expenseTransactions.length})
              </h3>
              <div className="space-y-2">
                {expenseTransactions.map((transaction) => (
                  <RentalTransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onRemove={handleRemoveTransaction}
                  />
                ))}
                {expenseTransactions.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma despesa adicionada
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resumo */}
          <TransactionSummary
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={transactions.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Gestão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
