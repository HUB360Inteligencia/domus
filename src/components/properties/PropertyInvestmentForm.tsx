
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Property } from '@/types/property';
import { InvestmentType } from '@/types/property-investment';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { RECEIPT_ACCEPT, validateReceiptFile } from '@/api/receipts';
import { toDateOnlyString } from "@/lib/dates";

const investmentSchema = z.object({
  investment_type: z.enum(['purchase', 'improvement', 'renovation', 'maintenance', 'other'] as const),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  investment_date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface PropertyInvestmentFormProps {
  property: Property | null | undefined;
  onSuccess: () => void;
}

export const PropertyInvestmentForm: React.FC<PropertyInvestmentFormProps> = ({
  property,
  onSuccess,
}) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const { registerInvestment, isCreating } = usePropertyInvestments(property?.id || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      investment_date: toDateOnlyString(new Date()),
    },
  });

  const watchedType = watch('investment_type');

  const investmentTypes = [
    { value: 'purchase' as const, label: 'Compra' },
    { value: 'improvement' as const, label: 'Melhorias' },
    { value: 'renovation' as const, label: 'Reformas' },
    { value: 'maintenance' as const, label: 'Manutenção' },
    { value: 'other' as const, label: 'Outros' },
  ];

  const onSubmit = async (data: InvestmentFormData) => {
    // Ensure all required fields are present
    if (!data.investment_type) {
      return;
    }
    
    // Cast the data to ensure it matches the expected type
    const investmentData = {
      investment_type: data.investment_type as InvestmentType,
      amount: data.amount,
      investment_date: data.investment_date,
      description: data.description,
    };
    
    const success = await registerInvestment(investmentData, receiptFile || undefined);
    if (success) {
      onSuccess();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    // Valida antes de enviar: um comprovante inválido impediria o registro do investimento
    const validationError = validateReceiptFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setReceiptFile(file);
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="investment_type">Tipo de Investimento</Label>
            <Select onValueChange={(value) => setValue('investment_type', value as InvestmentType)}>
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
            {errors.investment_type && (
              <p className="text-sm text-red-500 mt-1">{errors.investment_type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="investment_date">Data do Investimento</Label>
          <Input
            id="investment_date"
            type="date"
            {...register('investment_date')}
          />
          {errors.investment_date && (
            <p className="text-sm text-red-500 mt-1">{errors.investment_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Descreva o investimento..."
            rows={3}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="receipt">Comprovante (opcional)</Label>
          <div className="mt-1">
            <label className="flex h-28 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-border transition-colors hover:border-accent/60 hover:bg-muted/40">
              <div className="space-y-1 px-4 text-center">
                <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
                <div className="truncate text-sm font-medium">
                  {receiptFile ? receiptFile.name : 'Clique para anexar o comprovante'}
                </div>
                <div className="text-xs text-muted-foreground">JPG, PNG ou PDF até 5MB</div>
              </div>
              <input
                id="receipt"
                type="file"
                className="hidden"
                accept={RECEIPT_ACCEPT}
                onChange={handleFileChange}
              />
            </label>
            {receiptFile && (
              <button
                type="button"
                onClick={() => setReceiptFile(null)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
                Remover comprovante
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating || !watchedType}>
            {isCreating ? 'Salvando...' : 'Salvar Investimento'}
          </Button>
        </div>
      </form>
    </div>
  );
};
