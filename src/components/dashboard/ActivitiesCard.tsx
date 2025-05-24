
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isFuture, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity } from '@/types/activity';
import { Property } from '@/types/property';

interface ActivitiesCardProps {
  activities: Activity[];
  properties: Property[];
  isLoading: boolean;
}

export function ActivitiesCard({ activities, properties, isLoading }: ActivitiesCardProps) {
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
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime());

  const upcomingActivities = activities
    .filter(activity => 
      activity.status !== 'completed' && 
      activity.due_date && 
      isFuture(parseISO(activity.due_date))
    )
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime())
    .slice(0, 10); // Limit to 10 upcoming activities

  const renderActivityList = (activitiesList: Activity[], emptyMessage: string) => {
    if (activitiesList.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-xs md:text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {activitiesList.map((activity) => {
          const property = getPropertyInfo(activity.property_id);
          const dueDate = activity.due_date ? parseISO(activity.due_date) : null;
          
          return (
            <div key={activity.id} className="p-3 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-xs md:text-sm truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {property.title} - {property.neighborhood}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {activity.activity_type}
                    </Badge>
                    {dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="px-3 md:px-6 py-3 md:py-6">
        <CardTitle className="text-sm md:text-lg">Atividades</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Acompanhe suas tarefas pendentes e próximas
        </CardDescription>
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
