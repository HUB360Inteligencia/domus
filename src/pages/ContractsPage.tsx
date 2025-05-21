
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, FileText, AlertCircle } from "lucide-react";
import { useContracts } from "@/hooks/use-contracts";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function ContractsPage() {
  const navigate = useNavigate();
  const { contracts, isLoadingContracts } = useContracts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContracts = contracts?.filter(
    (contract) =>
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Ativo</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "terminated":
        return <Badge variant="outline">Encerrado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Contratos"
          description="Gerencie seus contratos"
        />
        <Button
          className="flex items-center gap-2"
          onClick={() => navigate("/contracts/new")}
        >
          <Plus className="h-4 w-4" /> Novo Contrato
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou inquilino..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoadingContracts ? (
            <div className="flex justify-center items-center h-64">
              Carregando...
            </div>
          ) : filteredContracts && filteredContracts.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <button onClick={() => navigate(`/contracts/${contract.id}`)} className="hover:underline">
                          {contract.title}
                        </button>
                      </TableCell>
                      <TableCell>{contract.tenant_name}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(contract.value)}
                      </TableCell>
                      <TableCell>{formatDate(contract.start_date)}</TableCell>
                      <TableCell>{formatDate(contract.end_date)}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/contracts/${contract.id}`)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/contracts/edit/${contract.id}`)}>
                              Editar
                            </DropdownMenuItem>
                            {contract.document_url && (
                              <DropdownMenuItem onClick={() => window.open(contract.document_url, "_blank")}>
                                <FileText className="mr-2 h-4 w-4" />
                                Documento
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border rounded-md border-dashed">
              <FileText className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="text-muted-foreground mb-4">Nenhum contrato encontrado.</p>
              <Button onClick={() => navigate("/contracts/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar contrato
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
