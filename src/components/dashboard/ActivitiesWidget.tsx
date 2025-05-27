
import React, { useState } from 'react';
import { MinimalCard } from '@/components/finances/dashboard/MinimalCard';
import { SimpleToggle } from '@/components/finances/dashboard/SimpleToggle';
import { useActivities } from '@/hooks/use-activities';
import { Calendar, Clock, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ActivitiesWidget() {
  const [viewMode, setViewMode] = useState<'upcoming' | 'pending'>('upcoming');
  const { activities, isLoadingActivities } = useActivities();
  const navigate = useNavigate();

  const viewOptions = [
    { value: 'upcoming', label: 'Próximas' },
    { value: 'pending', label: 'Pendentes' }
  ];

  // Filtrar atividades próximas (próximos 7 dias)
  const upcomingActivities = React.useMemo(() => {
    if (!activities) return [];
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return activities
      .filter(activity => {
        if (!activity.due_date) return false;
        const dueDate = new Date(activity.due_date);
        return dueDate >= now && dueDate <= nextWeek && activity.status !== 'completed';
      })
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5);
  }, [activities]);

  // Filtrar atividades pendentes
  const pendingActivities = React.useMemo(() => {
    if (!activities) return [];
    
    return activities
      .filter(activity => activity.status === 'pending')
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      })
      .slice(0, 5);
  }, [activities]);

  const displayActivities = viewMode === 'upcoming' ? upcomingActivities : pendingActivities;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoadingActivities) {
    return (
      <MinimalCard cols={3}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Atividades</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </MinimalCard>
    );
  }

  return (
    <MinimalCard cols={3}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Atividades</h3>
          <div className="flex items-center space-x-2">
            <SimpleToggle 
              value={viewMode}
              onValueChange={(value) => setViewMode(value as 'upcoming' | 'pending')}
              options={viewOptions}
            />
            <Button
              size="sm"
              onClick={() => navigate('/activities/new')}
              className="h-8 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {displayActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {viewMode === 'upcoming' ? 'Nenhuma atividade próxima' : 'Nenhuma atividade pendente'}
              </p>
            </div>
          ) : (
            displayActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getPriorityColor(activity.priority)}`}>
                    {activity.priority === 'high' ? '!' : activity.priority === 'medium' ? '•' : '·'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{activity.title}</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      {activity.due_date && (
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(activity.due_date), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </span>
                      )}
                      <span className="text-gray-400">•</span>
                      <span>{activity.activity_type}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            ))
          )}
        </div>

        {displayActivities.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
              className="w-full h-8 text-xs"
            >
              Ver todas as atividades
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </MinimalCard>
  );
}
