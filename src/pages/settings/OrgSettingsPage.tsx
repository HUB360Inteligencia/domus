
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCurrentUserClientId, useClientUsers } from "@/hooks/use-client-users";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ClientUserForm } from "@/components/client-users/client-user-form";
import { ClientUsersList } from "@/components/client-users/client-users-list";
import {
  Users,
  Settings,
  Shield,
  Building,
  UserPlus,
  AlertCircle,
  Mail,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatPhone, formatCpfCnpj } from "@/utils/masks";

// Fetch organization info for the current user
async function fetchCurrentUserOrganization(): Promise<{
  id: string;
  name: string;
  email: string;
  phone?: string;
  document_number?: string;
  is_active: boolean;
} | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: clientUser, error: cuError } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cuError || !clientUser) return null;

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, email, phone, document_number, is_active")
    .eq("id", clientUser.client_id)
    .single();

  if (clientError || !client) return null;

  return client;
}

function useCurrentOrganization() {
  return useQuery({
    queryKey: ["current-user-organization"],
    queryFn: fetchCurrentUserOrganization,
    staleTime: 1000 * 60 * 5,
  });
}

// Role display helpers
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "Administrador", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  manager: { label: "Gerente", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  user: { label: "Usuário", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  viewer: { label: "Visualizador", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
};

export default function OrgSettingsPage() {
  const { user, hasPermission } = useAuth();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const { data: org, isLoading: isOrgLoading } = useCurrentOrganization();
  const { data: currentClientId } = useCurrentUserClientId();

  const isAdmin = user?.role === "admin" || user?.role === "system_admin";

  if (isOrgLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Organização não encontrada</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Você não está vinculado a nenhuma organização. Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Configurações da Organização"
        description={`Gerencie as configurações e usuários de ${org.name}`}
      />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organização
          </TabsTrigger>
        </TabsList>

        {/* ─── Aba Usuários ─── */}
        <TabsContent value="users" className="space-y-6">
          {isAdmin ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Equipe da Organização</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os membros e níveis de acesso da sua organização.
                  </p>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </div>

              {/* Reutiliza o ClientUsersList — ele já sabe resolver o clientId do usuário logado */}
              <ClientUsersList />

              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="sm:max-w-md md:max-w-lg">
                  <ClientUserForm
                    clientId={currentClientId || undefined}
                    onSuccess={() => setIsAddUserOpen(false)}
                    onCancel={() => setIsAddUserOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Acesso restrito
                </CardTitle>
                <CardDescription>
                  Apenas administradores podem gerenciar os usuários da organização.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Entre em contato com o administrador da sua organização para solicitar alterações.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Aba Organização ─── */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Dados da Organização
              </CardTitle>
              <CardDescription>
                Informações gerais da sua organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-sm font-semibold">{org.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>
                    <Badge variant={org.is_active ? "default" : "secondary"}>
                      {org.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {org.email}
                  </p>
                </div>
                {org.phone && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="text-sm">{formatPhone(org.phone)}</p>
                  </div>
                )}
                {org.document_number && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">CNPJ/CPF</label>
                    <p className="text-sm">{formatCpfCnpj(org.document_number)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info sobre o usuário logado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Meu Perfil na Organização
              </CardTitle>
              <CardDescription>
                Suas informações e nível de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-sm font-semibold">
                    {user?.profile?.first_name} {user?.profile?.last_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{user?.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Nível de Acesso</label>
                  <div>
                    {user?.role && ROLE_LABELS[user.role] ? (
                      <Badge className={ROLE_LABELS[user.role].color}>
                        {ROLE_LABELS[user.role].label}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{user?.role || "—"}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
