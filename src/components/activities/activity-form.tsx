
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { ActivityFormData, ActivityStatus } from '@/types/activity';

import { formSchema, FormValues } from './form/form-schema';
import { TextField } from './form/text-field';
import { TextareaField } from './form/textarea-field';
import { SelectField } from './form/select-field';
import { DateField } from './form/date-field';
import { ActivityFormActions } from './form/activity-form-actions';

interface ActivityFormProps {
  initialData?: Partial<ActivityFormData>;
  onSubmit: (data: ActivityFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  propertyOptions?: { label: string; value: string }[];
  contractOptions?: { label: string; value: string }[];
}

const activityTypeOptions = [
  { label: 'Manutenção', value: 'maintenance' },
  { label: 'Inspeção', value: 'inspection' },
  { label: 'Legal', value: 'legal' },
  { label: 'Financeira', value: 'financial' },
  { label: 'Outro', value: 'other' }
];

const statusOptions = [
  { label: 'Pendente', value: 'pending' },
  { label: 'Em Progresso', value: 'in_progress' },
  { label: 'Concluída', value: 'completed' },
  { label: 'Cancelada', value: 'cancelled' }
];

const priorityOptions = [
  { label: 'Baixa', value: 'low' },
  { label: 'Média', value: 'medium' },
  { label: 'Alta', value: 'high' }
];

export function ActivityForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  propertyOptions = [],
  contractOptions = []
}: ActivityFormProps) {
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus>(
    initialData?.status as ActivityStatus || 'pending'
  );
  
  // Garantir que os valores iniciais são do tipo correto
  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    activity_type: initialData?.activity_type || 'maintenance',
    status: initialData?.status || 'pending',
    priority: initialData?.priority || 'medium',
    start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
    due_date: initialData?.due_date ? new Date(initialData.due_date) : null,
    completed_at: initialData?.completed_at ? new Date(initialData.completed_at) : null,
    responsible_name: initialData?.responsible_name || '',
    responsible_contact: initialData?.responsible_contact || '',
    responsible_notes: initialData?.responsible_notes || '',
    estimated_cost: initialData?.estimated_cost || null,
    actual_cost: initialData?.actual_cost || null,
    property_id: initialData?.property_id || null,
    contract_id: initialData?.contract_id || null,
  };

  // Set up the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // Handle status change to show/hide related fields
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus as ActivityStatus);
  };

  // Handle form submission
  const handleFormSubmit = (data: FormValues) => {
    // If no dates provided, use today's date to ensure it appears in Agenda
    let startDate = data.start_date;
    if (!startDate && !data.due_date) {
      startDate = new Date();
    }

    // Convert date objects to ISO strings for backend
    const formattedData = {
      ...data,
      start_date: startDate ? startDate.toISOString() : null,
      due_date: data.due_date ? data.due_date.toISOString() : null,
      completed_at: data.completed_at ? data.completed_at.toISOString() : null,
    };
    
    onSubmit(formattedData as ActivityFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <TextField
            control={form.control}
            name="title"
            label="Título"
            placeholder="Título da atividade"
          />
          
          {/* Activity Type */}
          <SelectField
            control={form.control}
            name="activity_type"
            label="Tipo"
            placeholder="Selecione o tipo"
            options={activityTypeOptions}
          />
          
          {/* Status */}
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            placeholder="Selecione o status"
            options={statusOptions}
            onChange={handleStatusChange}
          />
          
          {/* Priority */}
          <SelectField
            control={form.control}
            name="priority"
            label="Prioridade"
            placeholder="Selecione a prioridade"
            options={priorityOptions}
          />
          
          {/* Property */}
          {propertyOptions.length > 0 && (
            <SelectField
              control={form.control}
              name="property_id"
              label="Imóvel"
              placeholder="Selecione o imóvel"
              options={propertyOptions}
              allowEmpty
            />
          )}
          
          {/* Contract */}
          {contractOptions.length > 0 && (
            <SelectField
              control={form.control}
              name="contract_id"
              label="Contrato"
              placeholder="Selecione o contrato"
              options={contractOptions}
              allowEmpty
            />
          )}
          
          {/* Start Date */}
          <DateField
            control={form.control}
            name="start_date"
            label="Data de início"
          />
          
          {/* Due Date */}
          <DateField
            control={form.control}
            name="due_date"
            label="Prazo"
          />
          
          {/* Show Completion Date only for completed status */}
          {selectedStatus === 'completed' && (
            <DateField
              control={form.control}
              name="completed_at"
              label="Data de conclusão"
            />
          )}
          
          {/* Responsible Name */}
          <TextField
            control={form.control}
            name="responsible_name"
            label="Nome do Responsável"
            placeholder="Nome do responsável"
          />
          
          {/* Responsible Contact */}
          <TextField
            control={form.control}
            name="responsible_contact"
            label="Contato do Responsável"
            placeholder="Telefone ou email"
          />
          
          {/* Estimated Cost */}
          <TextField
            control={form.control}
            name="estimated_cost"
            label="Custo Estimado"
            placeholder="0.00"
            type="number"
          />
          
          {/* Actual Cost - Only show for completed activities */}
          {selectedStatus === 'completed' && (
            <TextField
              control={form.control}
              name="actual_cost"
              label="Custo Real"
              placeholder="0.00"
              type="number"
            />
          )}
        </div>
        
        {/* Description - Full width */}
        <TextareaField
          control={form.control}
          name="description"
          label="Descrição"
          placeholder="Descrição detalhada da atividade"
        />
        
        {/* Responsible Notes - Full width */}
        <TextareaField
          control={form.control}
          name="responsible_notes"
          label="Observações"
          placeholder="Observações sobre o trabalho do responsável"
          className="min-h-24"
        />
        
        {/* Form Actions */}
        <ActivityFormActions
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          isEditing={!!initialData && 'id' in initialData}
        />
      </form>
    </Form>
  );
}
