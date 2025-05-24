
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Development, DevelopmentFormData } from '@/types/development';
import { applyCurrencyMask } from '@/utils/masks';

const developmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['residential_building', 'commercial_building', 'horizontal_condominium', 'subdivision']),
  address: z.string().min(1, 'Endereço é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  zip_code: z.string().optional(),
  total_land_area: z.number().optional(),
  planned_built_area: z.number().optional(),
  total_units: z.number().optional(),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
  current_phase: z.enum(['planning', 'land', 'project', 'construction', 'sales', 'completed']),
  description: z.string().optional(),
});

interface DevelopmentFormProps {
  initialData?: Development | null;
  onSubmit: (data: DevelopmentFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function DevelopmentForm({ initialData, onSubmit, onCancel, isLoading }: DevelopmentFormProps) {
  const [landAreaMask, setLandAreaMask] = useState('');
  const [builtAreaMask, setBuiltAreaMask] = useState('');

  const form = useForm<DevelopmentFormData>({
    resolver: zodResolver(developmentSchema),
    defaultValues: {
      name: '',
      type: 'residential_building',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      current_phase: 'planning',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        type: initialData.type,
        address: initialData.address,
        city: initialData.city,
        state: initialData.state,
        zip_code: initialData.zip_code || '',
        total_land_area: initialData.total_land_area,
        planned_built_area: initialData.planned_built_area,
        total_units: initialData.total_units,
        planned_start_date: initialData.planned_start_date || '',
        planned_end_date: initialData.planned_end_date || '',
        current_phase: initialData.current_phase,
        description: initialData.description || '',
      });

      if (initialData.total_land_area) {
        setLandAreaMask(initialData.total_land_area.toString());
      }
      if (initialData.planned_built_area) {
        setBuiltAreaMask(initialData.planned_built_area.toString());
      }
    }
  }, [initialData, form]);

  const handleLandAreaChange = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d]/g, ''));
    setLandAreaMask(value);
    form.setValue('total_land_area', isNaN(numericValue) ? undefined : numericValue);
  };

  const handleBuiltAreaChange = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d]/g, ''));
    setBuiltAreaMask(value);
    form.setValue('planned_built_area', isNaN(numericValue) ? undefined : numericValue);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      residential_building: 'Edifício Residencial',
      commercial_building: 'Edifício Comercial',
      horizontal_condominium: 'Condomínio Horizontal',
      subdivision: 'Loteamento'
    };
    return labels[type as keyof typeof labels];
  };

  const getPhaseLabel = (phase: string) => {
    const labels = {
      planning: 'Planejamento',
      land: 'Terreno',
      project: 'Projeto',
      construction: 'Construção',
      sales: 'Vendas',
      completed: 'Concluído'
    };
    return labels[phase as keyof typeof labels];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Empreendimento</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Empreendimento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Residencial Vista Verde" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential_building">{getTypeLabel('residential_building')}</SelectItem>
                        <SelectItem value="commercial_building">{getTypeLabel('commercial_building')}</SelectItem>
                        <SelectItem value="horizontal_condominium">{getTypeLabel('horizontal_condominium')}</SelectItem>
                        <SelectItem value="subdivision">{getTypeLabel('subdivision')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="total_land_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área do Terreno (m²)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1.000"
                        value={landAreaMask}
                        onChange={(e) => handleLandAreaChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planned_built_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Construída Prevista (m²)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5.000"
                        value={builtAreaMask}
                        onChange={(e) => handleBuiltAreaChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Unidades</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="planned_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Prevista de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planned_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Prevista de Término</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase Atual</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planning">{getPhaseLabel('planning')}</SelectItem>
                        <SelectItem value="land">{getPhaseLabel('land')}</SelectItem>
                        <SelectItem value="project">{getPhaseLabel('project')}</SelectItem>
                        <SelectItem value="construction">{getPhaseLabel('construction')}</SelectItem>
                        <SelectItem value="sales">{getPhaseLabel('sales')}</SelectItem>
                        <SelectItem value="completed">{getPhaseLabel('completed')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do empreendimento..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
