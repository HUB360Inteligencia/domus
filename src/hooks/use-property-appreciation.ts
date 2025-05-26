
import { useMemo } from 'react';
import { Property } from '@/types/property';
import { PropertyValuation } from '@/types/property';
import { calculateAppreciation, formatAppreciation } from '@/utils/currency';

interface UsePropertyAppreciationProps {
  property: Property | null | undefined;
  valuations: PropertyValuation[];
}

export const usePropertyAppreciation = ({ property, valuations }: UsePropertyAppreciationProps) => {
  const appreciation = useMemo(() => {
    if (!property || !property.purchase_value) {
      return {
        percentage: 0,
        absolute: 0,
        formatted: { formatted: '0,00%', isPositive: true, colorClass: 'text-gray-500' },
        hasData: false
      };
    }

    // Get the latest valuation or use property value
    const latestValuation = valuations.length > 0
      ? valuations.reduce((latest, current) => {
          return new Date(current.valuation_date) > new Date(latest.valuation_date) 
            ? current 
            : latest;
        }, valuations[0])
      : null;

    const currentValue = latestValuation?.value || property.value || 0;
    const purchaseValue = property.purchase_value;

    const appreciationPercentage = calculateAppreciation(purchaseValue, currentValue);
    const absoluteAppreciation = currentValue - purchaseValue;
    const formatted = formatAppreciation(appreciationPercentage);

    return {
      percentage: appreciationPercentage,
      absolute: absoluteAppreciation,
      formatted,
      hasData: true,
      purchaseValue,
      currentValue,
      purchaseDate: property.purchase_date,
      lastValuationDate: latestValuation?.valuation_date
    };
  }, [property, valuations]);

  return appreciation;
};
