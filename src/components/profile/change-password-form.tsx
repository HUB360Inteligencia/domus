import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function ChangePasswordForm() {
  const { user } = useAuth();
  const { changePassword, isChangingPassword, sendResetEmail, isSendingResetEmail } = useProfile();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!currentPassword) newErrors.currentPassword = 'A senha atual é obrigatória';
    if (!newPassword) newErrors.newPassword = 'A nova senha é obrigatória';
    else if (newPassword.length < 6) newErrors.newPassword = 'A senha deve ter pelo menos 6 caracteres';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Error is handled in the hook
    }
  }

  async function handleSendResetEmail() {
    if (!user?.email) return;
    await sendResetEmail(user.email);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Segurança
        </CardTitle>
        <CardDescription>
          Altere sua senha ou solicite um link de redefinição por email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isChangingPassword}
              placeholder="••••••••"
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword}
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isChangingPassword || !currentPassword || !newPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
          <div>
            <h4 className="text-sm font-medium">Esqueceu a senha atual?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Enviaremos um link para o seu email para redefinir a senha com segurança.
            </p>
          </div>
          <Button 
            variant="secondary" 
            onClick={handleSendResetEmail}
            disabled={isSendingResetEmail || !user?.email}
            className="shrink-0"
          >
            {isSendingResetEmail ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Enviar link de redefinição
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
