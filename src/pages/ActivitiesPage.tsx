
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { 
  CheckSquare, 
  Plus, 
  Calendar as CalendarIcon, 
  KanbanSquare, 
  Search 
} from "lucide-react";

import { useActivities } from "@/hooks/use-activities";
import { useProperties } from "@/hooks/use-properties";
import { useContracts } from "@/hooks/use-contracts";
import { ActivityStatus, ActivityFilters } from "@/types/activity";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityBoard } from "@/components/activities/activity-board";
import { ActivityFiltersBar } from "@/components/activities/activity-filters";
import { ActivityCalendar } from "@/components/activities/activity-calendar";

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const { properties } = useProperties();
  const { contracts } = useContracts();
  
  const { 
    activities,
    filteredActivities,
    groupedActivities,
    isLoading,
    handleStatusChange,
    handleFilterChange,
    convertToExpense
  } = useActivities();

  // Function to handle creating a new activity
  const handleAddActivity = () => {
    navigate("/activities/new");
  };
  
  // Function to handle clicking on an activity
  const handleSelectActivity = (id: string) => {
    navigate(`/activities/detail?id=${id}`);
  };
  
  // Map properties for select options
  const propertyOptions = properties.map(property => ({
    label: property.title,
    value: property.id
  }));
  
  // Map contracts for select options
  const contractOptions = contracts.map(contract => ({
    label: contract.title,
    value: contract.id
  }));
  
  // Filter activities by search query
  const searchedActivities = searchQuery.length > 0 
    ? filteredActivities.filter(activity => 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())))
    : filteredActivities;
  
  // Group searched activities by status
  const searchedGroupedActivities = [
    { id: 'pending' as ActivityStatus, title: 'Pendentes', activities: searchedActivities.filter(a => a.status === 'pending') },
    { id: 'in_progress' as ActivityStatus, title: 'Em Progresso', activities: searchedActivities.filter(a => a.status === 'in_progress') },
    { id: 'completed' as ActivityStatus, title: 'Concluídas', activities: searchedActivities.filter(a => a.status === 'completed') },
    { id: 'cancelled' as ActivityStatus, title: 'Canceladas', activities: searchedActivities.filter(a => a.status === 'cancelled') }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Atividades"
        description="Gerencie as atividades relacionadas aos seus imóveis"
        icon={<CheckSquare />}
      >
        <Button onClick={handleAddActivity}>
          <Plus className="h-4 w-4 mr-2" /> Nova Atividade
        </Button>
      </PageHeader>
      
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtros
        </Button>
      </div>
      
      {showFilters && (
        <ActivityFiltersBar 
          onFilterChange={handleFilterChange}
          propertyOptions={propertyOptions}
          contractOptions={contractOptions}
        />
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <KanbanSquare className="h-4 w-4" />
            Quadro
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="board" className="mt-4">
          <DndProvider backend={HTML5Backend}>
            <ActivityBoard 
              columns={searchedGroupedActivities} 
              isLoading={isLoading}
              onAdd={handleAddActivity}
              onStatusChange={handleStatusChange}
              onSelect={handleSelectActivity}
              onConvertToExpense={convertToExpense}
            />
          </DndProvider>
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-4">
          <ActivityCalendar
            activities={searchedActivities}
            isLoading={isLoading}
            onSelect={handleSelectActivity}
            onDateSelect={(date) => {
              // Navigate to new activity form with the selected date pre-filled
              const dateStr = date.toISOString().split('T')[0];
              navigate(`/activities/new?date=${dateStr}`);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
