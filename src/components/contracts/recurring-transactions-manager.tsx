
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { MaskedDateInput } from '@/components/ui/masked-date-input';

export interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  name: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  start_date: string;
  end_date?: string;
}

interface RecurringTransactionsManagerProps {
  transactions: RecurringTransaction[];
  onTransactionsChange: (transactions: RecurringTransaction[]) => void;
}

export function RecurringTransactionsManager({
  transactions,
  onTransactionsChange
}: RecurringTransactionsManagerProps) {
  const addTransaction = (type: 'income' | 'expense') => {
    const newTransaction: RecurringTransaction = {
      id: Date.now().toString(),
      type,
      name: '',
      amount: 0,
      category: type === 'income' ? 'aluguel' : 'manutencao',
      frequency: 'monthly',
      start_date: '',
    };
    onTransactionsChange([...transactions, newTransaction]);
  };

  const removeTransaction = (id: string) => {
    onTransactionsChange(transactions.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, field: keyof RecurringTransaction, value: any) => {
    onTransactionsChange(
      transactions.map(t => t.id === id ? { ...t, [field]: value } : t)
    );
  };

  const incomeCategories = [
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'taxa_administracao', label: 'Taxa de Administração' },
    { value: 'outros', label: 'Outros' },
  ];

  const expenseCategories = [
    { value: 'condominio', label: 'Condomínio' },
    { value: 'iptu', label: 'IPTU' },
    { value: 'seguro', label: 'Seguro' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'outros', label: 'Outros' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Receitas e Despesas Recorrentes</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTransaction('income')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Receita
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTransaction('expense')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Despesa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhuma receita ou despesa recorrente cadastrada.
            </p>
            <p className="text-sm text-muted-foreground">
              As receitas recorrentes serão pré-preenchidas no modal de gestão de aluguéis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`font-medium px-2 py-1 rounded text-sm ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTransaction(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      placeholder="Ex: Aluguel mensal"
                      value={transaction.name}
                      onChange={(e) => updateTransaction(transaction.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Valor (R$)</label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={transaction.amount || ''}
                      onChange={(e) => updateTransaction(transaction.id, 'amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Categoria</label>
                    <Select
                      value={transaction.category}
                      onValueChange={(value) => updateTransaction(transaction.id, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(transaction.type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Frequência</label>
                    <Select
                      value={transaction.frequency}
                      onValueChange={(value) => updateTransaction(transaction.id, 'frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="annually">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data de Início</label>
                    <MaskedDateInput
                      value={transaction.start_date}
                      onChange={(value) => updateTransaction(transaction.id, 'start_date', value)}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Data de Fim (opcional)</label>
                    <MaskedDateInput
                      value={transaction.end_date || ''}
                      onChange={(value) => updateTransaction(transaction.id, 'end_date', value)}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
