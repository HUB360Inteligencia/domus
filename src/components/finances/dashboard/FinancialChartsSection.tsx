
import React from 'react';
import { PatrimonyValueChart } from '@/components/finances/PatrimonyValueChart';
import { PropertyRoiChart } from '@/components/finances/PropertyRoiChart';

interface FinancialChartsSectionProps {
  assetGrowthData: Array<{
    month: string;
    marketValue: number;
    bookValue: number;
    acquisitionValue: number;
  }>;
  roiByPropertyType: Record<string, number>;
  chartViewMode: 'patrimony' | 'roi';
  setChartViewMode: (mode: 'patrimony' | 'roi') => void;
  isLoading?: boolean;
}

export const FinancialChartsSection: React.FC<FinancialChartsSectionProps> = ({
  assetGrowthData,
  roiByPropertyType,
  chartViewMode,
  setChartViewMode,
  isLoading
}) => {
  // Transform asset growth data to match PatrimonyValueChart expected format
  const transformedAssetGrowthData = assetGrowthData.map(item => ({
    month: item.month,
    fullLabel: item.month,
    year: new Date().getFullYear(),
    value: item.marketValue,
    acquisition: item.acquisitionValue
  }));

  // Transform ROI data to match PropertyRoiChart expected format
  const transformedRoiData = Object.entries(roiByPropertyType).map(([type, roi]) => ({
    type,
    roi
  }));

  // Map chart view mode to PatrimonyValueChart expected values
  const viewMode: 'monthly' | 'yearly' = chartViewMode === 'patrimony' ? 'monthly' : 'yearly';

  const handleViewModeChange = (mode: 'monthly' | 'yearly') => {
    setChartViewMode(mode === 'monthly' ? 'patrimony' : 'roi');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Valorização Patrimonial Chart */}
      <div className="lg:col-span-2">
        <PatrimonyValueChart 
          data={transformedAssetGrowthData}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isLoading={isLoading}
        />
      </div>

      {/* ROI by Property Type Chart */}
      <div className="lg:col-span-1">
        <PropertyRoiChart 
          data={transformedRoiData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
