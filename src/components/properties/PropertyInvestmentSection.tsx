
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Upload, PlusCircle, Trash2, Receipt, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { InvestmentType } from '@/types/property-investment';
import { ROIChart } from './ROIChart';

interface PropertyInvestmentSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyInvestmentSection: React.FC<PropertyInvestmentSectionProps> = ({
  property,
  isLoading = false,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [investmentType, setInvestmentType] = useState<InvestmentType>('improvement');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentDate, setInvestmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [investmentDescription, setInvestmentDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const {
    investments,
    totalInvestment,
    isLoadingInvestments,
    registerInvestment,
    deleteInvestment,
    isCreating,
    isUploading,
    isDeleting,
  } = usePropertyInvestments(property?.id || null);

  const handleAddInvestment = async () => {
    if (!investmentAmount || !investmentType || !investmentDate) return;
    
    try {
      await registerInvestment(
        {
          investment_type: investmentType,
          amount: Number(investmentAmount),
          investment_date: investmentDate,
          description: investmentDescription || undefined
        },
        receiptFile || undefined
      );
      
      // Reset form and close dialog
      setInvestmentType('improvement');
      setInvestmentAmount('');
      setInvestmentDate(format(new Date(), 'yyyy-MM-dd'));
      setInvestmentDescription('');
      setReceiptFile(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setReceiptFile(event.target.files[0]);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderSummaryCards = () => {
    if (isLoading || isLoadingInvestments) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      );
    }

    const purchaseValue = property?.purchase_value || 0;
    const currentValue = property?.value || 0;
    const additionalInvestments = totalInvestment - purchaseValue;
    const roi = ((currentValue - totalInvestment) / totalInvestment) * 100;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Investimento Total</p>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Compra: {formatCurrency(purchaseValue)} | Adicionais: {formatCurrency(additionalInvestments)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Valor Atual</p>
            <div className="text-2xl font-bold">{formatCurrency(currentValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Última avaliação: {property?.last_valuation_date ? 
                format(new Date(property.last_valuation_date), 'dd/MM/yyyy', { locale: ptBR }) : 
                'Não disponível'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">ROI Total</p>
            <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(currentValue - totalInvestment)} de diferença
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Investimentos no Imóvel</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Registrar Investimento</span>
              <span className="inline sm:hidden">Investimento</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Novo Investimento</DialogTitle>
              <DialogDescription>
                Registre um novo investimento feito neste imóvel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investment-type" className="text-right">
                  Tipo
                </Label>
                <Select 
                  value={investmentType} 
                  onValueChange={(value) => setInvestmentType(value as InvestmentType)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo de investimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improvement">Melhoria</SelectItem>
                    <SelectItem value="renovation">Renovação</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Valor
                </Label>
                <div className="col-span-3 flex items-center">
                  <span className="mr-2">R$</span>
                  <Input
                    id="amount"
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <div className="col-span-3 flex items-center">
                  <Input
                    id="date"
                    type="date"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
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
                  value={investmentDescription}
                  onChange={(e) => setInvestmentDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Detalhes sobre o investimento"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receipt" className="text-right">
                  Comprovante
                </Label>
                <div className="col-span-3">
                  <Label
                    htmlFor="receipt-upload"
                    className="flex items-center gap-2 border rounded-md p-2 cursor-pointer hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" />
                    {receiptFile ? receiptFile.name : "Selecione um arquivo"}
                  </Label>
                  <Input
                    id="receipt-upload"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf"
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
                disabled={!investmentAmount || !investmentType || !investmentDate || isCreating || isUploading}
              >
                {isCreating || isUploading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {renderSummaryCards()}

      <ROIChart 
        property={property}
        investments={investments}
        isLoading={isLoading || isLoadingInvestments}
      />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingInvestments ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : investments.length > 0 ? (
            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="flex justify-between items-center border-b pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {investment.investment_type === 'purchase' ? 'Compra' :
                         investment.investment_type === 'improvement' ? 'Melhoria' :
                         investment.investment_type === 'renovation' ? 'Renovação' :
                         investment.investment_type === 'maintenance' ? 'Manutenção' :
                         'Outro'}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {format(new Date(investment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{investment.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {investment.receipt_url && (
                      <a 
                        href={investment.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <Receipt className="h-4 w-4" />
                      </a>
                    )}
                    <span className="font-semibold">{formatCurrency(investment.amount)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteInvestment(investment.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum investimento registrado ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
