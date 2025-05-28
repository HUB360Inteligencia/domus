
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useCreateClientUser, useResetUserPassword, useCurrentUserClientId } from "@/hooks/use-client-users";
import { ClientUser } from "@/api/client-users";

// Schema for creating a new user
const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
  confirmPassword: z.string(),
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  is_primary: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// Schema for resetting password
const resetPasswordSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

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
  const [isSuccess, setIsSuccess] = useState(false);
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
      is_primary: false,
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

  // Handle creating a new user
  async function handleCreateUser(data: CreateUserFormValues) {
    if (!effectiveClientId) {
      toast.error("Nenhum cliente selecionado");
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserMutation.mutateAsync({
        client_id: effectiveClientId,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        is_primary: data.is_primary,
      });
      
      setIsSuccess(true);
      toast.success("Usuário criado com sucesso");
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      if (error.message?.includes("email")) {
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
      
      setIsSuccess(true);
      toast.success("Senha redefinida com sucesso");
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast.error("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!effectiveClientId && !isEditMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
          <CardDescription>
            Nenhum cliente selecionado
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onCancel}>Voltar</Button>
        </CardFooter>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>{isEditMode ? "Senha atualizada!" : "Usuário criado!"}</span>
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? "A senha foi redefinida com sucesso."
              : "O usuário foi criado e pode fazer login no sistema."
            }
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
                    <FormDescription>
                      Mínimo 8 caracteres, com pelo menos 1 maiúscula e 1 número
                    </FormDescription>
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
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar novo usuário</CardTitle>
        <CardDescription>
          Crie um novo usuário para o cliente
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
                    <FormLabel>Nome</FormLabel>
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
                    <FormLabel>Sobrenome</FormLabel>
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormDescription>Este será o login do usuário</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={createForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite uma senha" {...field} />
                  </FormControl>
                  <FormDescription>
                    Mínimo 8 caracteres, com pelo menos 1 maiúscula e 1 número
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={createForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirme a senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirme a senha" {...field} />
                  </FormControl>
                  <FormMessage />
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
                      Definir este usuário como administrador principal do cliente
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
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
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
