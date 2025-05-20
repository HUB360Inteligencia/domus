
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserTable } from "@/components/users/user-table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

export default function UsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Verificar permissões
  const canInviteUsers = hasPermission("users.invite");
  
  // Buscar usuários
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Filtrar usuários baseado na busca
  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleInviteUser = () => {
    navigate("/users/invite");
  };

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
