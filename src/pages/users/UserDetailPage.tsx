
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileForm } from "@/components/users/user-profile-form";
import { UserRolesForm } from "@/components/users/user-roles-form";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Verificar permissões
  const canEditUsers = hasPermission("users.edit");
  const canManageRoles = hasPermission("users.manage_roles");

  // Buscar detalhes do usuário
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Buscar dados do perfil
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Buscar papel/função do usuário
      const { data: role } = await supabase.rpc("get_user_role", {
        user_id: userId
      });
      
      return {
        id: userId,
        profile,
        role
      };
    },
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Usuário não encontrado"
          description="O usuário requisitado não foi encontrado."
        >
          <Button onClick={() => navigate("/users")}>Voltar</Button>
        </PageHeader>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <PageHeader
        title={`${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`}
        description={user.profile?.email}
      >
        <Button onClick={() => navigate("/users")}>Voltar</Button>
      </PageHeader>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {canManageRoles && <TabsTrigger value="roles">Funções</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <UserProfileForm 
            user={user}
            canEdit={canEditUsers}
          />
        </TabsContent>
        {canManageRoles && (
          <TabsContent value="roles" className="mt-4">
            <UserRolesForm 
              userId={user.id}
              currentRole={user.role}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
