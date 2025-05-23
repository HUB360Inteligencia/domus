import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvestmentType, PropertyInvestment } from '@/types/property-investment';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { toast } from 'sonner';

interface PropertyInvestmentSectionProps {
  propertyId: string;
}

export const PropertyInvestmentSection: React.FC<PropertyInvestmentSectionProps> = ({ propertyId }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [investmentType, setInvestmentType] = useState<InvestmentType>(InvestmentType.PURCHASE);
  const [amount, setAmount] = useState('');
  const [investmentDate, setInvestmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const { 
    investments, 
    isLoading, 
    isCreating,
    isUploading,
    createInvestment,
    uploadReceipt
  } = usePropertyInvestments(propertyId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setInvestmentType(InvestmentType.PURCHASE);
    setAmount('');
    setInvestmentDate(format(new Date(), 'yyyy-MM-dd'));
    setDescription('');
    setReceiptFile(null);
  };

  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    createInvestment({
      property_id: propertyId,
      investment_type: investmentType,
      amount: Number(amount),
      investment_date: investmentDate,
      description: description || undefined
    }, {
      onSuccess: (data) => {
        // If a receipt file was provided, upload it
        if (receiptFile) {
          uploadReceipt({
            file: receiptFile,
            investmentId: data.id
          });
        }
        
        resetForm();
        setIsAddDialogOpen(false);
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getInvestmentTypeLabel = (type: InvestmentType) => {
    const types = {
      'purchase': 'Compra',
      'renovation': 'Reforma',
      'furniture': 'Mobília',
      'taxes': 'Impostos',
      'maintenance': 'Manutenção',
      'other': 'Outro'
    };
    return types[type] || type;
  };

  const getTotalInvestment = () => {
    return investments.reduce((total, inv) => total + inv.amount, 0);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Investimentos</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                Adicionar Investimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Novo Investimento</DialogTitle>
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
                      <SelectItem value={InvestmentType.PURCHASE}>Compra</SelectItem>
                      <SelectItem value={InvestmentType.RENOVATION}>Reforma</SelectItem>
                      <SelectItem value={InvestmentType.FURNITURE}>Mobília</SelectItem>
                      <SelectItem value={InvestmentType.TAXES}>Impostos</SelectItem>
                      <SelectItem value={InvestmentType.MAINTENANCE}>Manutenção</SelectItem>
                      <SelectItem value={InvestmentType.OTHER}>Outro</SelectItem>
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Detalhes do investimento"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receipt" className="text-right">
                    Comprovante
                  </Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!amount || isNaN(Number(amount)) || isCreating || isUploading}
                >
                  {isCreating || isUploading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : investments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum investimento registrado. Clique em Adicionar Investimento para começar.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>{getInvestmentTypeLabel(investment.investment_type)}</TableCell>
                    <TableCell>{format(parseISO(investment.investment_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell>{formatCurrency(investment.amount)}</TableCell>
                    <TableCell>{investment.description || '-'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell colSpan={2}>Total Investido</TableCell>
                  <TableCell>{formatCurrency(getTotalInvestment())}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};
