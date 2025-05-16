
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
import { FileText, MoreHorizontal, Download, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contract {
  id: string;
  title: string;
  property: string;
  tenant?: string;
  startDate: string;
  endDate: string;
  value: number;
  status: "active" | "pending" | "expired";
}

interface ContractListProps {
  contracts: Contract[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function ContractList({
  contracts,
  onView,
  onEdit,
  onDownload,
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
  };

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
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contract.title}</span>
                </div>
              </TableCell>
              <TableCell>{contract.property}</TableCell>
              <TableCell>{contract.tenant || "-"}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <span>{formatDate(contract.startDate)}</span>
                  <span className="mx-2 text-muted-foreground">até</span>
                  <span>{formatDate(contract.endDate)}</span>
                </div>
              </TableCell>
              <TableCell>{formatCurrency(contract.value)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(statusConfig[contract.status].variant)}
                >
                  {statusConfig[contract.status].label}
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
                    <DropdownMenuItem onClick={() => onDownload && onDownload(contract.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download</span>
                    </DropdownMenuItem>
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
