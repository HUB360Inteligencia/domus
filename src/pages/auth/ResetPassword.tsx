import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/use-profile';

const resetSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
});

export default function ResetPassword() {
  const { sendResetEmail, isSendingResetEmail } = useProfile();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const result = resetSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message || 'E-mail inválido');
      return;
    }

    try {
      await sendResetEmail(result.data.email);
      setIsSuccess(true);
    } catch (err) {
      // O toast de erro é exibido pelo hook
      console.error('Reset password error:', err);
    }
  }

  if (isSuccess) {
    return (
      <AuthShell title="Verifique seu e-mail" description={`Enviamos um link de redefinição para ${email}.`}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Abra o e-mail e clique no link para criar uma nova senha. Se não encontrar, confira a caixa de spam.</p>
          </div>
          <Button asChild variant="outline" className="h-12 w-full">
            <Link to="/login">Voltar para o login</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Esqueceu a senha?"
      description="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      footer={
        <Link to="/login" className="inline-flex items-center gap-2 font-medium hover:text-accent">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSendingResetEmail}
            autoComplete="email"
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="h-12 w-full" disabled={isSendingResetEmail}>
          {isSendingResetEmail && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar link de redefinição
        </Button>
      </form>
    </AuthShell>
  );
}
