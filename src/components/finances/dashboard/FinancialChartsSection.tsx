
import React from 'react';
import { PatrimonyValueChart } from '@/components/finances/PatrimonyValueChart';
import { PropertyRoiChart } from '@/components/finances/PropertyRoiChart';

interface FinancialChartsSectionProps {
  assetGrowthData: Array<{
    month: string;
    fullLabel?: string;
    year?: number;
    value: number;
    acquisition: number;
  }>;
  roiByPropertyType: Array<{
    type: string;
    roi: number;
  }>;
  chartViewMode: 'monthly' | 'yearly';
  setChartViewMode: (mode: 'monthly' | 'yearly') => void;
  isLoading?: boolean;
}

export const FinancialChartsSection: React.FC<FinancialChartsSectionProps> = ({
  assetGrowthData,
  roiByPropertyType,
  chartViewMode,
  setChartViewMode,
  isLoading
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Valorização Patrimonial Chart */}
      <div className="lg:col-span-2">
        <PatrimonyValueChart 
          data={assetGrowthData}
          viewMode={chartViewMode}
          onViewModeChange={setChartViewMode}
          isLoading={isLoading}
        />
      </div>

      {/* ROI by Property Type Chart */}
      <div className="lg:col-span-1">
        <PropertyRoiChart 
          data={roiByPropertyType}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
