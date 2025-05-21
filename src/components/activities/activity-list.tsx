
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FileText, Loader2, MoreHorizontal, PlusCircle, Receipt, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Activity } from '@/types/activity';

interface ActivityListProps {
  activities: Activity[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onConvert?: (activityId: string) => Promise<void>;
}

const activityTypeMap: Record<string, string> = {
  'maintenance': 'Manutenção',
  'contract': 'Contrato',
  'payment': 'Pagamento',
  'visit': 'Visita',
  'documentation': 'Documentação',
  'other': 'Outro'
};

const activityStatusMap: Record<string, string> = {
  'pending': 'Pendente',
  'in_progress': 'Em Andamento',
  'completed': 'Concluído',
  'canceled': 'Cancelado'
};

const priorityMap: Record<string, { label: string, color: string }> = {
  'high': { label: 'Alta', color: 'bg-red-500' },
  'medium': { label: 'Média', color: 'bg-yellow-500' },
  'low': { label: 'Baixa', color: 'bg-green-500' }
};

export function ActivityList({
  activities,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onConvert
}: ActivityListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isConverting, setIsConverting] = useState<string | null>(null);
  
  // Filtrar atividades com base nos termos de busca e filtros
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesType = typeFilter === 'all' || activity.activity_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || activity.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });
  
  const handleConvert = async (activityId: string) => {
    if (!onConvert) return;
    
    setIsConverting(activityId);
    try {
      await onConvert(activityId);
    } catch (error) {
      console.error('Erro ao converter atividade:', error);
    } finally {
      setIsConverting(null);
    }
  };
  
  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando atividades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex flex-1 flex-wrap gap-2">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tipo de Atividade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(activityTypeMap).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(activityStatusMap).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              {Object.entries(priorityMap).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>
      
      {filteredActivities.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className={`h-3 w-3 rounded-full ${priorityMap[activity.priority]?.color || 'bg-gray-500'}`} />
                  </TableCell>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell>{activityTypeMap[activity.activity_type] || activity.activity_type}</TableCell>
                  <TableCell>{activityStatusMap[activity.status] || activity.status}</TableCell>
                  <TableCell>
                    {activity.due_date && (
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(activity.due_date)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{activity.responsible_name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(activity)}>
                          Editar
                        </DropdownMenuItem>
                        {activity.status === 'completed' &&
                         activity.property_id &&
                         !activity.expense_id &&
                         onConvert && (
                          <DropdownMenuItem 
                            onClick={() => handleConvert(activity.id)}
                            disabled={isConverting === activity.id}
                          >
                            {isConverting === activity.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Convertendo...
                              </>
                            ) : (
                              <>
                                <Receipt className="mr-2 h-4 w-4" />
                                Converter em Despesa
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(activity.id)} className="text-destructive">
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
      ) : (
        <div className="flex flex-col items-center justify-center py-8 border rounded-md bg-muted/30">
          <FileText className="h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">Nenhuma atividade encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' ? 
              'Tente ajustar os filtros de busca.' : 
              'Cadastre sua primeira atividade.'}
          </p>
          {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && priorityFilter === 'all' && (
            <Button onClick={onAdd} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Atividade
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
