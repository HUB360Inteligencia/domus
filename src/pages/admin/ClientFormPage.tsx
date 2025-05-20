
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useClient, useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { toast } from "sonner";

// Schema de validação para o formulário
const clientFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  document_number: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientFormPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const isEditing = !!clientId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: existingClient, isLoading: isClientLoading } = useClient(clientId);
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient(clientId);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document_number: "",
      is_active: true
    },
  });

  // Preencher o formulário com os dados existentes quando estiver editando
  useState(() => {
    if (isEditing && existingClient) {
      form.reset({
        name: existingClient.name,
        email: existingClient.email,
        phone: existingClient.phone || "",
        document_number: existingClient.document_number || "",
        is_active: existingClient.is_active,
      });
    }
  });

  async function onSubmit(data: ClientFormValues) {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateClientMutation.mutateAsync(data);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const newClient = await createClientMutation.mutateAsync(data);
        toast.success("Cliente criado com sucesso!");
        navigate(`/admin/clients/${newClient.id}`);
      }
      
      if (isEditing) {
        navigate(`/admin/clients/${clientId}`);
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEditing && isClientLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/clients")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? "Editar Cliente" : "Novo Cliente"}
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar informações do cliente" : "Cadastrar novo cliente"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Atualize as informações do cliente conforme necessário" 
              : "Preencha os dados para cadastrar um novo cliente no sistema"}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormDescription>Nome da empresa ou pessoa física</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>Email para contato</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="document_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="CPF ou CNPJ" {...field} />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isEditing && (
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status do cliente</FormLabel>
                        <FormDescription>
                          {field.value ? "Cliente ativo no sistema" : "Cliente inativo no sistema"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/clients")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar alterações" : "Criar cliente"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
