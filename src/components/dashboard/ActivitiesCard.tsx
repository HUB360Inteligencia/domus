
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity } from '@/types/activity';
import { Property } from '@/types/property';
import { ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActivitiesCardProps {
  activities: Activity[];
  properties: Property[];
  isLoading: boolean;
}

export function ActivitiesCard({ activities, properties, isLoading }: ActivitiesCardProps) {
  const navigate = useNavigate();

  const getPropertyInfo = (propertyId?: string) => {
    if (!propertyId) return { title: 'Sem imóvel', neighborhood: '', type: '' };
    const property = properties.find(p => p.id === propertyId);
    return property || { title: 'Imóvel não encontrado', neighborhood: '', type: '' };
  };

  const overdueActivities = activities
    .filter(activity => 
      activity.status !== 'completed' && 
      activity.due_date && 
      isPast(parseISO(activity.due_date))
    )
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime())
    .slice(0, 8); // Show more activities

  const upcomingActivities = activities
    .filter(activity => 
      activity.status !== 'completed' && 
      activity.due_date && 
      isFuture(parseISO(activity.due_date))
    )
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime())
    .slice(0, 8); // Show more activities

  const handleActivityClick = (activityId: string) => {
    navigate(`/activities/${activityId}`);
  };

  const handleViewAllActivities = () => {
    navigate('/activities');
  };

  const handleAddActivity = () => {
    navigate('/activities/new');
  };

  const renderActivityList = (activitiesList: Activity[], emptyMessage: string) => {
    if (activitiesList.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-xs md:text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activitiesList.map((activity) => {
          const property = getPropertyInfo(activity.property_id);
          const dueDate = activity.due_date ? parseISO(activity.due_date) : null;
          
          return (
            <div 
              key={activity.id} 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleActivityClick(activity.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-xs md:text-sm truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {property.title} {property.neighborhood && `- ${property.neighborhood}`}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {activity.activity_type}
                    </Badge>
                    <Badge 
                      variant={activity.priority === 'high' ? 'destructive' : 'secondary'} 
                      className="text-xs"
                    >
                      {activity.priority}
                    </Badge>
                    {dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  {activity.responsible_name && (
                    <p className="text-xs text-muted-foreground">
                      Responsável: {activity.responsible_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {activitiesList.length > 0 && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleViewAllActivities();
              }}
              className="w-full"
            >
              Ver todas as atividades
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="px-3 md:px-6 py-3 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm md:text-lg">Atividades</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Acompanhe suas tarefas pendentes e próximas
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleAddActivity}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming" className="text-xs md:text-sm">
                Próximas ({upcomingActivities.length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs md:text-sm">
                Atrasadas ({overdueActivities.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              {renderActivityList(upcomingActivities, "Nenhuma atividade próxima.")}
            </TabsContent>
            <TabsContent value="overdue" className="mt-4">
              {renderActivityList(overdueActivities, "Nenhuma atividade atrasada.")}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
