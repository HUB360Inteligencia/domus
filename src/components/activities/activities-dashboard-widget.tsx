
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity } from '@/types/activity';

interface ActivitiesDashboardWidgetProps {
  activities: Activity[];
  isLoading: boolean;
}

export function ActivitiesDashboardWidget({
  activities,
  isLoading
}: ActivitiesDashboardWidgetProps) {
  // Atividades próximas do vencimento (próximos 7 dias)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingActivities = activities
    .filter(activity => {
      if (activity.status === 'completed' || activity.status === 'canceled') return false;
      if (!activity.due_date) return false;
      
      const dueDate = new Date(activity.due_date);
      return dueDate <= nextWeek;
    })
    .sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5); // Mostrar apenas as 5 primeiras
  
  // Contagem por status
  const pendingCount = activities.filter(a => a.status === 'pending').length;
  const inProgressCount = activities.filter(a => a.status === 'in_progress').length;
  const completedCount = activities.filter(a => a.status === 'completed').length;
  
  // Contagem por prioridade
  const highPriorityCount = activities.filter(
    a => a.priority === 'high' && (a.status === 'pending' || a.status === 'in_progress')
  ).length;
  
  // Formato de data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM', { locale: ptBR });
  };
  
  // Função para determinar a cor do indicador de prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  if (isLoading) {
    return <Card>
      <CardHeader>
        <CardTitle>Atividades Pendentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 text-muted-foreground">Carregando...</div>
      </CardContent>
    </Card>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Atividades</span>
          {highPriorityCount > 0 && (
            <div className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center">
              <div className="bg-red-500 h-2 w-2 rounded-full mr-1"></div>
              {highPriorityCount} alta prioridade
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <div className="flex space-x-4">
            <div>
              <span className="font-medium">{pendingCount}</span> pendente{pendingCount !== 1 && 's'}
            </div>
            <div>
              <span className="font-medium">{inProgressCount}</span> em andamento
            </div>
            <div>
              <span className="font-medium">{completedCount}</span> concluída{completedCount !== 1 && 's'}
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          {upcomingActivities.length > 0 ? (
            upcomingActivities.map(activity => (
              <Link 
                to={`/activities?id=${activity.id}`}
                key={activity.id}
                className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors"
              >
                <div className={`h-3 w-3 rounded-full mr-2 ${getPriorityColor(activity.priority)}`}></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{activity.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {activity.due_date && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Vencimento: {formatDate(activity.due_date)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Sem atividades pendentes próximas</p>
            </div>
          )}
        </div>
        
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/activities">
            <LayoutList className="h-4 w-4 mr-2" />
            Ver todas as atividades
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
