
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
import { Upload } from 'lucide-react';

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
      investment_date: new Date().toISOString().split('T')[0],
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
    
    const success = await registerInvestment(data, receiptFile || undefined);
    if (success) {
      onSuccess();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  return (
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
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                {receiptFile ? receiptFile.name : 'Clique para fazer upload do comprovante'}
              </div>
            </div>
            <input
              id="receipt"
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
          </label>
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
  );
};
