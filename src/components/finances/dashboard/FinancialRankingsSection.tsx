
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
  name: string;
  revenue: number;
  count: number;
  roi: number;
}

interface FinancialRankingsSectionProps {
  topPropertiesData: PropertyRankingItem[];
  neighborhoodData: NeighborhoodRankingItem[];
  propertyRankingType: 'revenue' | 'roi';
  setPropertyRankingType: (value: 'revenue' | 'roi') => void;
  neighborhoodRankingType: 'revenue' | 'count';
  setNeighborhoodRankingType: (value: 'revenue' | 'count') => void;
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
  // Transform property ranking type to match RankingCard expected values
  const transformedPropertyRankingType: 'value' | 'percentage' = propertyRankingType === 'revenue' ? 'value' : 'percentage';
  
  // Transform neighborhood ranking type to match RankingCard expected values  
  const transformedNeighborhoodRankingType: 'value' | 'percentage' = neighborhoodRankingType === 'revenue' ? 'value' : 'percentage';

  const handlePropertyRankingTypeChange = (value: 'value' | 'percentage') => {
    setPropertyRankingType(value === 'value' ? 'revenue' : 'roi');
  };

  const handleNeighborhoodRankingTypeChange = (value: 'value' | 'percentage') => {
    setNeighborhoodRankingType(value === 'value' ? 'revenue' : 'count');
  };

  // Transform neighborhood data to match expected format
  const transformedNeighborhoodData = neighborhoodData.map(item => ({
    id: item.name.toLowerCase().replace(/\s+/g, '-'),
    name: item.name,
    properties: item.count,
    totalReturn: item.revenue,
    averageReturn: item.roi
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Properties Ranking */}
      <RankingCard
        title="Top 5 Propriedades"
        description="Propriedades com maior rentabilidade"
        items={topPropertiesData}
        rankingType={transformedPropertyRankingType}
        onRankingTypeChange={handlePropertyRankingTypeChange}
        itemType="property"
        isLoading={isLoading}
      />

      {/* Neighborhood Ranking */}
      <RankingCard
        title="Rentabilidade por Bairro"
        description="Bairros com melhor desempenho"
        items={transformedNeighborhoodData}
        rankingType={transformedNeighborhoodRankingType}
        onRankingTypeChange={handleNeighborhoodRankingTypeChange}
        itemType="neighborhood"
        isLoading={isLoading}
      />
    </div>
  );
};
