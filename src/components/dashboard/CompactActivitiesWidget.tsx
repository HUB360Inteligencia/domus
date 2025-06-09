
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '@/hooks/use-activities';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CompactActivitiesWidget() {
  const { activities, isLoadingActivities } = useActivities();
  const navigate = useNavigate();

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
      .slice(0, 3);
  }, [activities]);

  if (isLoadingActivities) {
    return (
      <Card className="shadow-sm bg-white border-gray-200 h-48">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Atividades</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-8 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow bg-white border-gray-200 h-48">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Atividades</h3>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>

        <div className="space-y-2 mb-3">
          {upcomingActivities.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Calendar className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">Nenhuma atividade próxima</p>
            </div>
          ) : (
            upcomingActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="text-gray-900 font-medium truncate">{activity.title}</div>
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {activity.due_date && formatDistanceToNow(new Date(activity.due_date), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/activities')}
          className="w-full h-6 text-xs"
        >
          Ver todas
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
