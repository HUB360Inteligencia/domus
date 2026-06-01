
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { changeOwnPassword } from "@/api/client-users";

const changePasswordSchema = z.object({
  new_password: z.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "As senhas não conferem",
  path: ["confirm_password"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ForcePasswordChangeProps {
  open: boolean;
  onPasswordChanged: () => void;
}

export function ForcePasswordChange({ open, onPasswordChanged }: ForcePasswordChangeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(data: ChangePasswordFormValues) {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await changeOwnPassword({
        user_id: user.id,
        new_password: data.new_password,
      });

      toast.success("Senha alterada com sucesso! Bem-vindo ao sistema.");
      onPasswordChanged();
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar a senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { /* prevent closing */ }}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <KeyRound className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl">Altere sua senha</DialogTitle>
          <DialogDescription className="text-base">
            Sua conta foi criada com uma senha provisória. Por segurança, defina uma nova senha para continuar usando o sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite sua nova senha" {...field} />
                  </FormControl>
                  <FormDescription>Mínimo 6 caracteres</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirme a nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Definir nova senha e continuar
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
