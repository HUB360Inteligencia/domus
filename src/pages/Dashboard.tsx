
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format';
import { useProperties } from '@/hooks/use-properties';
import { PropertyType } from '@/types/property';

export default function Dashboard() {
  const [contractAnalytics, setContractAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { properties } = useProperties();

  useEffect(() => {
    // Simulate loading analytics
    const loadData = () => {
      setTimeout(() => {
        setIsLoading(false);
        // Mock data
        setContractAnalytics({
          totalProperties: properties.length,
          totalRevenue: 25000,
          averageRent: 2500,
          occupancyRate: 85,
          expirations: []
        });
      }, 1500);
    };

    loadData();
  }, [properties, toast]);

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
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight">Total de Imóveis</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              {isLoading ? (
                <Skeleton className="h-6 md:h-7 w-12 md:w-20" />
              ) : (
                <div className="text-lg md:text-2xl font-bold">
                  {contractAnalytics?.totalProperties || 0}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight">Receita Total</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              {isLoading ? (
                <Skeleton className="h-6 md:h-7 w-16 md:w-20" />
              ) : (
                <div className="text-sm md:text-2xl font-bold">
                  {formatCurrency(contractAnalytics?.totalRevenue || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight">Aluguel Médio</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              {isLoading ? (
                <Skeleton className="h-6 md:h-7 w-16 md:w-20" />
              ) : (
                <div className="text-sm md:text-2xl font-bold">
                  {formatCurrency(contractAnalytics?.averageRent || 0)}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight">Taxa de Ocupação</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              {isLoading ? (
                <Skeleton className="h-6 md:h-7 w-12 md:w-20" />
              ) : (
                <div className="text-lg md:text-2xl font-bold">
                  {contractAnalytics?.occupancyRate || 0}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section - Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="px-3 md:px-6 py-3 md:py-6">
              <CardTitle className="text-sm md:text-lg">Tipos de Imóveis</CardTitle>
              <CardDescription className="text-xs md:text-sm">Distribuição dos tipos de imóveis</CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              {isLoading ? (
                <div className="h-32 md:h-[200px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-32 md:h-[200px] flex items-center justify-center">
                  <p className="text-xs md:text-sm text-muted-foreground text-center">Gráfico de distribuição de imóveis</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-3 md:px-6 py-3 md:py-6">
              <CardTitle className="text-sm md:text-lg">Próximos Vencimentos</CardTitle>
              <CardDescription className="text-xs md:text-sm">Contratos com vencimento nos próximos 60 dias</CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              {isLoading ? (
                <Skeleton className="h-32 md:h-[200px] w-full" />
              ) : contractAnalytics?.expirations && contractAnalytics.expirations.length > 0 ? (
                <div className="space-y-4">
                  {contractAnalytics.expirations.map((expiration: any) => (
                    <div key={expiration.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-xs md:text-sm">{expiration.title}</p>
                        <p className="text-xs text-muted-foreground">{expiration.property_title}</p>
                      </div>
                      <Badge className="text-xs">{expiration.daysRemaining} dias</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 md:py-8">
                  <p className="text-xs md:text-sm text-muted-foreground">Nenhum contrato com vencimento próximo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section - Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="px-3 md:px-6 py-3 md:py-6">
              <CardTitle className="text-sm md:text-lg">Tarefas Atrasadas</CardTitle>
              <CardDescription className="text-xs md:text-sm">Tarefas que estão atrasadas</CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-center py-4 md:py-8">
                <p className="text-xs md:text-sm text-muted-foreground">Nenhuma tarefa atrasada.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-3 md:px-6 py-3 md:py-6">
              <CardTitle className="text-sm md:text-lg">Próximas Tarefas</CardTitle>
              <CardDescription className="text-xs md:text-sm">Tarefas agendadas para os próximos dias</CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-center py-4 md:py-8">
                <p className="text-xs md:text-sm text-muted-foreground">Nenhuma tarefa agendada.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
