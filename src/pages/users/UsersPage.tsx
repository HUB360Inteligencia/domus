
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserTable } from "@/components/users/user-table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { useUsers } from "@/hooks/use-users";

export default function UsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Verificar permissões - agora usando users.manage para system_admin
  const canInviteUsers = hasPermission("users.invite") || hasPermission("users.manage");
  
  // Buscar usuários usando o hook correto
  const { data: users, isLoading, error } = useUsers();

  // Filtrar usuários baseado na busca
  const filteredUsers = users?.filter(user => 
    user.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleInviteUser = () => {
    navigate("/users/invite");
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="Erro ao carregar usuários"
          description="Não foi possível carregar a lista de usuários."
        />
        <div className="mt-4">
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Gerencie os usuários e suas permissões no sistema."
      >
        {canInviteUsers && (
          <Button onClick={handleInviteUser}>
            <Plus className="mr-2 h-4 w-4" /> Convidar Usuário
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuários..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <UserTable 
        users={filteredUsers} 
        isLoading={isLoading} 
      />
    </div>
  );
}
