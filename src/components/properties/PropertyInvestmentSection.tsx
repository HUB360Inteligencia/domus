
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Property } from '@/types/property';
import { InvestmentType } from '@/types/property-investment';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PropertyInvestmentSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

const investmentFormSchema = z.object({
  investment_type: z.string().min(1, "Tipo de investimento é obrigatório"),
  amount: z.coerce.number().min(0, "Valor deve ser zero ou positivo"),
  investment_date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
});

type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

const investmentTypeLabels: Record<InvestmentType, string> = {
  purchase: 'Compra',
  improvement: 'Melhoria',
  renovation: 'Reforma',
  maintenance: 'Manutenção',
  other: 'Outros'
};

export const PropertyInvestmentSection = ({
  property,
  isLoading,
}: PropertyInvestmentSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const {
    investments,
    totalInvestment,
    isLoadingInvestments,
    isCreating,
    registerInvestment,
    deleteInvestment,
  } = usePropertyInvestments(property?.id || null);

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: {
      investment_type: '',
      amount: 0,
      investment_date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const handleSubmit = async (data: InvestmentFormValues) => {
    const success = await registerInvestment(
      {
        investment_type: data.investment_type as InvestmentType,
        amount: data.amount,
        investment_date: data.investment_date,
        description: data.description,
      },
      receiptFile || undefined
    );

    if (success) {
      setIsDialogOpen(false);
      form.reset();
      setReceiptFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  // Calcular valores totais
  const purchaseValue = property?.purchase_value || 0;
  const additionalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPropertyInvestment = purchaseValue + additionalInvestments;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Investimentos no Imóvel</CardTitle>
              <CardDescription>
                Histórico de investimentos realizados
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Investimento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Novo Investimento</DialogTitle>
                  <DialogDescription>
                    Registre um novo investimento realizado no imóvel
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="investment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Investimento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(investmentTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="investment_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Investimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detalhes sobre o investimento..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <Label htmlFor="receipt">Comprovante (opcional)</Label>
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Registrando...' : 'Registrar Investimento'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumo dos Investimentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Valor de Compra</div>
              <div className="text-lg font-bold text-blue-900">
                {formatCurrency(purchaseValue)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Investimentos Adicionais</div>
              <div className="text-lg font-bold text-green-900">
                {formatCurrency(additionalInvestments)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Total Investido</div>
              <div className="text-lg font-bold text-purple-900">
                {formatCurrency(totalPropertyInvestment)}
              </div>
            </div>
          </div>

          {/* Lista de Investimentos */}
          {isLoadingInvestments ? (
            <div className="text-center py-4">Carregando investimentos...</div>
          ) : investments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-lg mb-2">Nenhum investimento registrado</div>
              <div className="text-sm">Clique em "Adicionar Investimento" para começar</div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                Histórico de Investimentos ({investments.length})
              </div>
              {investments.map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {investmentTypeLabels[investment.investment_type]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(investment.investment_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(investment.amount)}
                    </div>
                    {investment.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {investment.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {investment.receipt_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(investment.receipt_url!, '_blank')}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
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
