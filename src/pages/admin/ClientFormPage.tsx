
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft,
  Loader2,
  Building,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import { createOrganizationWithUser } from "@/api/client-users";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/logger";

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "";

// Schema for creating a new client WITH user
const createClientSchema = z.object({
  // Organization fields
  org_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  org_email: z.string().email("Email inválido"),
  org_phone: z.string().optional(),
  org_document_number: z.string().optional(),
  // User fields
  user_first_name: z.string().min(1, "Nome é obrigatório"),
  user_last_name: z.string().min(1, "Sobrenome é obrigatório"),
  user_email: z.string().email("Email inválido"),
  use_generic_password: z.boolean().default(true),
  user_password: z.string().optional(),
  user_password_confirm: z.string().optional(),
  user_role: z.string().default("admin"),
  must_change_password: z.boolean().default(true),
}).refine((data) => {
  if (!data.use_generic_password) {
    return data.user_password && data.user_password.length >= 6;
  }
  return true;
}, {
  message: "A senha deve ter pelo menos 6 caracteres",
  path: ["user_password"],
}).refine((data) => {
  if (!data.use_generic_password && data.user_password) {
    return data.user_password === data.user_password_confirm;
  }
  return true;
}, {
  message: "As senhas não conferem",
  path: ["user_password_confirm"],
});

