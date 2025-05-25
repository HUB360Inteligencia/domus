
import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, ActivityStatus } from '@/types/activity';
import { Property } from '@/types/property';

interface ActivityListProps {
  activities: Activity[];
  properties: Property[];
  isLoading?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: ActivityStatus) => void;
  onConvertToExpense?: (id: string) => void;
}

const statusConfig = {
  pending: { label: 'Pendente', variant: 'outline' as const },
  in_progress: { label: 'Em Progresso', variant: 'default' as const },
  completed: { label: 'Concluída', variant: 'secondary' as const },
  cancelled: { label: 'Cancelada', variant: 'destructive' as const }
};

const priorityConfig = {
  low: { label: 'Baixa', variant: 'outline' as const },
  medium: { label: 'Média', variant: 'default' as const },
  high: { label: 'Alta', variant: 'destructive' as const }
};

export function ActivityList({
  activities,
  properties,
  isLoading,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onConvertToExpense
}: ActivityListProps) {
  
  const getPropertyInfo = (propertyId?: string) => {
    if (!propertyId) return { title: 'Sem imóvel', neighborhood: '' };
    const property = properties.find(p => p.id === propertyId);
    return property ? { title: property.title, neighborhood: property.neighborhood || '' } : { title: 'Imóvel não encontrado', neighborhood: '' };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma atividade encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Imóvel</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => {
            const property = getPropertyInfo(activity.property_id);
            return (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{property.title}</p>
                    {property.neighborhood && (
                      <p className="text-xs text-muted-foreground">{property.neighborhood}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {activity.activity_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[activity.status].variant}>
                    {statusConfig[activity.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={priorityConfig[activity.priority].variant}>
                    {priorityConfig[activity.priority].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {activity.due_date ? (
                    <span className="text-sm">
                      {format(new Date(activity.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem prazo</span>
                  )}
                </TableCell>
                <TableCell>
                  {activity.responsible_name || (
                    <span className="text-muted-foreground text-sm">Não definido</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelect?.(activity.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(activity.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {activity.status === 'completed' && activity.actual_cost && (
                        <DropdownMenuItem onClick={() => onConvertToExpense?.(activity.id)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Converter em Despesa
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(activity.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
