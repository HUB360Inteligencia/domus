
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Target, Building, DollarSign } from 'lucide-react';
import { useGoals, useUpdateGoal, Goal } from '@/hooks/use-goals';
import { toast } from 'sonner';

export function GoalsEditor() {
  const { data: goals, isLoading } = useGoals();
  const updateGoal = useUpdateGoal();
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoals, setEditingGoals] = useState<Record<string, number>>({});

  const handleSave = async () => {
    try {
      const promises = Object.entries(editingGoals).map(([goalId, targetValue]) =>
        updateGoal.mutateAsync({ id: goalId, target_value: targetValue })
      );

      await Promise.all(promises);
      toast.success('Metas atualizadas com sucesso!');
      setIsOpen(false);
      setEditingGoals({});
    } catch (error) {
      toast.error('Erro ao atualizar metas');
    }
  };

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'occupancy':
        return <Building className="h-5 w-5" />;
      case 'revenue':
        return <DollarSign className="h-5 w-5" />;
      case 'active_contracts':
        return <Target className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getGoalLabel = (goalType: string) => {
    switch (goalType) {
      case 'occupancy':
        return 'Taxa de Ocupação (%)';
      case 'revenue':
        return 'Receita Mensal (R$)';
      case 'active_contracts':
        return 'Contratos Ativos';
      default:
        return goalType;
    }
  };

  const getGoalUnit = (goalType: string) => {
    switch (goalType) {
      case 'occupancy':
        return '%';
      case 'revenue':
        return 'R$';
      case 'active_contracts':
        return 'contratos';
      default:
        return '';
    }
  };

  if (isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Editar Metas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Metas do Período</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {goals?.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getGoalIcon(goal.goal_type)}
                  {getGoalLabel(goal.goal_type)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={`goal-${goal.id}`}>
                    Meta ({getGoalUnit(goal.goal_type)})
                  </Label>
                  <Input
                    id={`goal-${goal.id}`}
                    type="number"
                    value={editingGoals[goal.id] ?? goal.target_value}
                    onChange={(e) =>
                      setEditingGoals(prev => ({
                        ...prev,
                        [goal.id]: Number(e.target.value)
                      }))
                    }
                    min="0"
                    step={goal.goal_type === 'revenue' ? '100' : '0.1'}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1" disabled={updateGoal.isPending}>
              {updateGoal.isPending ? 'Salvando...' : 'Salvar Metas'}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
