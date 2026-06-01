
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { logger } from "@/lib/logger";
export interface PortfolioTimelineData {
  date: string;
  totalValue: number;
  properties: Array<{
    id: string;
    title: string;
    value: number;
  }>;
}

export const usePortfolioTimeline = () => {
  const { data: timelineData = [], isLoading } = useQuery({
    queryKey: ['portfolio-timeline'],
    queryFn: async (): Promise<PortfolioTimelineData[]> => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error('User not authenticated');
        }

        // Buscar todas as propriedades do usuário
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id, title, value, purchase_date')
          .eq('user_id', session.data.session.user.id)
          .order('purchase_date', { ascending: true });

        if (propertiesError) throw propertiesError;

        if (!properties || properties.length === 0) {
          return [];
        }

        // Buscar todas as avaliações das propriedades
        const propertyIds = properties.map(p => p.id);
        const { data: valuations, error: valuationsError } = await supabase
          .from('property_valuations')
          .select('property_id, value, valuation_date')
          .in('property_id', propertyIds)
          .order('valuation_date', { ascending: true });

        if (valuationsError) throw valuationsError;

        // Criar timeline dos últimos 12 meses
        const now = new Date();
        const timeline: PortfolioTimelineData[] = [];

        for (let i = 11; i >= 0; i--) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          
          const propertiesAtDate = properties.filter(p => {
            if (!p.purchase_date) return false;
            return new Date(p.purchase_date) <= endOfMonth;
          });

          let totalValue = 0;
          const propertiesWithValues = propertiesAtDate.map(property => {
            // Buscar a avaliação mais recente até a data alvo
            const propertyValuations = valuations?.filter(v => 
              v.property_id === property.id && 
              new Date(v.valuation_date) <= endOfMonth
            ) || [];

            let propertyValue = property.value || 0;
            
            if (propertyValuations.length > 0) {
              // Usar a avaliação mais recente
              const latestValuation = propertyValuations.reduce((latest, current) => 
                new Date(current.valuation_date) > new Date(latest.valuation_date) 
                  ? current 
                  : latest
              );
              propertyValue = latestValuation.value;
            }

            totalValue += propertyValue;

            return {
              id: property.id,
              title: property.title,
              value: propertyValue
            };
          });

          timeline.push({
            date: targetDate.toISOString().slice(0, 7), // YYYY-MM
            totalValue,
            properties: propertiesWithValues
          });
        }

        return timeline.filter(item => item.totalValue > 0);
      } catch (error) {
        logger.error('Error fetching portfolio timeline:', error);
        return [];
      }
    }
  });

  return {
    timelineData,
    isLoading
  };
};
