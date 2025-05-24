
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { applyDateMask, applyCurrencyMask, isValidDateFormat, parseCurrencyToNumber, convertToISO } from '@/utils/masks';

export interface Investment {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}

interface InvestmentsListProps {
  investments: Investment[];
  onChange: (investments: Investment[]) => void;
}

const investmentTypes = [
  { value: 'purchase', label: 'Compra' },
  { value: 'improvement', label: 'Benfeitorias' },
  { value: 'renovation', label: 'Reformas' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'expropriation', label: 'Desapropriação' },
  { value: 'demolition', label: 'Demolição' },
  { value: 'earthworks', label: 'Terraplanagem' },
  { value: 'landscaping', label: 'Paisagismo' },
  { value: 'infrastructure', label: 'Infraestrutura' },
  { value: 'other', label: 'Outros' }
];

export const InvestmentsList: React.FC<InvestmentsListProps> = ({
  investments,
  onChange
}) => {
  const [newInvestment, setNewInvestment] = useState<Omit<Investment, 'id'>>({
    type: '',
    amount: 0,
    date: '',
    description: ''
  });

  const addInvestment = () => {
    if (!newInvestment.type || !newInvestment.amount || !newInvestment.date) {
      return;
    }

    if (!isValidDateFormat(newInvestment.date)) {
      return;
    }

    const investment: Investment = {
      id: Math.random().toString(36).substring(2, 15),
      ...newInvestment,
      date: convertToISO(newInvestment.date)
    };

    onChange([...investments, investment]);
    setNewInvestment({
      type: '',
      amount: 0,
      date: '',
      description: ''
    });
  };

  const removeInvestment = (id: string) => {
    onChange(investments.filter(inv => inv.id !== id));
  };

  const handleAmountChange = (value: string) => {
    const maskedValue = applyCurrencyMask(value);
    setNewInvestment(prev => ({
      ...prev,
      amount: parseCurrencyToNumber(maskedValue)
    }));
  };

  const handleDateChange = (value: string) => {
    const maskedValue = applyDateMask(value);
    setNewInvestment(prev => ({
      ...prev,
      date: maskedValue
    }));
  };

  return (
    <div className="space-y-4">
      {/* Lista de investimentos existentes */}
      {investments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-medium">Investimentos Cadastrados</Label>
          {investments.map((investment) => (
            <Card key={investment.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">
                      {investmentTypes.find(t => t.value === investment.type)?.label}
                    </span>
                    <span className="text-muted-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(investment.amount)}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(investment.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {investment.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {investment.description}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInvestment(investment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para novo investimento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Investimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="investment-type">Tipo de Investimento</Label>
              <Select
                value={newInvestment.type}
                onValueChange={(value) => setNewInvestment(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="investment-amount">Valor</Label>
              <Input
                id="investment-amount"
                placeholder="R$ 0,00"
                value={newInvestment.amount > 0 ? applyCurrencyMask(newInvestment.amount.toString()) : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="investment-date">Data</Label>
              <Input
                id="investment-date"
                placeholder="dd/mm/aaaa"
                value={newInvestment.date}
                onChange={(e) => handleDateChange(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="investment-description">Descrição (opcional)</Label>
            <Textarea
              id="investment-description"
              placeholder="Descrição do investimento"
              value={newInvestment.description}
              onChange={(e) => setNewInvestment(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <Button
            type="button"
            onClick={addInvestment}
            disabled={!newInvestment.type || !newInvestment.amount || !newInvestment.date || !isValidDateFormat(newInvestment.date)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Investimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
