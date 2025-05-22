
import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Activity } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivityCalendarProps {
  activities: Activity[];
  isLoading?: boolean;
  onSelect?: (id: string) => void;
  onDateSelect?: (date: Date) => void;
}

export function ActivityCalendar({
  activities,
  isLoading = false,
  onSelect,
  onDateSelect
}: ActivityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get all days in the current month
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  
  // Get all the activities for the current month
  const activitiesInMonth = useMemo(() => {
    // Filter activities that have either start_date or due_date in the current month
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    return activities.filter(activity => {
      if (!activity.start_date && !activity.due_date) return false;
      
      const startDate = activity.start_date ? new Date(activity.start_date) : null;
      const dueDate = activity.due_date ? new Date(activity.due_date) : null;
      
      return (startDate && startDate >= start && startDate <= end) ||
             (dueDate && dueDate >= start && dueDate <= end);
    });
  }, [activities, currentMonth]);
  
  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };
  
  // Get activities for a specific date
  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    return activities.filter(activity => {
      const startDateStr = activity.start_date ? activity.start_date.split('T')[0] : null;
      const dueDateStr = activity.due_date ? activity.due_date.split('T')[0] : null;
      
      return startDateStr === dateStr || dueDateStr === dateStr;
    });
  };
  
  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-slate-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date())}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day labels */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
          <div key={day} className="text-center font-medium p-2">
            {day}
          </div>
        ))}
        
        {/* Padding for first day of month */}
        {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 p-1 border border-dashed border-gray-200 rounded-md"></div>
        ))}
        
        {/* Days with activities */}
        {daysInMonth.map(day => {
          const dayActivities = getActivitiesForDate(day);
          const isToday = new Date().toDateString() === day.toDateString();
          
          return (
            <div 
              key={day.toString()} 
              className={`h-24 p-1 border rounded-md overflow-hidden ${
                isToday ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => onDateSelect && onDateSelect(day)}
            >
              <div className="text-xs font-medium mb-1">
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1 overflow-y-auto max-h-[calc(100%-20px)]">
                {dayActivities.slice(0, 3).map(activity => (
                  <div 
                    key={activity.id}
                    className="text-xs p-1 rounded cursor-pointer truncate hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect && onSelect(activity.id);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(activity.status)}`} />
                      <span className="truncate">{activity.title}</span>
                    </div>
                  </div>
                ))}
                {dayActivities.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayActivities.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Activity Summary */}
      <Card className="p-4">
        <h3 className="font-medium mb-2">Atividades do mês: {activitiesInMonth.length}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Pendentes: {activitiesInMonth.filter(a => a.status === 'pending').length}
          </Badge>
          <Badge variant="secondary">
            Em Progresso: {activitiesInMonth.filter(a => a.status === 'in_progress').length}
          </Badge>
          <Badge variant="secondary">
            Concluídas: {activitiesInMonth.filter(a => a.status === 'completed').length}
          </Badge>
          <Badge variant="secondary">
            Canceladas: {activitiesInMonth.filter(a => a.status === 'cancelled').length}
          </Badge>
        </div>
      </Card>
    </div>
  );
}
