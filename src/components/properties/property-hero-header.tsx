
import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyHeroHeaderProps {
  property: Property | null | undefined;
  isLoading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export const PropertyHeroHeader: React.FC<PropertyHeroHeaderProps> = ({
  property,
  isLoading,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const [activeModal, setActiveModal] = useState<'transaction' | 'activity' | 'valuation' | null>(null);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'available': { label: 'Disponível', variant: 'outline' as const },
      'rented': { label: 'Alugado', variant: 'default' as const },
      'airbnb': { label: 'Airbnb', variant: 'secondary' as const },
      'maintenance': { label: 'Manutenção', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        
        <div className="relative p-8">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>

          {/* Property Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {property?.title || 'Propriedade'}
                </h1>
                <p className="text-lg text-gray-600">
                  {property?.address}, {property?.city} - {property?.state}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {property?.status && getStatusBadge(property.status)}
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(property?.value)}
              </span>
              {property?.rental_value && (
                <span className="text-lg text-gray-600">
                  Aluguel: {formatCurrency(property.rental_value)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions - Horizontal Layout */}
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-sm">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveModal('transaction')}
                className="text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Transação
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveModal('activity')}
                className="text-green-600 hover:bg-green-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Atividade
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveModal('valuation')}
                className="text-purple-600 hover:bg-purple-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Avaliação
              </Button>
            </div>
          </div>
        </div>
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
              Valor atual: {formatCurrency(property?.value)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
