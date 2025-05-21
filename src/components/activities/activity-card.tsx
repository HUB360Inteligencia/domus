
import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Clock, Edit, Trash2, Receipt, Home, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { Activity } from '@/types/activity';

interface ActivityCardProps {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onConvert?: () => Promise<void>;
}

export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onConvert
}: ActivityCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'ACTIVITY',
    item: { id: activity.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });
  
  const handleConvert = async () => {
    if (!onConvert) return;
    
    setIsConverting(true);
    try {
      await onConvert();
    } catch (error) {
      console.error('Erro ao converter atividade:', error);
    } finally {
      setIsConverting(false);
    }
  };
  
  // Determinar a cor do indicador de prioridade
  const getPriorityColor = () => {
    switch (activity.priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const isCompleted = activity.status === 'completed';
  const showConvertButton = isCompleted && 
                            activity.property_id && 
                            !activity.expense_id && 
                            onConvert;
  
  return (
    <Card 
      ref={drag}
      className={`cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <div className={`h-3 w-3 rounded-full ${getPriorityColor()} mt-1.5`} />
          <div className="flex-1">
            <h3 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {activity.title}
            </h3>
            {activity.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {activity.property_id && (
            <div className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              <span>Imóvel</span>
            </div>
          )}
          
          {activity.contract_id && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Contrato</span>
            </div>
          )}
          
          {activity.due_date && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(activity.due_date)}</span>
            </div>
          )}
        </div>
        
        {activity.responsible_name && (
          <div className="text-xs bg-muted/50 rounded px-2 py-1">
            Resp: {activity.responsible_name}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-2 pt-0 flex justify-between">
        {activity.expense_id && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Receipt className="h-3 w-3" />
            <span>Convertido em despesa</span>
          </div>
        )}
        
        {showActions && (
          <div className="flex gap-1 ml-auto">
            {showConvertButton && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleConvert}
                disabled={isConverting}
                className="h-7 px-2"
              >
                <Receipt className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
