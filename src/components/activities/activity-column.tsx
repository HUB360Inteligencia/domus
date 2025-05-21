
import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Activity } from '@/types/activity';
import { ActivityCard } from './activity-card';

interface ActivityColumnProps {
  title: string;
  status: string;
  activities: Activity[];
  onDrop: (id: string, status: string) => Promise<void>;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onConvert?: (activityId: string) => Promise<void>;
}

export function ActivityColumn({
  title,
  status,
  activities,
  onDrop,
  onEdit,
  onDelete,
  onConvert
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
      </div>
    </div>
  );
}
