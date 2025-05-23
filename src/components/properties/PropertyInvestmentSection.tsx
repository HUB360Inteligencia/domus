import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Property } from '@/types/property';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { ROIChart } from './ROIChart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InvestmentType } from '@/types/property-investment';

export const PropertyInvestmentSection = ({ property, isLoading }: { property: Property | null | undefined; isLoading: boolean }) => {
  const { investments, totalInvestment, isLoadingInvestments, registerInvestment, deleteInvestment } = usePropertyInvestments(property?.id || null);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [investmentData, setInvestmentData] = useState({
    investment_type: 'improvement' as InvestmentType,
    amount: 0,
    investment_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvestmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleInvestmentTypeChange = (value: InvestmentType) => {
    setInvestmentData(prev => ({ ...prev, investment_type: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setInvestmentData(prev => ({ ...prev, investment_date: format(date, 'yyyy-MM-dd') }));
    }
    setIsDatePickerOpen(false);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const success = await registerInvestment(investmentData, receiptFile);
    if (success) {
      setIsAddInvestmentOpen(false);
      setInvestmentData({
        investment_type: 'improvement',
        amount: 0,
        investment_date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
      });
      setReceiptFile(null);
      toast({
        title: "Sucesso!",
        description: "Investimento registrado com sucesso.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Erro ao registrar investimento.",
      })
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* ROI Chart */}
      <ROIChart 
        property={property} 
        investments={investments} 
        isLoading={isLoading || isLoadingInvestments} 
      />
      
      {/* Investment Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalhes do Investimento</CardTitle>
          <Button size="sm" onClick={() => setIsAddInvestmentOpen(true)} disabled={isLoading || !property}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Investimento
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground text-sm">Valor total investido</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(property?.total_investment || totalInvestment)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground text-sm">Data da última avaliação</div>
                    <div className="text-xl font-bold">
                      {property?.last_valuation_date ? formatDate(property.last_valuation_date) : 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground text-sm">Valor do imóvel</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(property?.value)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Investment History */}
              <Table>
                <TableCaption>Histórico de investimentos no imóvel.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">{formatDate(investment.investment_date)}</TableCell>
                      <TableCell>{investment.investment_type}</TableCell>
                      <TableCell>{investment.description}</TableCell>
                      <TableCell>{formatCurrency(investment.amount)}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="xs">Excluir</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Investimento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este investimento? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteInvestment(investment.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Investment Dialog */}
      <AlertDialog open={isAddInvestmentOpen} onOpenChange={setIsAddInvestmentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Novo Investimento</AlertDialogTitle>
            <AlertDialogDescription>
              Preencha os campos abaixo para registrar um novo investimento no imóvel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investment_type" className="text-right">
                Tipo
              </Label>
              <Select onValueChange={handleInvestmentTypeChange} defaultValue={investmentData.investment_type} >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Compra</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="renovation">Reforma</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Valor
              </Label>
              <Input type="number" id="amount" name="amount" className="col-span-3" placeholder="0.00" value={investmentData.amount.toString()} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="investment_date" className="text-right">
                Data
              </Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !investmentData.investment_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {investmentData.investment_date ? (
                      format(new Date(investmentData.investment_date), "dd/MM/yyyy")
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={investmentData.investment_date ? new Date(investmentData.investment_date) : undefined}
                    onSelect={handleDateChange}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea id="description" name="description" className="col-span-3" placeholder="Detalhes do investimento" value={investmentData.description} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="receipt" className="text-right">
                Comprovante
              </Label>
              <Input type="file" id="receipt" name="receipt" className="col-span-3" onChange={handleReceiptChange} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Registrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
