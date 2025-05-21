import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Card,
  CardContent
} from '@/components/ui/card';

import { Activity, ActivityFormData, ActivityCategory, ActivityType, ActivityStatus, ActivityPriority } from '@/types/activity';
import { Property } from '@/types/property';
import { Contract } from '@/types/contract';

// Esquema de validação com zod
const activityFormSchema = z.object({
  title: z.string().min(3, {
    message: 'O título deve ter pelo menos 3 caracteres'
  }),
  description: z.string().optional(),
  activity_type: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  due_date: z.date().nullable().optional(),
  start_date: z.date().nullable().optional(),
  property_id: z.string().nullable().optional(),
  contract_id: z.string().nullable().optional(),
  responsible_name: z.string().optional(),
  responsible_contact: z.string().optional(),
  responsible_notes: z.string().optional(),
  estimated_cost: z.coerce.number().nullable().optional()
});

interface ActivityFormProps {
  activity?: Activity;
  properties?: Property[];
  contracts?: Contract[];
  categories?: ActivityCategory[];
  selectedCategories?: string[];
  onSubmit: (data: ActivityFormData) => Promise<void>;
  onCancel: () => void;
  onCreateCategory?: (data: { name: string, description?: string }) => Promise<ActivityCategory>;
  isSubmitting: boolean;
  initialStatus?: ActivityStatus | null;
}

export function ActivityForm({
  activity,
  properties,
  contracts,
  categories = [],
  selectedCategories = [],
  onSubmit,
  onCancel,
  onCreateCategory,
  isSubmitting,
  initialStatus = null
}: ActivityFormProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(selectedCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);

  const form = useForm<z.infer<typeof activityFormSchema>>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: activity?.title || '',
      description: activity?.description || '',
      activity_type: activity?.activity_type || 'maintenance',
      status: activity?.status || initialStatus || 'pending',
      priority: activity?.priority || 'medium',
      due_date: activity?.due_date ? new Date(activity.due_date) : null,
      start_date: activity?.start_date ? new Date(activity.start_date) : null,
      property_id: activity?.property_id || null,
      contract_id: activity?.contract_id || null,
      responsible_name: activity?.responsible_name || '',
      responsible_contact: activity?.responsible_contact || '',
      responsible_notes: activity?.responsible_notes || '',
      estimated_cost: activity?.estimated_cost || null
    }
  });

  // Atualizar formulário quando os dados da atividade ou status inicial mudarem
  useEffect(() => {
    if (activity) {
      form.reset({
        title: activity.title || '',
        description: activity.description || '',
        activity_type: activity.activity_type || 'maintenance',
        status: activity.status || 'pending',
        priority: activity.priority || 'medium',
        due_date: activity.due_date ? new Date(activity.due_date) : null,
        start_date: activity.start_date ? new Date(activity.start_date) : null,
        property_id: activity.property_id || null,
        contract_id: activity.contract_id || null,
        responsible_name: activity.responsible_name || '',
        responsible_contact: activity.responsible_contact || '',
        responsible_notes: activity.responsible_notes || '',
        estimated_cost: activity.estimated_cost || null
      });
    } else if (initialStatus) {
      form.setValue('status', initialStatus);
    }
  }, [activity, initialStatus, form]);

  // Atualizar categorias selecionadas quando as props mudarem
  useEffect(() => {
    setSelectedCategoryIds(selectedCategories);
  }, [selectedCategories]);

  const handleSubmit = async (formData: z.infer<typeof activityFormSchema>) => {
    const { due_date, start_date, ...rest } = formData;
    
    const activityData: ActivityFormData = {
      ...rest,
      title: rest.title, // Ensure title is not optional
      activity_type: rest.activity_type as ActivityType,
      status: rest.status as ActivityStatus,
      priority: rest.priority as ActivityPriority,
      due_date: due_date ? due_date.toISOString() : null,
      start_date: start_date ? start_date.toISOString() : null,
      categories: selectedCategoryIds
    };

    await onSubmit(activityData);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prevSelected => 
      prevSelected.includes(categoryId)
        ? prevSelected.filter(id => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !onCreateCategory) return;
    
    try {
      const newCategory = await onCreateCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined
      });
      
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowNewCategoryDialog(false);
      
      // Adicionar a nova categoria às selecionadas
      if (newCategory) {
        setSelectedCategoryIds(prev => [...prev, newCategory.id]);
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  // Mapeamento de tipos de atividade para exibição
  const activityTypeMap = {
    maintenance: 'Manutenção',
    contract: 'Contrato',
    payment: 'Pagamento',
    visit: 'Visita',
    documentation: 'Documentação',
    other: 'Outro'
  };
  
  // Mapeamento de status para exibição
  const statusMap = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    canceled: 'Cancelado'
  };
  
  // Mapeamento de prioridades para exibição
  const priorityMap = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Título da atividade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="activity_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Atividade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(activityTypeMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(priorityMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
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
                  placeholder="Descreva a atividade em detalhes"
                  className="min-h-[120px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Vencimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties && (
            <FormField
              control={form.control}
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imóvel</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um imóvel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {contracts && (
            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {contracts.map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        <FormField
          control={form.control}
          name="estimated_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo Estimado (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  placeholder="0,00" 
                  step="0.01"
                  min="0"
                  {...field}
                  value={field.value === null ? '' : field.value}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Responsável</FormLabel>
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="responsible_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do responsável" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responsible_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefone/Email do responsável" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responsible_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre o responsável"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Categorias</FormLabel>
            {onCreateCategory && (
              <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Categoria</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova categoria para suas atividades.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <FormLabel>Nome da Categoria</FormLabel>
                      <Input
                        placeholder="Digite o nome da categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Descrição</FormLabel>
                      <Textarea
                        placeholder="Descrição da categoria (opcional)"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      Criar Categoria
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map(category => (
              <Card 
                key={category.id} 
                className={`cursor-pointer transition-colors ${
                  selectedCategoryIds.includes(category.id) 
                    ? 'bg-primary/10 border-primary/30' 
                    : ''
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`h-4 w-4 rounded-full ${
                        selectedCategoryIds.includes(category.id) 
                          ? 'bg-primary' 
                          : 'bg-muted'
                      }`}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(statusMap).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : activity ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
