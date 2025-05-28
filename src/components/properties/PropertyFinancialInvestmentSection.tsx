
import React from 'react';
import { Property } from '@/types/property';
import { PropertyFinancialSection } from './PropertyFinancialSection';
import { PropertyInvestmentOverview } from './PropertyInvestmentOverview';
import { InvestmentsList } from './InvestmentsList';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { Separator } from '@/components/ui/separator';

interface PropertyFinancialInvestmentSectionProps {
  property: Property | null | undefined;
  isLoading?: boolean;
}

export const PropertyFinancialInvestmentSection: React.FC<PropertyFinancialInvestmentSectionProps> = ({ 
  property, 
  isLoading = false 
}) => {
  const { investments, isLoadingInvestments } = usePropertyInvestments(property?.id || null);

  return (
    <div className="space-y-8">
      {/* Financial Metrics Section */}
      <div>
        <h3 className="text-xl font-semibold mb-6">Métricas Financeiras</h3>
        <PropertyFinancialSection property={property} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Investment Overview Section */}
      <div>
        <h3 className="text-xl font-semibold mb-6">Resumo dos Investimentos</h3>
        <PropertyInvestmentOverview property={property} />
      </div>

      <Separator />

      {/* Investments List Section */}
      <div>
        <h3 className="text-xl font-semibold mb-6">Histórico de Investimentos</h3>
        <InvestmentsList 
          property={property}
          investments={investments}
          isLoading={isLoading || isLoadingInvestments}
        />
      </div>
    </div>
  );
};
