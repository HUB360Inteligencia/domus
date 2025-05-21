
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays, Kanban, List } from "lucide-react";
import { useActivities } from "@/hooks/use-activities";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityList } from "@/components/activities/activity-list";
import { ActivityForm } from "@/components/activities/activity-form";
import { ActivityBoard } from "@/components/activities/activity-board";
import { ActivityCalendar } from "@/components/activities/activity-calendar";
import { Activity } from "@/types/activity";

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const {
    activities,
    isLoadingActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    updateActivityStatus,
  } = useActivities();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);

  const handleAddActivity = () => {
    setCurrentActivity(null);
    setIsFormOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setCurrentActivity(activity);
    setIsFormOpen(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await deleteActivity(activityId);
    } catch (error) {
      console.error("Erro ao excluir atividade:", error);
    }
  };

  const handleSaveActivity = async (data: Partial<Activity>) => {
    try {
      if (currentActivity) {
        await updateActivity({ 
          id: currentActivity.id, 
          data 
        });
      } else {
        await createActivity(data as Omit<Activity, "id" | "created_at" | "updated_at">);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Erro ao salvar atividade:", error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateActivityStatus({ id, status: status as any });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Atividades"
          description="Organize e acompanhe suas atividades"
        />
        <Button
          className="flex items-center gap-2"
          onClick={handleAddActivity}
        >
          <Plus className="h-4 w-4" /> Nova Atividade
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="board">
            <Kanban className="h-4 w-4 mr-2" />
            Quadro
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendário
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <ActivityList
            activities={activities || []}
            isLoading={isLoadingActivities}
            onAdd={handleAddActivity}
            onEdit={handleEditActivity}
            onDelete={handleDeleteActivity}
          />
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <ActivityBoard
            activities={activities || []}
            onStatusChange={handleStatusChange}
            onEdit={handleEditActivity}
            onDelete={handleDeleteActivity}
            onAdd={handleAddActivity}
          />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <ActivityCalendar
            activities={activities || []}
            onEdit={handleEditActivity}
            onDelete={handleDeleteActivity}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentActivity ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
          </DialogHeader>
          <ActivityForm
            defaultValues={currentActivity || undefined}
            onSubmit={handleSaveActivity}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
