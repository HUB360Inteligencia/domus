
import { useState } from 'react';
import { Calendar, Clock, AlertCircle, Tag, User, DollarSign, Check } from 'lucide-react';
import { Activity, ActivityStatus } from '@/types/activity';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDrag } from 'react-dnd';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityCardProps {
  activity: Activity;
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: ActivityStatus) => void;
  onConvertToExpense?: (id: string) => void;
  canDrag?: boolean;
}

export function ActivityCard({ 
  activity, 
  onSelect, 
  onStatusChange,
  onConvertToExpense,
  canDrag = true 
}: ActivityCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'activity',
    item: { id: activity.id, currentStatus: activity.status },
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [activity.id, activity.status, canDrag]);
  
  const priorityConfig = {
    low: { color: 'bg-blue-500', label: 'Baixa' },
    medium: { color: 'bg-amber-500', label: 'Média' },
    high: { color: 'bg-red-500', label: 'Alta' }
  };
  
  const typeConfig = {
    maintenance: { icon: AlertCircle, label: 'Manutenção' },
    inspection: { icon: Tag, label: 'Inspeção' },
    legal: { icon: Tag, label: 'Legal' },
    financial: { icon: DollarSign, label: 'Financeira' },
    other: { icon: Tag, label: 'Outro' }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const showExpenseButton = activity.status === 'completed' && 
                           !activity.expense_id && 
                           (activity.actual_cost || activity.estimated_cost) && 
                           onConvertToExpense;

  return (
    <Card 
      ref={dragRef}
      className={`mb-2 cursor-pointer ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect && onSelect(activity.id)}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm line-clamp-1">{activity.title}</CardTitle>
            <CardDescription className="text-xs">
              {activity.description || 'Sem descrição'}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${priorityConfig[activity.priority].color} text-white text-xs`}
          >
            {priorityConfig[activity.priority].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs space-y-2">
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3" />
          <span>{typeConfig[activity.activity_type].label}</span>
        </div>
        
        {activity.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Prazo: {formatDate(activity.due_date)}</span>
          </div>
        )}
        
        {activity.responsible_name && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{activity.responsible_name}</span>
          </div>
        )}
        
        {(activity.estimated_cost || activity.actual_cost) && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>
              {activity.actual_cost 
                ? `Custo real: ${activity.actual_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` 
                : `Estimado: ${activity.estimated_cost?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            </span>
          </div>
        )}
      </CardContent>
      
      {(isHovered || showExpenseButton) && (
        <CardFooter className="p-2 flex justify-end">
          {showExpenseButton && (
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConvertToExpense && onConvertToExpense(activity.id);
              }}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Converter em Despesa
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
