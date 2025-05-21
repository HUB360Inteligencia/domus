
import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { PlusCircle } from 'lucide-react';
import { Activity } from '@/types/activity';
import { ActivityCard } from './activity-card';
import { Button } from '@/components/ui/button';

interface ActivityColumnProps {
  title: string;
  status: string;
  activities: Activity[];
  onDrop: (id: string, status: string) => Promise<void>;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onConvert?: (activityId: string) => Promise<void>;
  onAdd?: (status: string) => void;
}

export function ActivityColumn({
  title,
  status,
  activities,
  onDrop,
  onEdit,
  onDelete,
  onConvert,
  onAdd
}: ActivityColumnProps) {
  const [isOver, setIsOver] = useState(false);
  
  const [{ isOver: isDragOver }, drop] = useDrop({
    accept: 'ACTIVITY',
    drop: (item: { id: string }) => {
      onDrop(item.id, status);
    },
    hover: () => setIsOver(true),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  });
  
  return (
    <div
      ref={drop}
      className={`flex flex-col w-full min-w-[250px] h-full rounded-md ${
        isDragOver ? 'bg-muted/50' : 'bg-muted/30'
      }`}
    >
      <div className="p-2 font-medium text-muted-foreground flex items-center justify-between border-b">
        <div>{title}</div>
        <div className="bg-muted-foreground/20 px-2 py-1 rounded-full text-xs">
          {activities.length}
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
        {activities.map(activity => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onEdit={() => onEdit(activity)}
            onDelete={() => onDelete(activity.id)}
            onConvert={onConvert ? () => onConvert(activity.id) : undefined}
          />
        ))}
        {activities.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            Sem atividades nesta coluna
          </div>
        )}
      </div>
      {onAdd && (
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => onAdd(status)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>
      )}
    </div>
  );
}
