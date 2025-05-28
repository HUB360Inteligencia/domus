
import React from 'react';
import { Property } from '@/types/property';
import { PropertyInvestmentOverview } from './PropertyInvestmentOverview';
import { InvestmentsList } from './InvestmentsList';
import { InvestmentTypeDistributionWidget } from './InvestmentTypeDistributionWidget';

interface PropertyFinancialInvestmentSectionProps {
  property: Property | null | undefined;
  isLoading: boolean;
}

export const PropertyFinancialInvestmentSection: React.FC<PropertyFinancialInvestmentSectionProps> = ({
  property,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Investment Overview */}
      <PropertyInvestmentOverview property={property} isLoading={isLoading} />
      
      {/* Investment Distribution and List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvestmentTypeDistributionWidget propertyId={property?.id || null} />
        <InvestmentsList property={property} />
      </div>
    </div>
  );
};
