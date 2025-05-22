
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CalendarClock, CheckSquare } from "lucide-react";

import { useActivities } from "@/hooks/use-activities";
import { useProperties } from "@/hooks/use-properties";
import { useContracts } from "@/hooks/use-contracts";
import { ActivityFormData } from "@/types/activity";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ActivityForm } from "@/components/activities/activity-form";
import { toast } from "sonner";

export default function ActivityFormPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get id from search params for edit mode
  const activityId = searchParams.get("id");
  // Get optional date param for new activity with pre-filled date
  const dateParam = searchParams.get("date");
  
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ActivityFormData> | null>(null);
  
  const { properties } = useProperties();
  const { contracts } = useContracts();
  
  const { 
    activities, 
    createActivity, 
    updateActivity,
    setSelectedActivityId,
    selectedActivity,
    isCreating,
    isUpdating
  } = useActivities();

  // For edit mode, load the activity data
  useEffect(() => {
    if (activityId) {
      setSelectedActivityId(activityId);
    } else if (dateParam) {
      // Pre-fill with date from params if provided
      setInitialData({
        due_date: dateParam,
      });
    }
  }, [activityId, dateParam, setSelectedActivityId]);

  // Update initial data when selected activity changes
  useEffect(() => {
    if (selectedActivity) {
      setInitialData(selectedActivity);
    }
  }, [selectedActivity]);

  // Handle form submission
  const handleSubmit = async (formData: ActivityFormData) => {
    try {
      setLoading(true);
      
      if (activityId) {
        // Update existing activity
        await updateActivity({ id: activityId, data: formData });
        toast.success("Atividade atualizada com sucesso");
      } else {
        // Create new activity
        await createActivity(formData);
        toast.success("Atividade criada com sucesso");
      }
      
      navigate("/activities");
    } catch (error) {
      console.error("Error submitting activity:", error);
      toast.error(activityId 
        ? "Erro ao atualizar atividade" 
        : "Erro ao criar atividade"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    navigate(activityId ? `/activities/detail?id=${activityId}` : "/activities");
  };
  
  // Map properties for form select options
  const propertyOptions = properties.map(property => ({
    label: property.title,
    value: property.id
  }));
  
  // Map contracts for form select options
  const contractOptions = contracts.map(contract => ({
    label: contract.title,
    value: contract.id
  }));

  // Show loading state if we're editing and still loading the activity data
  if (activityId && !initialData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={activityId ? "Editar Atividade" : "Nova Atividade"}
        description={activityId 
          ? "Modifique os dados da atividade existente" 
          : "Adicione uma nova atividade ao sistema"
        }
        icon={<CheckSquare />}
      >
        <Button variant="outline" onClick={handleCancel}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </PageHeader>

      <Card className="p-6">
        <ActivityForm
          initialData={initialData || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isCreating || isUpdating || loading}
          propertyOptions={propertyOptions}
          contractOptions={contractOptions}
        />
      </Card>
    </div>
  );
}
