import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Property } from "@/types/property";
import { fetchActivitiesByProperty } from "@/api/activities";
import { useQuery } from "@tanstack/react-query";
import { useActivityMutations } from "@/hooks/use-activity-mutations";
import { ActivityForm } from "@/components/activities/activity-form";
import { Activity as ActivityType } from "@/types/activity";

interface PropertyActivitiesSectionProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyActivitiesSection: React.FC<PropertyActivitiesSectionProps> = ({
  property,
  isLoading: isPropertyLoading,
}) => {
  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['activities', 'property', property?.id],
    queryFn: () => fetchActivitiesByProperty(property!.id),
    enabled: !!property?.id,
  });

  const { deleteActivity, updateActivity, isUpdating } = useActivityMutations();
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir esta atividade?")) {
      await deleteActivity(id);
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingActivity) return;
    try {
      await updateActivity({ id: editingActivity.id, ...data });
      setEditingActivity(null);
    } catch (e) {
      console.error(e);
    }
  };

  const isLoading = isPropertyLoading || isActivitiesLoading;

  if (isLoading) {
    return (
      <Card className="premium-panel dark:premium-panel-dark border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="premium-panel dark:premium-panel-dark border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 p-8 text-center">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Nenhuma atividade registrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Não há histórico de atividades para este imóvel. Use o botão "Ações Rápidas" para registrar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="premium-panel dark:premium-panel-dark border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{activity.title}</h4>
                    <Badge variant="outline" className="border-white/20">
                      {activity.status === 'completed' ? 'Concluída' : 
                       activity.status === 'pending' ? 'Pendente' : 
                       activity.status === 'in_progress' ? 'Em andamento' : 'Cancelada'}
                    </Badge>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {activity.activity_type}
                    </Badge>
                  </div>
                  
                  {activity.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    {activity.responsible_name && (
                      <span className="flex items-center gap-1">
                        Responsável: <span className="text-foreground">{activity.responsible_name}</span>
                      </span>
                    )}
                    {activity.start_date && (
                      <span className="flex items-center gap-1">
                        Início: <span className="text-foreground">{format(parseISO(activity.start_date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                      </span>
                    )}
                    {activity.due_date && (
                      <span className="flex items-center gap-1 text-amber-500">
                        Prazo: <span>{format(parseISO(activity.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                      </span>
                    )}
                    {(activity.estimated_cost || activity.actual_cost) && (
                      <span className="flex items-center gap-1 font-medium text-emerald-500">
                        Custo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(activity.actual_cost || activity.estimated_cost || 0)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-white"
                    onClick={() => setEditingActivity(activity)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/20 hover:text-red-400"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar atividade</DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <ActivityForm
              initialData={{
                ...editingActivity,
                start_date: editingActivity.start_date ? new Date(editingActivity.start_date) : undefined,
                due_date: editingActivity.due_date ? new Date(editingActivity.due_date) : undefined,
                completed_at: editingActivity.completed_at ? new Date(editingActivity.completed_at) : undefined,
              } as any}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingActivity(null)}
              isSubmitting={isUpdating}
              propertyOptions={property ? [{ value: property.id, label: property.title }] : []}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
