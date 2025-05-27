
import React from 'react';
import { Property } from '@/types/property';
import { PropertyContractSection } from './PropertyContractSection';
import { PropertyOccupancySection } from './PropertyOccupancySection';
import { Separator } from '@/components/ui/separator';

interface PropertyContractOccupancySectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyContractOccupancySection: React.FC<PropertyContractOccupancySectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  return (
    <div className="space-y-8">
      {/* Contract Information Section */}
      <div>
        <PropertyContractSection property={property} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Occupancy History Section */}
      <div>
        <h3 className="text-xl font-semibold mb-6">Histórico de Ocupação</h3>
        <PropertyOccupancySection property={property} isLoading={isLoading} />
      </div>
    </div>
  );
};
