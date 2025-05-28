
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Property } from '@/types/property';
import { usePropertyValuations } from '@/hooks/use-property-valuations';
import { formatCurrency, parseCurrencyInput } from '@/utils/currency';
import { toast } from 'sonner';

const valuationSchema = z.object({
  value: z.number().min(0, 'Valor deve ser positivo'),
  valuation_date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
});

type ValuationFormData = z.infer<typeof valuationSchema>;

interface PropertyValuationFormProps {
  property: Property | null | undefined;
  onSuccess: () => void;
}

export const PropertyValuationForm: React.FC<PropertyValuationFormProps> = ({
  property,
  onSuccess,
}) => {
  const { createValuation, isCreating } = usePropertyValuations(property?.id || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ValuationFormData>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      value: property?.value || 0,
      valuation_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedValue = watch('value');

  const onSubmit = async (data: ValuationFormData) => {
    if (!property?.id) {
      toast.error('Imóvel não encontrado');
      return;
    }

    try {
      await createValuation({
        property_id: property.id,
        value: data.value,
        valuation_date: data.valuation_date,
        notes: data.notes || null,
      });
      
      toast.success('Avaliação criada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Error creating valuation:', error);
      toast.error('Erro ao criar avaliação');
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseCurrencyInput(value);
    setValue('value', numericValue);
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="value">Novo Valor de Mercado (R$)</Label>
          <Input
            id="value"
            type="text"
            placeholder="R$ 0,00"
            value={watchedValue ? formatCurrency(watchedValue) : ''}
            onChange={handleValueChange}
          />
          {errors.value && (
            <p className="text-sm text-red-500 mt-1">{errors.value.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="valuation_date">Data da Avaliação</Label>
          <Input
            id="valuation_date"
            type="date"
            {...register('valuation_date')}
          />
          {errors.valuation_date && (
            <p className="text-sm text-red-500 mt-1">{errors.valuation_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Adicione observações sobre esta avaliação..."
            rows={3}
            {...register('notes')}
          />
          {errors.notes && (
            <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Salvando...' : 'Salvar Avaliação'}
          </Button>
        </div>
      </form>
    </div>
  );
};
