
import { useState } from "react";
import {
  User,
  Mail,
  MoreVertical,
  Shield,
  Key,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientUser } from "@/api/client-users";
import { useClientUsers } from "@/hooks/use-client-users";
import { ClientUserForm } from "./client-user-form";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientUsersListProps {
  clientId: string;
  onAddUserClick?: () => void;
}

export function ClientUsersList({ 
  clientId,
  onAddUserClick,
}: ClientUsersListProps) {
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  
  const { data: clientUsers, isLoading } = useClientUsers(clientId);

  const handleResetPassword = (user: ClientUser) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
  };

  const handleResetPasswordSuccess = () => {
    setIsResetPasswordOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </div>
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Gerencie os usuários deste cliente</CardDescription>
        </div>
        <Button onClick={onAddUserClick}>Adicionar usuário</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientUsers && clientUsers.length > 0 ? (
          clientUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {user.profile?.first_name} {user.profile?.last_name}
                    {user.is_primary && (
                      <Badge variant="outline" className="ml-2">Principal</Badge>
                    )}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    <span>{user.profile?.email}</span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleResetPassword(user)}>
                    <Key className="h-4 w-4 mr-2" />
                    Redefinir senha
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="h-4 w-4 mr-2" />
                    Alterar permissões
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Este cliente não possui usuários cadastrados</p>
            <Button variant="link" onClick={onAddUserClick}>
              Adicionar o primeiro usuário
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedUser && (
            <ClientUserForm 
              clientId={clientId}
              existingUser={selectedUser}
              onSuccess={handleResetPasswordSuccess}
              onCancel={() => setIsResetPasswordOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