// Schema for editing an existing client (no user fields)
const editClientSchema = z.object({
  org_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  org_email: z.string().email("Email inválido"),
  org_phone: z.string().optional(),
  org_document_number: z.string().optional(),
  is_active: z.boolean().default(true),
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;
type EditClientFormValues = z.infer<typeof editClientSchema>;

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador", description: "Acesso total à organização" },
  { value: "manager", label: "Gerente", description: "Gerencia imóveis e contratos" },
  { value: "user", label: "Usuário", description: "Acesso padrão ao sistema" },
  { value: "viewer", label: "Visualizador", description: "Apenas visualização" },
];

export default function ClientFormPage() {
  const { clientId } = useParams<{ clientId: string }>();
  // Route uses ":id" for edit but ":clientId" in the route definition
  // Check both params
  const params = useParams();
  const editId = clientId || params.id;
  const navigate = useNavigate();
  const isEditing = !!editId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [createdUserInfo, setCreatedUserInfo] = useState<{ email: string; password: string } | null>(null);
  const queryClient = useQueryClient();
  
  const { data: existingClient, isLoading: isClientLoading } = useClient(editId);
  const updateClientMutation = useUpdateClient(editId);

  // Create form
  const createForm = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      org_name: "",
      org_email: "",
      org_phone: "",
      org_document_number: "",
      user_first_name: "",
      user_last_name: "",
      user_email: "",
      use_generic_password: true,
      user_password: "",
      user_password_confirm: "",
      user_role: "admin",
      must_change_password: true,
    },
  });

  // Edit form
  const editForm = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      org_name: "",
      org_email: "",
      org_phone: "",
      org_document_number: "",
      is_active: true,
    },
  });

  // Auto-fill org email when user email is typed (for create mode)
  const watchUserEmail = createForm.watch("user_email");
  const watchOrgEmail = createForm.watch("org_email");
  
  useEffect(() => {
    // If org email is empty or was auto-synced, sync it with user email
    if (!isEditing && watchUserEmail && (!watchOrgEmail || watchOrgEmail === "")) {
      createForm.setValue("org_email", watchUserEmail);
    }
  }, [watchUserEmail, isEditing]);

  // Fill edit form with existing data
  useEffect(() => {
    if (isEditing && existingClient) {
      editForm.reset({
        org_name: existingClient.name,
        org_email: existingClient.email,
        org_phone: existingClient.phone || "",
        org_document_number: existingClient.document_number || "",
        is_active: existingClient.is_active,
      });
    }
  }, [existingClient, isEditing, editForm]);

  const watchUseGenericPassword = createForm.watch("use_generic_password");

  async function onCreateSubmit(data: CreateClientFormValues) {
    setIsSubmitting(true);
    try {
      const result = await createOrganizationWithUser({
        org_name: data.org_name,
        org_email: data.org_email,
        org_phone: data.org_phone,
        org_document_number: data.org_document_number,
        user_email: data.user_email,
        user_password: data.use_generic_password ? undefined : data.user_password,
        use_generic_password: data.use_generic_password,
        user_first_name: data.user_first_name,
        user_last_name: data.user_last_name,
        user_role: data.user_role,
        must_change_password: data.must_change_password,
      });
      
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      const password = result.user?.generated_password || data.user_password!;
      setCreatedUserInfo({ email: data.user_email, password });
      toast.success("Organização e usuário criados com sucesso!");
      
      // Navigate to the new client's detail page after a short delay
      setTimeout(() => {
        navigate(`/admin/clients/${result.client.id}`);
      }, 3000);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      logger.error("Erro ao criar organização:", error);
      if (message.includes("email")) {
        toast.error("Este email já está cadastrado no sistema");
      } else {
        toast.error(message || "Erro ao criar organização. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onEditSubmit(data: EditClientFormValues) {
    setIsSubmitting(true);
    try {
      await updateClientMutation.mutateAsync({
        name: data.org_name,
        email: data.org_email,
        phone: data.org_phone,
        document_number: data.org_document_number,
        is_active: data.is_active,
      });
      toast.success("Cliente atualizado com sucesso!");
      navigate(`/admin/clients/${editId}`);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyPassword() {
    if (createdUserInfo) {
      navigator.clipboard.writeText(
        `Email: ${createdUserInfo.email}\nSenha: ${createdUserInfo.password}`
      );
      setCopiedPassword(true);
      toast.success("Dados copiados para a área de transferência!");
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  }

  if (isEditing && isClientLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Success state after creating
  if (createdUserInfo) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Organização Criada com Sucesso!</CardTitle>
            <CardDescription className="text-base">
              A organização e o usuário administrador foram criados. Compartilhe as credenciais abaixo com o responsável.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Email de acesso:</span>
                <span className="font-mono text-sm font-semibold">{createdUserInfo.email}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Senha provisória:</span>
                <span className="font-mono text-sm font-semibold">{createdUserInfo.password}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <KeyRound className="h-4 w-4" />
                <span>O usuário será solicitado a trocar a senha no primeiro acesso.</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleCopyPassword}>
              {copiedPassword ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copiedPassword ? "Copiado!" : "Copiar credenciais"}
            </Button>
            <Button onClick={() => navigate("/admin/clients")}>
              Ir para listagem
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ─── Edit Mode ───
  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Editar informações da organização
            </CardTitle>
            <CardDescription>
              Atualize as informações do cliente conforme necessário
            </CardDescription>
          </CardHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="org_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da organização</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Imobiliária Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="org_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email da organização</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@empresa.com" {...field} />
                      </FormControl>
                      <FormDescription>Email para contato e faturamento</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="org_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="org_document_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ / CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="XX.XXX.XXX/XXXX-XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status da organização</FormLabel>
                        <FormDescription>
                          {field.value ? "Organização ativa no sistema" : "Organização inativa — todos os usuários perdem acesso"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/clients")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar alterações
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    );
  }

  // ─── Create Mode ───
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Nova Organização</h1>
      </div>

      <Form {...createForm}>
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6 max-w-3xl mx-auto">
          
          {/* ─── SECTION 1: Dados da Organização ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Dados da Organização
              </CardTitle>
              <CardDescription>
                Informações da empresa ou pessoa que vai usar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={createForm.control}
                name="org_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da organização *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Imobiliária Central" {...field} />
                    </FormControl>
                    <FormDescription>Nome da empresa ou pessoa física</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="org_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="org_document_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ / CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="XX.XXX.XXX/XXXX-XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ─── SECTION 2: Dados do Usuário Administrador ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Usuário Administrador
              </CardTitle>
              <CardDescription>
                Dados de acesso do responsável principal desta organização. Este usuário poderá fazer login imediatamente após a criação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="user_first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="user_last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="user_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de acesso *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="joao@empresa.com" {...field} />
                    </FormControl>
                    <FormDescription>Este será o login do usuário no sistema</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="org_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email da organização (faturamento)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="financeiro@empresa.com" {...field} />
                    </FormControl>
                    <FormDescription>Pode ser igual ao email de acesso. Usado para faturamento e contato comercial.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-2" />

              {/* ─── Nível de Acesso ─── */}
              <FormField
                control={createForm.control}
                name="user_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Nível de acesso
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível de acesso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{role.label}</span>
                              <span className="text-xs text-muted-foreground">— {role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-2" />

              {/* ─── Senha ─── */}
              <FormField
                control={createForm.control}
                name="use_generic_password"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Gerar senha temporária
                      </FormLabel>
                      <FormDescription>
                        Uma senha forte será gerada e exibida uma única vez após a criação.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!watchUseGenericPassword && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <FormField
                    control={createForm.control}
                    name="user_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha personalizada *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Digite a senha" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>Mínimo 6 caracteres</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="user_password_confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirme a senha *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirme a senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={createForm.control}
                name="must_change_password"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Solicitar troca de senha no primeiro acesso</FormLabel>
                      <FormDescription>
                        O usuário será obrigado a definir uma nova senha ao fazer login pela primeira vez
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ─── Actions ─── */}
          <div className="flex justify-between max-w-3xl mx-auto">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/clients")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar organização e usuário
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
