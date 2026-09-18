import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { clearPasswordRecovery, isPasswordRecoveryPending } from "@/lib/password-recovery";

const MIN_LENGTH = 8;

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { session, user, isLoading, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const error =
    password && password.length < MIN_LENGTH
      ? `A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`
      : confirmation && confirmation !== password
        ? "As senhas não conferem."
        : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (error || password.length < MIN_LENGTH || password !== confirmation) return;

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });
      if (updateError) throw updateError;

      clearPasswordRecovery();
      toast.success("Senha redefinida com sucesso!");
      navigate(user?.role === "system_admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AuthShell title="Redefinir senha">
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </AuthShell>
    );
  }

  if (!session) {
    return (
      <AuthShell
        title="Link expirado"
        description="O link de redefinição é válido por pouco tempo e só pode ser usado uma vez. Solicite um novo para continuar."
      >
        <div className="flex flex-col gap-3">
          <Button asChild className="h-12 w-full">
            <Link to="/reset-password">Solicitar novo link</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 w-full">
            <Link to="/login" onClick={clearPasswordRecovery}>
              Voltar para o login
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  // Fora de uma recuperação (link do e-mail), a troca de senha exige a senha atual no perfil
  if (!isPasswordRecoveryPending()) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AuthShell
      title="Crie uma nova senha"
      description={session.user.email ? `Conta: ${session.user.email}` : "Defina a nova senha de acesso."}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              autoFocus
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="h-12 w-full"
          disabled={isSaving || !!error || password.length < MIN_LENGTH || password !== confirmation}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar nova senha
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={isSaving}
          onClick={async () => {
            clearPasswordRecovery();
            await signOut();
            navigate("/login", { replace: true });
          }}
        >
          Cancelar e sair
        </Button>
      </form>
    </AuthShell>
  );
}
