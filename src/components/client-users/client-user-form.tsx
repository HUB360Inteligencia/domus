
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, KeyRound, Eye, EyeOff, Shield, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useCreateClientUser, useResetUserPassword, useCurrentUserClientId } from "@/hooks/use-client-users";
import { ClientUser } from "@/api/client-users";
import { logger } from "@/lib/logger";

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "";

// Schema for creating a new user
const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  role: z.string().default("user"),
  use_generic_password: z.boolean().default(true),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  is_primary: z.boolean().default(false),
  must_change_password: z.boolean().default(true),
}).refine((data) => {
  if (!data.use_generic_password) {
    return data.password && data.password.length >= 6;
  }
  return true;
}, {
  message: "A senha deve ter pelo menos 6 caracteres",
  path: ["password"],
}).refine((data) => {
  if (!data.use_generic_password && data.password) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// Schema for resetting password
const resetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador", description: "Acesso total à organização" },
  { value: "manager", label: "Gerente", description: "Gerencia imóveis e contratos" },
  { value: "user", label: "Usuário", description: "Acesso padrão ao sistema" },
  { value: "viewer", label: "Visualizador", description: "Apenas visualização" },
];

interface ClientUserFormProps {
  clientId?: string;
  existingUser?: ClientUser;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClientUserForm({ 
  clientId, 
  existingUser, 
  onSuccess, 
  onCancel 
}: ClientUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const isEditMode = !!existingUser;
  
  const { data: currentUserClientId } = useCurrentUserClientId();
  const effectiveClientId = clientId || currentUserClientId;
  
  const createUserMutation = useCreateClientUser();
  const resetPasswordMutation = useResetUserPassword();

  // Form for creating new user
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
      role: "user",
      use_generic_password: true,
      is_primary: false,
      must_change_password: true,
    },
  });

  // Form for resetting password
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const watchUseGenericPassword = createForm.watch("use_generic_password");

  // Handle creating a new user
  async function handleCreateUser(data: CreateUserFormValues) {
    if (!effectiveClientId) {
      toast.error("Nenhum cliente selecionado");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdUser = await createUserMutation.mutateAsync({
        client_id: effectiveClientId,
        email: data.email,
        password: data.use_generic_password ? undefined : data.password,
        use_generic_password: data.use_generic_password,
        first_name: data.first_name,
        last_name: data.last_name,
        is_primary: data.is_primary,
        role: data.role,
        must_change_password: data.must_change_password,
      });
      
      const password = createdUser.generated_password || data.password!;
      setCreatedInfo({ email: data.email, password });
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      logger.error("Erro ao criar usuário:", error);
      if (message.includes("email")) {
        toast.error("Este email já está cadastrado");
      } else {
        toast.error("Erro ao criar usuário. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle resetting password for existing user
  async function handleResetPassword(data: ResetPasswordFormValues) {
    if (!existingUser?.user_id) return;
    
    setIsSubmitting(true);
    try {
      await resetPasswordMutation.mutateAsync({
        user_id: existingUser.user_id,
        password: data.password,
      });
      
      toast.success("Senha redefinida com sucesso");
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: unknown) {
      logger.error("Erro ao redefinir senha:", error);
      toast.error("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyCredentials() {
    if (createdInfo) {
      navigator.clipboard.writeText(
        `Email: ${createdInfo.email}\nSenha: ${createdInfo.password}`
      );
      setCopiedPassword(true);
      toast.success("Credenciais copiadas!");
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  }

  if (!effectiveClientId && !isEditMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
          <CardDescription>Nenhum cliente selecionado</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onCancel}>Voltar</Button>
        </CardFooter>
      </Card>
    );
  }

  // Success state
  if (createdInfo) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Usuário criado com sucesso!</CardTitle>
          <CardDescription>
            Compartilhe as credenciais abaixo com o novo usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono font-semibold">{createdInfo.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Senha:</span>
              <span className="font-mono font-semibold">{createdInfo.password}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" size="sm" onClick={handleCopyCredentials}>
            {copiedPassword ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copiedPassword ? "Copiado!" : "Copiar credenciais"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ─── Reset Password Mode ───
  if (isEditMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>
            Defina uma nova senha para {existingUser.profile?.email}
          </CardDescription>
        </CardHeader>
        <Form {...resetPasswordForm}>
          <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)}>
            <CardContent className="space-y-4">
              <FormField
                control={resetPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite uma nova senha" {...field} />
                    </FormControl>
                    <FormDescription>Mínimo 6 caracteres</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirme a senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme a nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar senha
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    );
  }

  // ─── Create User Mode ───
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar novo usuário</CardTitle>
        <CardDescription>
          Crie um novo usuário para esta organização
        </CardDescription>
      </CardHeader>
      <Form {...createForm}>
        <form onSubmit={createForm.handleSubmit(handleCreateUser)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={createForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={createForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormDescription>Este será o login do usuário</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ─── Nível de Acesso ─── */}
            <FormField
              control={createForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Nível de acesso
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
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

            <Separator />

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
                  name="password"
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
                  name="confirmPassword"
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
                    <FormLabel className="text-base">Solicitar troca de senha</FormLabel>
                    <FormDescription>
                      O usuário deverá trocar a senha no primeiro acesso
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={createForm.control}
              name="is_primary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuário principal</FormLabel>
                    <FormDescription>
                      Definir como administrador principal da organização
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
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar usuário
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
