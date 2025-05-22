
import { Button } from '@/components/ui/button';

interface ActivityFormActionsProps {
  onCancel?: () => void;
  isSubmitting?: boolean;
  isEditing: boolean;
}

export const ActivityFormActions = ({ 
  onCancel, 
  isSubmitting, 
  isEditing 
}: ActivityFormActionsProps) => {
  return (
    <div className="flex justify-end gap-2">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
      </Button>
    </div>
  );
};
