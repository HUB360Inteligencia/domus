
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Property } from '@/types/property';

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ValuationFormData>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      value: property?.value || 0,
      valuation_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: ValuationFormData) => {
    try {
      // TODO: Implement actual valuation API call
      console.log('Creating valuation:', data);
      toast.success('Avaliação adicionada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Error creating valuation:', error);
      toast.error('Erro ao adicionar avaliação');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="value">Novo Valor de Mercado</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            placeholder="0,00"
            {...register('value', { valueAsNumber: true })}
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
      </div>

      {property?.value && (
        <div className="text-sm text-muted-foreground">
          Valor atual: {formatCurrency(property.value)}
        </div>
      )}

      <div>
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Comentários sobre a avaliação..."
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
        </Button>
      </div>
    </form>
  );
};
