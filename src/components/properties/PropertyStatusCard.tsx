
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, Home, Wrench } from 'lucide-react';

interface PropertyStatusCardProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyStatusCard: React.FC<PropertyStatusCardProps> = ({
  property,
  isLoading,
}) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      'available': {
        label: 'Disponível',
        variant: 'outline' as const,
        icon: Home,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      'rented': {
        label: 'Alugado',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      'airbnb': {
        label: 'Airbnb',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      'maintenance': {
        label: 'Em Manutenção',
        variant: 'destructive' as const,
        icon: Wrench,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      }
    };
    
    return configs[status as keyof typeof configs] || configs.available;
  };

  if (isLoading) {
    return (
      <Card className="h-full min-h-[280px] border border-gray-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Status do Imóvel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(property?.status || 'available');
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="h-full min-h-[140px] border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          </div>
          Status do Imóvel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status Atual</span>
          <Badge variant={statusConfig.variant} className="text-sm">
            {statusConfig.label}
          </Badge>
        </div>

        {property?.status === 'rented' && property?.tenant_name && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Locatário</span>
            <p className="font-medium">{property.tenant_name}</p>
          </div>
        )}

        {property?.status === 'maintenance' && (
          <div className="text-sm text-muted-foreground">
            <p>Propriedade em processo de manutenção</p>
          </div>
        )}

        {property?.status === 'available' && (
          <div className="text-sm text-muted-foreground">
            <p>Propriedade disponível para locação</p>
          </div>
        )}

        {property?.status === 'airbnb' && (
          <div className="text-sm text-muted-foreground">
            <p>Propriedade operando como Airbnb</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
