
import { useMemo } from 'react';
import { useAdvancedReportsData } from '@/hooks/use-advanced-reports-data';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { useActivities } from '@/hooks/use-activities';
import { addDays, isAfter, isBefore } from 'date-fns';

interface Alert {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface Goal {
  name: string;
  current: number;
  target: number;
  unit: string;
}

export const useExecutiveDashboardData = () => {
  const { analyticsData, kpiMetrics, isLoading: isLoadingReports } = useAdvancedReportsData();
  const { properties } = useProperties();
  const { contracts } = useContracts();
  const { activities } = useActivities();

  // Calculate real KPIs
  const kpiData = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];

    const latest = analyticsData[analyticsData.length - 1];
    const previous = analyticsData[analyticsData.length - 2];

    const totalRevenue = analyticsData.reduce((sum, item) => sum + item.revenue, 0);
    const revenueChange = previous ? ((latest.revenue - previous.revenue) / previous.revenue) * 100 : 0;

    const totalProperties = properties?.length || 0;
    const rentedProperties = properties?.filter(p => p.status === 'rented' || p.status === 'airbnb').length || 0;
    const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;
    const occupancyChange = previous ? ((latest.occupancy - previous.occupancy)) : 0;

    const avgROI = analyticsData.length > 0 
      ? analyticsData.reduce((sum, item) => sum + (item.revenue > 0 ? ((item.revenue - item.expenses) / item.revenue) * 100 : 0), 0) / analyticsData.length
      : 0;
    const roiChange = previous && previous.revenue > 0 
      ? (((latest.revenue - latest.expenses) / latest.revenue) * 100) - (((previous.revenue - previous.expenses) / previous.revenue) * 100)
      : 0;

    return [
      {
        title: 'Receita Total',
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue),
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
        trend: revenueChange >= 0 ? 'up' : 'down',
        icon: 'DollarSign',
      },
      {
        title: 'Propriedades Ativas',
        value: totalProperties.toString(),
        change: `${rentedProperties} ocupadas`,
        trend: 'up',
        icon: 'Building',
      },
      {
        title: 'Taxa de Ocupação',
        value: `${occupancyRate.toFixed(1)}%`,
        change: `${occupancyChange >= 0 ? '+' : ''}${occupancyChange.toFixed(1)}%`,
        trend: occupancyChange >= 0 ? 'up' : 'down',
        icon: 'Users',
      },
      {
        title: 'ROI Médio',
        value: `${avgROI.toFixed(1)}%`,
        change: `${roiChange >= 0 ? '+' : ''}${roiChange.toFixed(1)}%`,
        trend: roiChange >= 0 ? 'up' : 'down',
        icon: 'Target',
      },
    ];
  }, [analyticsData, properties]);

  // Calculate property type distribution
  const propertyTypeData = useMemo(() => {
    if (!properties || properties.length === 0) return [];

    const typeCount = properties.reduce((acc, property) => {
      const type = property.type || 'Outros';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = properties.length;
    return Object.entries(typeCount).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
    }));
  }, [properties]);

  // Generate real alerts
  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = [];

    // Contratos vencendo nos próximos 30 dias
    if (contracts) {
      const expiringContracts = contracts.filter(contract => {
        const endDate = new Date(contract.end_date);
        const thirtyDaysFromNow = addDays(new Date(), 30);
        return isAfter(endDate, new Date()) && isBefore(endDate, thirtyDaysFromNow);
      });

      if (expiringContracts.length > 0) {
        alertList.push({
          type: 'warning',
          title: 'Contratos Vencendo',
          description: `${expiringContracts.length} contratos vencem nos próximos 30 dias`,
          priority: 'high',
        });
      }
    }

    // Atividades pendentes
    if (activities) {
      const pendingActivities = activities.filter(activity => 
        activity.status === 'pending' && activity.priority === 'high'
      );

      if (pendingActivities.length > 0) {
        alertList.push({
          type: 'info',
          title: 'Atividades Pendentes',
          description: `${pendingActivities.length} atividades de alta prioridade pendentes`,
          priority: 'medium',
        });
      }
    }

    // Meta de ocupação atingida
    const totalProperties = properties?.length || 0;
    const rentedProperties = properties?.filter(p => p.status === 'rented' || p.status === 'airbnb').length || 0;
    const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

    if (occupancyRate >= 90) {
      alertList.push({
        type: 'success',
        title: 'Meta de Ocupação',
        description: 'Meta de ocupação do mês foi atingida',
        priority: 'low',
      });
    }

    return alertList;
  }, [contracts, activities, properties]);

  // Calculate goals progress
  const goals = useMemo((): Goal[] => {
    const totalProperties = properties?.length || 0;
    const rentedProperties = properties?.filter(p => p.status === 'rented' || p.status === 'airbnb').length || 0;
    const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

    const currentRevenue = analyticsData.length > 0 
      ? analyticsData[analyticsData.length - 1]?.revenue || 0 
      : 0;

    const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;

    return [
      {
        name: 'Meta de Ocupação',
        current: occupancyRate,
        target: 95,
        unit: '%',
      },
      {
        name: 'Meta de Receita',
        current: currentRevenue,
        target: 50000, // Meta configurável
        unit: 'R$',
      },
      {
        name: 'Contratos Ativos',
        current: activeContracts,
        target: Math.max(totalProperties * 0.9, 15), // 90% das propriedades ou mínimo 15
        unit: 'contratos',
      },
    ];
  }, [properties, analyticsData, contracts]);

  return {
    kpiData,
    revenueData: analyticsData,
    propertyTypeData,
    alerts,
    goals,
    isLoading: isLoadingReports,
  };
};
