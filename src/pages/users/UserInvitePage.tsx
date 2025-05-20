
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Esquema de validação do formulário
const inviteFormSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  firstName: z.string().min(1, { message: "Nome é obrigatório" }),
  lastName: z.string().min(1, { message: "Sobrenome é obrigatório" }),
  role: z.enum(["admin", "user"], { 
    required_error: "Selecione uma função" 
  }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export default function UserInvitePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "user",
    },
  });

  async function onSubmit(data: InviteFormValues) {
    setIsSubmitting(true);

    try {
      // Enviar convite
      const { error } = await supabase.auth.admin.inviteUserByEmail(data.email, {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role
        }
      });

      if (error) throw error;

      toast.success("Convite enviado com sucesso!", {
        description: `Um email de convite foi enviado para ${data.email}`,
        action: {
          label: "Fechar",
          onClick: () => {},
        },
      });

      navigate("/users");
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      toast.error("Falha ao enviar convite", {
        description: "Ocorreu um erro ao enviar o convite. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container py-6">
      <PageHeader
        heading="Convidar Usuário"
        description="Envie um convite por email para um novo usuário."
      >
        <Button onClick={() => navigate("/users")}>Voltar</Button>
      </PageHeader>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um email de convite será enviado para este endereço.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define as permissões do usuário no sistema.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/users")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Enviar Convite
                    </>
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
