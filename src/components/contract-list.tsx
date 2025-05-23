
import { useMemo } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, MoreHorizontal, Download, Eye, Pencil, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contract } from "@/types/contract";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// Configuration for status badges
const statusConfig = {
  active: {
    label: "Ativo",
    variant: "bg-emerald-500/10 text-emerald-500",
  },
  pending: {
    label: "Pendente",
    variant: "bg-amber-500/10 text-amber-500",
  },
  expired: {
    label: "Expirado",
    variant: "bg-red-500/10 text-red-500",
  },
  canceled: {
    label: "Cancelado",
    variant: "bg-gray-500/10 text-gray-500",
  },
  draft: {
    label: "Rascunho",
    variant: "bg-blue-500/10 text-blue-500",
  }
};

interface ContractListProps {
  contracts: Contract[];
  isLoading?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ContractList({
  contracts,
  isLoading = false,
  onView,
  onEdit,
  onDownload,
  onDelete,
}: ContractListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Add property titles to display names
  const contractsWithDisplayName = useMemo(() => {
    return contracts.map(contract => {
      let propertyName = "";
      let propertyLocation = "";
      
      if (contract.property) {
        propertyName = contract.property.title || "";
        
        // Build property location string
        const locationParts = [];
        if (contract.property.neighborhood) {
          locationParts.push(contract.property.neighborhood);
        }
        if (contract.property.city) {
          locationParts.push(contract.property.city);
        }
        propertyLocation = locationParts.join(", ");
      }
      
      return {
        ...contract,
        propertyName,
        propertyLocation
      };
    });
  }, [contracts]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Nenhum contrato encontrado</h3>
        <p className="text-muted-foreground">
          Você ainda não criou nenhum contrato ou os filtros aplicados não retornaram resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contrato</TableHead>
            <TableHead>Imóvel</TableHead>
            <TableHead>Locatário</TableHead>
            <TableHead>Vigência</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contractsWithDisplayName.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contract.title}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{contract.propertyName || "-"}</span>
                  {contract.propertyLocation && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <MapPin className="mr-1 h-3 w-3" />
                      <span>{contract.propertyLocation}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{contract.tenant_name || "-"}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <span>{formatDate(contract.start_date)}</span>
                  <span className="mx-2 text-muted-foreground">até</span>
                  <span>{formatDate(contract.end_date)}</span>
                </div>
              </TableCell>
              <TableCell>{formatCurrency(contract.value)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    statusConfig[contract.status as keyof typeof statusConfig]?.variant || 
                    "bg-gray-500/10 text-gray-500"
                  )}
                >
                  {statusConfig[contract.status as keyof typeof statusConfig]?.label || contract.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView && onView(contract.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Visualizar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit && onEdit(contract.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    {contract.document_url && (
                      <DropdownMenuItem onClick={() => onDownload && onDownload(contract.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDelete(contract.id)} 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
