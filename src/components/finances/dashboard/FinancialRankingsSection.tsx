
import React from 'react';
import { RankingCard } from '@/components/finances/RankingCard';

interface PropertyRankingItem {
  id: string;
  name: string;
  type: string;
  location: string;
  return: number;
  percentage: number;
}

interface NeighborhoodRankingItem {
  id: string;
  name: string;
  properties: number;
  totalReturn: number;
  averageReturn: number;
}

interface FinancialRankingsSectionProps {
  topPropertiesData: PropertyRankingItem[];
  neighborhoodData: NeighborhoodRankingItem[];
  propertyRankingType: 'value' | 'percentage';
  setPropertyRankingType: (value: 'value' | 'percentage') => void;
  neighborhoodRankingType: 'value' | 'percentage';
  setNeighborhoodRankingType: (value: 'value' | 'percentage') => void;
  isLoading?: boolean;
}

export const FinancialRankingsSection: React.FC<FinancialRankingsSectionProps> = ({
  topPropertiesData,
  neighborhoodData,
  propertyRankingType,
  setPropertyRankingType,
  neighborhoodRankingType,
  setNeighborhoodRankingType,
  isLoading
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Properties Ranking */}
      <RankingCard
        title="Top 5 Propriedades"
        description="Propriedades com maior rentabilidade"
        items={topPropertiesData}
        rankingType={propertyRankingType}
        onRankingTypeChange={setPropertyRankingType}
        itemType="property"
        isLoading={isLoading}
      />

      {/* Neighborhood Ranking */}
      <RankingCard
        title="Rentabilidade por Bairro"
        description="Bairros com melhor desempenho"
        items={neighborhoodData}
        rankingType={neighborhoodRankingType}
        onRankingTypeChange={setNeighborhoodRankingType}
        itemType="neighborhood"
        isLoading={isLoading}
      />
    </div>
  );
};
