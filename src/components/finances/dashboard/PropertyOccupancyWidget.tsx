
import React from 'react';
import { MinimalCard } from './MinimalCard';
import { Progress } from '@/components/ui/progress';
import { Home, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';

export function PropertyOccupancyWidget() {
  const metrics = useDashboardMetrics();
  const navigate = useNavigate();

  return (
    <MinimalCard className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Propriedades</h3>
          <Home className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Status Principal - Layout melhorado */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {metrics.rentedProperties}
              <span className="text-lg font-normal text-gray-500 ml-1">
                / {metrics.totalProperties}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              propriedades locadas
            </div>
          </div>
          
          {/* Taxa de Ocupação */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taxa de Ocupação</span>
              <span className="text-sm font-semibold text-gray-900">
                {metrics.occupancyRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.occupancyRate} className="h-2" />
          </div>
        </div>

        {/* Botões de Ação - Em linhas separadas para melhor responsividade */}
        <div className="mt-6 space-y-2">
          <Button
            size="sm"
            onClick={() => navigate('/properties/new')}
            className="w-full h-9 text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Propriedade
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/properties')}
            className="w-full h-9 text-sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Todas as Propriedades
          </Button>
        </div>
      </div>
    </MinimalCard>
  );
}
