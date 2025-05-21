
import { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarIcon, Edit, MoreHorizontal, Trash2 } from 'lucide-react';

import { Activity } from '@/types/activity';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface ActivityCalendarProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
}

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

export function ActivityCalendar({
  activities,
  onEdit,
  onDelete
}: ActivityCalendarProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Activity | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Converter atividades para o formato de eventos do calendário
  useEffect(() => {
    const activityEvents = activities
      .filter(activity => activity.due_date || activity.start_date)
      .map(activity => {
        const startDate = activity.start_date ? new Date(activity.start_date) : 
                          activity.due_date ? new Date(activity.due_date) : new Date();
        
        // Se só tiver due_date, usa o mesmo dia para início e fim
        const endDate = activity.due_date ? new Date(activity.due_date) : startDate;
        
        // Garantir que a data de fim não seja anterior à data de início
        if (endDate < startDate) {
          endDate.setTime(startDate.getTime());
        }
        
        // Ajustar para ser evento de dia inteiro
        endDate.setHours(23, 59, 59);
        
        return {
          id: activity.id,
          title: activity.title,
          start: startDate,
          end: endDate,
          allDay: true,
          resource: activity
        };
      });
    
    setEvents(activityEvents);
  }, [activities]);
  
  // Manipular clique em um evento
  const handleSelectEvent = useCallback((event: Event) => {
    const activity = activities.find(a => a.id === event.id);
    if (activity) {
      setSelectedEvent(activity);
      setDetailsOpen(true);
    }
  }, [activities]);
  
  // Definir estilo de eventos com base na prioridade
  const eventStyleGetter = useCallback((event: Event) => {
    const activity = event.resource as Activity;
    
    let backgroundColor = '#3788d8'; // default
    
    if (activity) {
      switch (activity.priority) {
        case 'high':
          backgroundColor = '#ef4444'; // red
          break;
        case 'medium':
          backgroundColor = '#eab308'; // yellow
          break;
        case 'low':
          backgroundColor = '#22c55e'; // green
          break;
      }
      
      // Eventos concluídos ou cancelados ficam mais opacos
      if (activity.status === 'completed' || activity.status === 'canceled') {
        backgroundColor = activity.status === 'completed' 
          ? '#22c55e80' // verde com opacidade
          : '#6b728080'; // cinza com opacidade
      }
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: '#fff',
        border: '0px',
        display: 'block'
      }
    };
  }, []);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return moment(dateString).format('DD/MM/YYYY');
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };
  
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };
  
  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'maintenance': return 'Manutenção';
      case 'contract': return 'Contrato';
      case 'payment': return 'Pagamento';
      case 'visit': return 'Visita';
      case 'documentation': return 'Documentação';
      case 'other': return 'Outro';
      default: return type;
    }
  };
  
  const messages = {
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há atividades neste período.'
  };

  return (
    <>
      <div className="h-[calc(100vh-220px)]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          messages={messages}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
        />
      </div>
      
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {selectedEvent && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedEvent.title}</span>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { 
                        setDetailsOpen(false);
                        onEdit(selectedEvent);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => { 
                          setDetailsOpen(false);
                          onDelete(selectedEvent.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogTitle>
              <DialogDescription>
                {selectedEvent.description || 'Sem descrição.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Tipo</h4>
                  <p className="text-sm">{getActivityTypeText(selectedEvent.activity_type)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <p className="text-sm">{getStatusText(selectedEvent.status)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Prioridade</h4>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${
                      selectedEvent.priority === 'high' ? 'bg-red-500' :
                      selectedEvent.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <span className="text-sm">{getPriorityText(selectedEvent.priority)}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Custo Estimado</h4>
                  <p className="text-sm">
                    {selectedEvent.estimated_cost 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(selectedEvent.estimated_cost)
                      : '-'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Data de Início</h4>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedEvent.start_date)}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Data de Vencimento</h4>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedEvent.due_date)}</span>
                  </div>
                </div>
              </div>
              
              {selectedEvent.responsible_name && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Responsável</h4>
                  <p className="text-sm">{selectedEvent.responsible_name}</p>
                  {selectedEvent.responsible_contact && (
                    <p className="text-sm text-muted-foreground">{selectedEvent.responsible_contact}</p>
                  )}
                  {selectedEvent.responsible_notes && (
                    <p className="text-sm mt-1 italic">{selectedEvent.responsible_notes}</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
