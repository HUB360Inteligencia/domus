
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useActivities } from "@/hooks/use-activities";
import { useProperties } from "@/hooks/use-properties";
import { useContracts } from "@/hooks/use-contracts";
import { PageHeader } from "@/components/ui/page-header";
import { ActivityFormData } from "@/types/activity";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, ArrowLeft, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Validation schema
const activityFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  activity_type: z.enum(["maintenance", "inspection", "legal", "financial", "other"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high"]),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  responsible_name: z.string().nullable().optional(),
  responsible_contact: z.string().nullable().optional(),
  responsible_notes: z.string().nullable().optional(),
  estimated_cost: z.number().nullable().optional(),
  actual_cost: z.number().nullable().optional(),
  property_id: z.string().nullable().optional(),
  contract_id: z.string().nullable().optional(),
});

export default function ActivityFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get("id");
  const isEditMode = !!activityId;
  
  const { selectedActivity, setSelectedActivityId, createActivity, updateActivity, isCreating, isUpdating } = useActivities();
  const { properties } = useProperties();
  const { contracts } = useContracts();
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize the form
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: "",
      description: "",
      activity_type: "maintenance",
      status: "pending",
      priority: "medium",
      start_date: null,
      due_date: null,
      responsible_name: null,
      responsible_contact: null,
      responsible_notes: null,
      estimated_cost: null,
      actual_cost: null,
      property_id: null,
      contract_id: null,
    }
  });
  
  // Set the selected activity id when the page loads
  useEffect(() => {
    if (activityId) {
      setSelectedActivityId(activityId);
    } else {
      setIsLoading(false);
    }
  }, [activityId, setSelectedActivityId]);
  
  // Set form values when the selected activity changes
  useEffect(() => {
    if (selectedActivity && isEditMode) {
      form.reset({
        title: selectedActivity.title,
        description: selectedActivity.description || "",
        activity_type: selectedActivity.activity_type,
        status: selectedActivity.status,
        priority: selectedActivity.priority,
        start_date: selectedActivity.start_date,
        due_date: selectedActivity.due_date,
        responsible_name: selectedActivity.responsible_name,
        responsible_contact: selectedActivity.responsible_contact,
        responsible_notes: selectedActivity.responsible_notes,
        estimated_cost: selectedActivity.estimated_cost,
        actual_cost: selectedActivity.actual_cost,
        property_id: selectedActivity.property_id,
        contract_id: selectedActivity.contract_id,
      });
      setIsLoading(false);
    }
  }, [selectedActivity, form, isEditMode]);
  
  // Handler for form submission
  const onSubmit = async (data: ActivityFormData) => {
    try {
      if (isEditMode && selectedActivity) {
        await updateActivity({ id: selectedActivity.id, data });
      } else {
        await createActivity(data);
      }
      navigate("/activities");
    } catch (error) {
      console.error("Error saving activity:", error);
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title={isEditMode ? "Editar Atividade" : "Nova Atividade"}
        description={isEditMode ? "Atualize os detalhes da atividade" : "Adicione uma nova atividade ao sistema"}
        icon={<CheckSquare />}
      >
        <Button variant="outline" onClick={() => navigate("/activities")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </PageHeader>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações Básicas</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o título da atividade" {...field} />
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
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva a atividade" 
                            className="min-h-[120px]" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="activity_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="maintenance">Manutenção</SelectItem>
                              <SelectItem value="inspection">Inspeção</SelectItem>
                              <SelectItem value="legal">Legal</SelectItem>
                              <SelectItem value="financial">Financeira</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in_progress">Em progresso</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações Adicionais</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecionar data</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
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
                          <FormLabel>Data de Conclusão</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecionar data</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
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
                  
                  <FormField
                    control={form.control}
                    name="responsible_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome do responsável pela atividade" 
                            {...field} 
                            value={field.value || ""}
                          />
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
                        <FormLabel>Contato do Responsável</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Telefone ou email do responsável" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimated_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Estimado (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? null : parseFloat(value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="actual_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Real (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0,00"
                              {...field}
                              value={field.value === null ? "" : field.value}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? null : parseFloat(value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Related Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Itens Relacionados</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="property_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imóvel Relacionado</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um imóvel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {properties.map((property) => (
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
                  
                  <FormField
                    control={form.control}
                    name="contract_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contrato Relacionado</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um contrato" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {contracts.map((contract) => (
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
                </div>
                
                <FormField
                  control={form.control}
                  name="responsible_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas adicionais sobre a atividade" 
                          className="min-h-[120px]" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/activities")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <>
                      <CheckSquare className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Atualizando..." : "Salvando..."}
                    </>
                  ) : (
                    <>{isEditMode ? "Atualizar" : "Salvar"}</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
