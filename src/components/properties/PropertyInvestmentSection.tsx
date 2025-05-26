import React, { useState } from 'react';
import { Plus, Upload, Calendar, Receipt, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Property } from '@/types/property';
import { InvestmentType } from '@/types/property-investment';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { CurrencyInput } from '@/components/ui/currency-input';
import { parseCurrencyInput } from '@/utils/currency';

interface PropertyInvestmentSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyInvestmentSection: React.FC<PropertyInvestmentSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newInvestmentData, setNewInvestmentData] = useState({
    investment_type: 'improvement' as InvestmentType,
    amount: '',
    description: '',
    investment_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const {
    investments,
    totalInvestment,
    isLoadingInvestments,
    isCreating,
    registerInvestment,
    deleteInvestment,
    refetchInvestments,
  } = usePropertyInvestments(property?.id || null);

  const handleAddInvestment = async () => {
    if (!newInvestmentData.amount || !property?.id) return;
    
    // Convert amount string to number before passing to registerInvestment
    const investmentDataWithNumericAmount = {
      ...newInvestmentData,
      amount: parseCurrencyInput(newInvestmentData.amount)
    };
    
    const success = await registerInvestment(investmentDataWithNumericAmount, receiptFile || undefined);
    
    if (success) {
      // Reset form and close dialog
      setNewInvestmentData({
        investment_type: 'improvement' as InvestmentType,
        amount: '',
        description: '',
        investment_date: format(new Date(), 'yyyy-MM-dd'),
      });
      setReceiptFile(null);
      setIsAddDialogOpen(false);
      refetchInvestments();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getInvestmentTypeLabel = (type: InvestmentType) => {
    const labels = {
      improvement: 'Melhoria',
      repair: 'Reparo',
      maintenance: 'Manutenção',
      renovation: 'Renovação',
      acquisition: 'Aquisição',
      other: 'Outros'
    };
    return labels[type] || type;
  };

  const getInvestmentTypeBadgeColor = (type: InvestmentType) => {
    const colors = {
      improvement: 'bg-blue-100 text-blue-800',
      repair: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      renovation: 'bg-purple-100 text-purple-800',
      acquisition: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  if (isLoading || isLoadingInvestments) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-8 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Investimentos no Imóvel</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Investimento</span>
              <span className="inline sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Novo Investimento</DialogTitle>
              <DialogDescription>
                Adicione um novo investimento realizado neste imóvel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investment_type" className="text-right">
                  Tipo
                </Label>
                <Select 
                  value={newInvestmentData.investment_type} 
                  onValueChange={(value: InvestmentType) => 
                    setNewInvestmentData(prev => ({ ...prev, investment_type: value }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improvement">Melhoria</SelectItem>
                    <SelectItem value="repair">Reparo</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="renovation">Renovação</SelectItem>
                    <SelectItem value="acquisition">Aquisição</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Valor
                </Label>
                <div className="col-span-3">
                  <CurrencyInput
                    id="amount"
                    value={newInvestmentData.amount}
                    onChange={(value) => setNewInvestmentData(prev => ({ ...prev, amount: value }))}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investment_date" className="text-right">
                  Data
                </Label>
                <div className="col-span-3 flex items-center">
                  <Input
                    id="investment_date"
                    type="date"
                    value={newInvestmentData.investment_date}
                    onChange={(e) => setNewInvestmentData(prev => ({ ...prev, investment_date: e.target.value }))}
                    className="w-full"
                  />
                  <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={newInvestmentData.description}
                  onChange={(e) => setNewInvestmentData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="Descreva o investimento realizado"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receipt" className="text-right">
                  Comprovante
                </Label>
                <div className="col-span-3">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleAddInvestment} 
                disabled={!newInvestmentData.amount || isCreating}
              >
                {isCreating ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Investimento Total</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalInvestment)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Valor de compra + investimentos adicionais
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Valor de Compra</div>
            <div className="text-2xl font-bold">{formatCurrency(property?.purchase_value || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Valor original de aquisição
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Investimentos Adicionais</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalInvestment - (property?.purchase_value || 0))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {investments.length} investimento{investments.length !== 1 ? 's' : ''} registrado{investments.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum investimento adicional registrado</p>
              <p className="text-sm">Adicione investimentos como melhorias, reparos e manutenções</p>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getInvestmentTypeBadgeColor(investment.investment_type)}>
                        {getInvestmentTypeLabel(investment.investment_type)}
                      </Badge>
                      <span className="font-medium">{formatCurrency(investment.amount)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{investment.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(investment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {investment.receipt_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(investment.receipt_url, '_blank')}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteInvestment(investment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
