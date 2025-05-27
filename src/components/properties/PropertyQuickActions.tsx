
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Receipt, Activity, TrendingUp } from 'lucide-react';
import { Property } from '@/types/property';

interface PropertyQuickActionsProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyQuickActions: React.FC<PropertyQuickActionsProps> = ({
  property,
  isLoading,
}) => {
  const [activeModal, setActiveModal] = useState<'transaction' | 'activity' | 'valuation' | null>(null);

  const actions = [
    {
      id: 'transaction',
      label: 'Adicionar Transação',
      icon: Receipt,
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      description: 'Registrar receita ou despesa'
    },
    {
      id: 'activity',
      label: 'Adicionar Atividade',
      icon: Activity,
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
      description: 'Criar nova tarefa ou evento'
    },
    {
      id: 'valuation',
      label: 'Atualizar Avaliação',
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      description: 'Registrar novo valor de mercado'
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className={`h-auto p-3 justify-start ${action.color}`}
                onClick={() => setActiveModal(action.id as any)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <action.icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <Dialog open={activeModal === 'transaction'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Transação Financeira</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-muted-foreground">
              Formulário de transação será implementado aqui.
              Propriedade: {property?.title}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={activeModal === 'activity'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-muted-foreground">
              Formulário de atividade será implementado aqui.
              Propriedade: {property?.title}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Valuation Modal */}
      <Dialog open={activeModal === 'valuation'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Atualizar Avaliação de Mercado</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-muted-foreground">
              Formulário de avaliação será implementado aqui.
              Valor atual: {property?.value}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
