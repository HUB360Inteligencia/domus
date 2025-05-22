
import React from 'react';
import { StatsCards } from '@/components/finances/StatsCards';

interface FinancialStatsSectionProps {
  assetValueData: {
    acquisition: string;
    current: string;
    growthPercentage: number;
  };
  performanceData: {
    monthlyAverage: string;
    previousMonth: {
      percentage: string;
      value: string;
      trend: 'up' | 'down' | 'neutral';
    };
    occupancyRate: string;
  };
  showMarketValue: boolean;
  setShowMarketValue: (value: boolean) => void;
  isLoading?: boolean;
}

export const FinancialStatsSection: React.FC<FinancialStatsSectionProps> = ({
  assetValueData,
  performanceData,
  showMarketValue,
  setShowMarketValue,
  isLoading
}) => {
  return (
    <div className="mb-6">
      <StatsCards
        assetValueData={assetValueData}
        performanceData={performanceData}
        showMarketValue={showMarketValue}
        setShowMarketValue={setShowMarketValue}
        isLoading={isLoading}
      />
    </div>
  );
};
