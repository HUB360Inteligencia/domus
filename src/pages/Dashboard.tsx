import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { OverdueTasks } from '@/components/tasks/overdue-tasks';
import { UpcomingTasks } from '@/components/tasks/upcoming-tasks';
import { useTasks } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';
import { fetchContractAnalytics } from '@/api/analytics';
import { ContractAnalytics } from '@/types/analytics';
import { formatCurrency } from '@/lib/format';
import { calculateDaysRemaining } from '@/lib/utils';
import { useProperties } from '@/hooks/use-properties';
import { PropertyType } from '@/types/property';
import { DoughnutChart } from '@/components/charts/doughnut-chart';
import { OccupancyRateCard } from '@/components/cards/occupancy-rate-card';
import { TotalRevenueCard } from '@/components/cards/total-revenue-card';
import { AverageRentCard } from '@/components/cards/average-rent-card';
import { TotalPropertiesCard } from '@/components/cards/total-properties-card';

export default function Dashboard() {
  const [contractAnalytics, setContractAnalytics] = useState<ContractAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { tasks } = useTasks();
  const { properties } = useProperties();

  useEffect(() => {
    const loadContractAnalytics = async () => {
      try {
        const analytics = await fetchContractAnalytics();
        setContractAnalytics(analytics);
      } catch (error: any) {
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadContractAnalytics();
  }, [toast]);

  const propertyTypeData = properties.reduce((acc: { [key in PropertyType]: number }, property) => {
    const type = property.type as PropertyType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {
    apartment: 0,
    house: 0,
    commercial: 0,
    land: 0,
    rural: 0,
  });

  const chartData = [
    { name: "Apartamentos", value: propertyTypeData.apartment },
    { name: "Casas", value: propertyTypeData.house },
    { name: "Comerciais", value: propertyTypeData.commercial },
    { name: "Terrenos", value: propertyTypeData.land },
    { name: "Rurais", value: propertyTypeData.rural },
  ];

  return (
    <div className="container relative pb-6">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TotalPropertiesCard isLoading={isLoading} total={contractAnalytics?.totalProperties} />
          <TotalRevenueCard isLoading={isLoading} totalRevenue={contractAnalytics?.totalRevenue} />
          <AverageRentCard isLoading={isLoading} averageRent={contractAnalytics?.averageRent} />
          <OccupancyRateCard isLoading={isLoading} occupancyRate={contractAnalytics?.occupancyRate} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Imóveis</CardTitle>
              <CardDescription>Distribuição dos tipos de imóveis</CardDescription>
            </CardHeader>
            <CardContent>
              <DoughnutChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Vencimentos</CardTitle>
              <CardDescription>Contratos com vencimento nos próximos 60 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                contractAnalytics?.expirations && contractAnalytics.expirations.length > 0 ? (
                  <div className="space-y-4">
                    {contractAnalytics.expirations.map((expiration) => (
                      <div key={expiration.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{expiration.title}</p>
                          <p className="text-sm text-muted-foreground">{expiration.property_title}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{expiration.daysRemaining} dias</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum contrato com vencimento próximo.</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OverdueTasks tasks={tasks} />
          <UpcomingTasks tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
