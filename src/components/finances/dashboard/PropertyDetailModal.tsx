
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PropertyAnalyticsData } from '@/api/property-analytics';
import { PropertyOverviewTab } from './modal/PropertyOverviewTab';
import { PropertyFinancialChartsTab } from './modal/PropertyFinancialChartsTab';
import { PropertyOccupancyTimelineTab } from './modal/PropertyOccupancyTimelineTab';
import { formatCurrency } from '@/utils/currency';
import { Building, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

interface PropertyDetailModalProps {
  property: PropertyAnalyticsData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
  if (!property) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'rented':
      case 'alugado':
        return 'default';
      case 'available':
      case 'disponível':
        return 'secondary';
      case 'maintenance':
      case 'manutenção':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'rented': 'Alugado',
      'available': 'Disponível',
      'maintenance': 'Manutenção',
      'sold': 'Vendido'
    };
    return translations[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Building className="h-5 w-5" />
                {property.title}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{property.city}</span>
                {property.neighborhood && <span>• {property.neighborhood}</span>}
                <Badge variant={getStatusBadgeVariant(property.status)} className="ml-2">
                  {translateStatus(property.status)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {formatCurrency(property.marketValue)}
              </div>
              <div className="text-sm text-muted-foreground">
                Valor de Mercado
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="financial-charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análise Financeira
            </TabsTrigger>
            <TabsTrigger value="occupancy-timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ocupação
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="overview" className="mt-6">
              <PropertyOverviewTab property={property} />
            </TabsContent>

            <TabsContent value="financial-charts" className="mt-6">
              <PropertyFinancialChartsTab property={property} />
            </TabsContent>

            <TabsContent value="occupancy-timeline" className="mt-6">
              <PropertyOccupancyTimelineTab property={property} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
