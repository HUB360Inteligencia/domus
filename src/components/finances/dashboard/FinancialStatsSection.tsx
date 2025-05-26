
import React from 'react';
import { StatsCards } from '@/components/finances/StatsCards';

interface FinancialStatsSectionProps {
  assetValueData: {
    totalMarketValue: number;
    totalBookValue: number;
    totalAcquisitionValue: number;
  } | null;
  performanceData: {
    averageMonthlyReturn: number;
    previousMonthReturn: number;
    totalProperties: number;
    occupancyRate: number;
  } | null;
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
  // Transform data to match StatsCards expected format
  const transformedAssetData = assetValueData ? {
    acquisition: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assetValueData.totalAcquisitionValue),
    current: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assetValueData.totalMarketValue),
    growthPercentage: assetValueData.totalAcquisitionValue > 0 
      ? ((assetValueData.totalMarketValue - assetValueData.totalAcquisitionValue) / assetValueData.totalAcquisitionValue) * 100 
      : 0
  } : { acquisition: 'R$ 0,00', current: 'R$ 0,00', growthPercentage: 0 };

  const transformedPerformanceData = performanceData ? {
    monthlyAverage: `${performanceData.averageMonthlyReturn.toFixed(2)}%`,
    previousMonth: {
      percentage: `${performanceData.previousMonthReturn.toFixed(2)}%`,
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        assetValueData?.totalAcquisitionValue 
          ? (performanceData.previousMonthReturn / 100) * assetValueData.totalAcquisitionValue
          : 0
      ),
      trend: (() => {
        const diff = performanceData.averageMonthlyReturn - performanceData.previousMonthReturn;
        if (Math.abs(diff) < 0.01) return 'neutral' as const;
        return diff > 0 ? 'up' as const : 'down' as const;
      })()
    },
    occupancyRate: `${performanceData.occupancyRate.toFixed(1)}%`
  } : {
    monthlyAverage: '0%',
    previousMonth: { percentage: '0%', value: 'R$ 0,00', trend: 'neutral' as const },
    occupancyRate: '0%'
  };

  return (
    <div className="mb-6">
      <StatsCards
        assetValueData={transformedAssetData}
        performanceData={transformedPerformanceData}
        showMarketValue={showMarketValue}
        setShowMarketValue={setShowMarketValue}
        isLoading={isLoading}
      />
    </div>
  );
};
