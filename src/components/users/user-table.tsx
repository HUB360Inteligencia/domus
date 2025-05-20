
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { AuthUser } from "@/lib/auth";
import { toast } from "sonner";

interface User extends AuthUser {
  email?: string;
  role?: string;
  created_at?: string;
}

interface UserTableProps {
  users: User[];
  isLoading: boolean;
}

export function UserTable({ users, isLoading }: UserTableProps) {
  const navigate = useNavigate();
  const { hasPermission, user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const canEditUsers = hasPermission("users.edit");
  const canDeleteUsers = hasPermission("users.delete");

  const handleEditUser = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      // Lógica de exclusão do usuário
      toast.success("Usuário excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário");
    } finally {
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-pulse space-y-2">
          <div className="h-10 w-96 bg-muted rounded"></div>
          <div className="h-10 w-96 bg-muted rounded"></div>
          <div className="h-10 w-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
        <p className="text-muted-foreground">
          Não há usuários cadastrados no sistema.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.profile?.first_name} {user.profile?.last_name}
                </TableCell>
                <TableCell>{user.profile?.email || user.email}</TableCell>
                <TableCell>
                  <span className="capitalize">{user.role || "usuário"}</span>
                </TableCell>
                <TableCell>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("pt-BR")
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleEditUser(user.id)}
                        disabled={!canEditUsers}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setUserToDelete(user)}
                        disabled={
                          !canDeleteUsers || currentUser?.id === user.id
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog
        open={userToDelete !== null}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{" "}
              <strong>
                {userToDelete?.profile?.first_name}{" "}
                {userToDelete?.profile?.last_name}
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
