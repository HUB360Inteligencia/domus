
import { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { ActivityCard } from './activity-card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Activity, ActivityStatus, BoardColumn } from '@/types/activity';

interface ActivityBoardProps {
  columns: BoardColumn[];
  isLoading?: boolean;
  onAdd?: () => void;
  onStatusChange?: (id: string, newStatus: ActivityStatus) => void;
  onSelect?: (id: string) => void;
  onConvertToExpense?: (id: string) => void;
}

export function ActivityBoard({ 
  columns, 
  isLoading, 
  onAdd, 
  onStatusChange,
  onSelect,
  onConvertToExpense
}: ActivityBoardProps) {
  const renderColumn = (column: BoardColumn) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'activity',
      drop: (item: { id: string, currentStatus: ActivityStatus }) => {
        if (item.currentStatus !== column.id) {
          onStatusChange && onStatusChange(item.id, column.id);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }), [column.id, onStatusChange]);

    return (
      <div 
        key={column.id} 
        className="flex flex-col w-72 min-w-[18rem] bg-card rounded-lg p-2"
      >
        <div className="flex justify-between items-center mb-3 p-2">
          <h3 className="font-medium">{column.title}</h3>
          <span className="text-xs text-muted-foreground">
            {column.activities.length}
          </span>
        </div>
        
        <div 
          ref={drop}
          className={`flex-1 p-1 rounded-md min-h-[50vh] overflow-y-auto ${
            isOver ? 'bg-gray-100 dark:bg-gray-800/30' : ''
          }`}
        >
          {column.activities.map((activity) => (
            <ActivityCard 
              key={activity.id}
              activity={activity}
              onSelect={onSelect}
              onStatusChange={onStatusChange}
              onConvertToExpense={onConvertToExpense}
            />
          ))}
          
          {column.activities.length === 0 && !isLoading && (
            <div className="h-24 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md">
              Nenhuma atividade nesta coluna
            </div>
          )}
        </div>
        
        {column.id === 'pending' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2" 
            onClick={onAdd}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Atividade
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex overflow-x-auto pb-4 gap-4">
      {isLoading ? (
        <div className="w-full flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        columns.map(renderColumn)
      )}
    </div>
  );
}
