
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Calculator } from 'lucide-react';
import { ContractAdjustmentFormData } from '@/types/contract-adjustment';
import { useContractAdjustments } from '@/hooks/use-contract-adjustments';
import { formatCurrency } from '@/lib/format';

interface ContractAdjustmentFormProps {
  contractId: string;
  currentValue: number;
}

export function ContractAdjustmentForm({ contractId, currentValue }: ContractAdjustmentFormProps) {
  const { createAdjustment, isCreatingAdjustment } = useContractAdjustments(contractId);
  const [isOpen, setIsOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'value'>('percentage');
  
  const [formData, setFormData] = useState<Partial<ContractAdjustmentFormData>>({
    contract_id: contractId,
    old_value: currentValue,
    adjustment_date: new Date().toISOString().split('T')[0],
    applied_index: 'IPCA',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAdjustment({
        contract_id: contractId,
        old_value: currentValue,
        new_value: adjustmentType === 'value' ? formData.new_value : undefined,
        adjustment_percentage: adjustmentType === 'percentage' ? formData.adjustment_percentage : undefined,
        adjustment_date: formData.adjustment_date || new Date().toISOString().split('T')[0],
        adjustment_reason: formData.adjustment_reason,
        applied_index: formData.applied_index,
      });
      
      setIsOpen(false);
      setFormData({
        contract_id: contractId,
        old_value: currentValue,
        adjustment_date: new Date().toISOString().split('T')[0],
        applied_index: 'IPCA',
      });
    } catch (error) {
      console.error('Error creating adjustment:', error);
    }
  };

  const calculateNewValue = () => {
    if (adjustmentType === 'percentage' && formData.adjustment_percentage) {
      return currentValue * (1 + formData.adjustment_percentage / 100);
    }
    return formData.new_value || currentValue;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Aplicar Reajuste
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar Reajuste de Contrato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Atual</Label>
              <Input 
                value={formatCurrency(currentValue)} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Data do Reajuste</Label>
              <Input
                type="date"
                value={formData.adjustment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustment_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Tipo de Reajuste</Label>
            <Select 
              value={adjustmentType} 
              onValueChange={(value: 'percentage' | 'value') => setAdjustmentType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentual</SelectItem>
                <SelectItem value="value">Valor Específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {adjustmentType === 'percentage' ? (
            <div>
              <Label>Percentual de Reajuste (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.adjustment_percentage || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  adjustment_percentage: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="Ex: 5.5"
                required
              />
            </div>
          ) : (
            <div>
              <Label>Novo Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.new_value || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  new_value: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="Novo valor do contrato"
                required
              />
            </div>
          )}

          <div>
            <Label>Índice Aplicado</Label>
            <Select 
              value={formData.applied_index} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, applied_index: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IPCA">IPCA</SelectItem>
                <SelectItem value="IGP-M">IGP-M</SelectItem>
                <SelectItem value="INCC">INCC</SelectItem>
                <SelectItem value="Custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivo/Observações</Label>
            <Textarea
              value={formData.adjustment_reason || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, adjustment_reason: e.target.value }))}
              placeholder="Descreva o motivo do reajuste..."
              rows={3}
            />
          </div>

          {(formData.adjustment_percentage || formData.new_value) && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Novo Valor Calculado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateNewValue())}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreatingAdjustment}>
              {isCreatingAdjustment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                'Aplicar Reajuste'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
