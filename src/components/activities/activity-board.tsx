
import { useMemo } from 'react';

import { Activity } from '@/types/activity';
import { ActivityColumn } from './activity-column';

interface ActivityBoardProps {
  activities: Activity[];
  onStatusChange: (id: string, status: string) => Promise<void>;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onConvert?: (activityId: string) => Promise<void>;
  onAdd?: (status: string) => void;
}

export function ActivityBoard({
  activities,
  onStatusChange,
  onEdit,
  onDelete,
  onConvert,
  onAdd
}: ActivityBoardProps) {
  const columns = useMemo(() => [
    {
      title: 'A Fazer',
      status: 'pending',
      activities: activities.filter(a => a.status === 'pending')
    },
    {
      title: 'Em Andamento',
      status: 'in_progress',
      activities: activities.filter(a => a.status === 'in_progress')
    },
    {
      title: 'Concluído',
      status: 'completed',
      activities: activities.filter(a => a.status === 'completed')
    },
    {
      title: 'Cancelado',
      status: 'canceled',
      activities: activities.filter(a => a.status === 'canceled')
    }
  ], [activities]);
  
  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] overflow-x-auto py-4">
      {columns.map(column => (
        <ActivityColumn
          key={column.status}
          title={column.title}
          status={column.status}
          activities={column.activities}
          onDrop={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onConvert={onConvert}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}
