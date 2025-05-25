
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyStatusCardProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyStatusCard: React.FC<PropertyStatusCardProps> = ({
  property,
  isLoading,
}) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'rented':
        return {
          label: 'Alugado',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <User className="h-4 w-4" />
        };
      case 'available':
        return {
          label: 'Disponível',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Clock className="h-4 w-4" />
        };
      case 'airbnb':
        return {
          label: 'Airbnb',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Calendar className="h-4 w-4" />
        };
      case 'maintenance':
        return {
          label: 'Em Manutenção',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Clock className="h-4 w-4" />
        };
      case 'sold':
        return {
          label: 'Vendido',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Calendar className="h-4 w-4" />
        };
      default:
        return {
          label: 'Status Indefinido',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-4 w-4" />
        };
    }
  };

  // Mock contract end date - in a real app, this would come from a contract relationship
  const getContractEndDate = () => {
    // This is a placeholder - in reality, you'd fetch this from a contracts table
    if (property?.status === 'rented') {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      return futureDate.toLocaleDateString('pt-BR');
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status do Imóvel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(property?.status || '');
  const contractEndDate = getContractEndDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status do Imóvel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status Atual</span>
          <Badge 
            variant="outline" 
            className={`${statusInfo.color} flex items-center gap-1`}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>

        {property?.status === 'rented' && (
          <>
            {property?.tenant_name && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Inquilino</span>
                <span className="font-medium">{property.tenant_name}</span>
              </div>
            )}
            
            {property?.tenant_contact && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Contato</span>
                <span className="font-medium">{property.tenant_contact}</span>
              </div>
            )}

            {contractEndDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Contrato até</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contractEndDate}</span>
                </div>
              </div>
            )}
          </>
        )}

        {property?.status === 'available' && (
          <div className="text-sm text-muted-foreground">
            Imóvel disponível para locação ou venda.
          </div>
        )}

        {property?.status === 'airbnb' && (
          <div className="text-sm text-muted-foreground">
            Imóvel disponível para hospedagem de curta duração.
          </div>
        )}

        {property?.status === 'maintenance' && (
          <div className="text-sm text-muted-foreground">
            Imóvel em processo de manutenção ou reforma.
          </div>
        )}

        {property?.agency_name && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Imobiliária</span>
              <span className="font-medium">{property.agency_name}</span>
            </div>
            {property?.agency_responsible && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Responsável</span>
                <span className="font-medium">{property.agency_responsible}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
