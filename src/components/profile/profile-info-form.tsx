import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, User, Mail, Calendar, Shield } from 'lucide-react';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  system_admin: { label: 'System Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  admin: { label: 'Administrador', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  manager: { label: 'Gerente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  user: { label: 'Usuário', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  viewer: { label: 'Visualizador', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

export function ProfileInfoForm() {
  const { user } = useAuth();
  const { updateProfileInfo, isUpdatingProfile } = useProfile();

  const [firstName, setFirstName] = useState(user?.profile?.first_name || '');
  const [lastName, setLastName] = useState(user?.profile?.last_name || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createdAt = user?.profile?.created_at
    ? new Date(user.profile.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const roleInfo = user?.role ? ROLE_LABELS[user.role] : null;

  const hasChanges =
    firstName !== (user?.profile?.first_name || '') ||
    lastName !== (user?.profile?.last_name || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.first_name = 'Nome é obrigatório';
    if (!lastName.trim()) newErrors.last_name = 'Sobrenome é obrigatório';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await updateProfileInfo({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>
          Atualize seu nome e veja as informações da sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">Nome</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Seu nome"
                disabled={isUpdatingProfile}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">Sobrenome</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Seu sobrenome"
                disabled={isUpdatingProfile}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Email — read-only */}
          <div className="space-y-2">
            <Label htmlFor="profile-email">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email
              </span>
            </Label>
            <Input
              id="profile-email"
              value={user?.email || ''}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado por aqui. Entre em contato com o suporte se necessário.
            </p>
          </div>

          {/* Account info — read-only */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
            {roleInfo && (
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Nível de acesso:</span>
                <Badge className={roleInfo.color} variant="secondary">
                  {roleInfo.label}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Conta criada em {createdAt}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isUpdatingProfile || !hasChanges}>
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
