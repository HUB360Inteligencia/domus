
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  MoreHorizontal, 
  Search, 
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useClients, useDeleteClient, useToggleClientStatus } from "@/hooks/use-clients";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Client } from "@/api/clients";
import { formatCpfCnpj } from "@/utils/masks";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading, isError } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const deleteClientMutation = useDeleteClient();
  const toggleClientStatusMutation = useToggleClientStatus();

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClient = async () => {
    if (clientToDelete) {
      try {
        await deleteClientMutation.mutateAsync(clientToDelete.id);
        setClientToDelete(null);
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
      }
    }
  };

  const handleToggleStatus = async (client: Client) => {
    try {
      await toggleClientStatusMutation.mutateAsync({
        clientId: client.id,
        isActive: !client.is_active
      });
    } catch (error) {
      console.error("Erro ao alterar status do cliente:", error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-destructive mb-2" />
        <h2 className="text-lg font-semibold mb-2">Erro ao carregar clientes</h2>
        <p className="text-muted-foreground mb-4">Ocorreu um erro ao buscar a lista de clientes.</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Organizações</h1>
        <Button onClick={() => navigate("/admin/clients/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova organização
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredClients?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md border-dashed">
          <p className="text-muted-foreground mb-4">Nenhuma organização encontrada.</p>
          <Button onClick={() => navigate("/admin/clients/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar organização
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link to={`/admin/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.document_number ? formatCpfCnpj(client.document_number) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}>
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/clients/edit/${client.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(client)}>
                          {client.is_active ? (
                            <>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setClientToDelete(client)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog de confirmação para excluir cliente */}
      <Dialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.name}"? 
              Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientToDelete(null)}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteClient}
              disabled={deleteClientMutation.isPending}
            >
              {deleteClientMutation.isPending ? "Excluindo..." : "Excluir cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
