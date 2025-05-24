
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { useActivities } from '@/hooks/use-activities';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { PropertyTypeChart } from '@/components/dashboard/PropertyTypeChart';
import { UpcomingContractsCard } from '@/components/dashboard/UpcomingContractsCard';
import { ActivitiesCard } from '@/components/dashboard/ActivitiesCard';
import { RevenueExpenseChart } from '@/components/dashboard/RevenueExpenseChart';

export default function Dashboard() {
  const [contractAnalytics, setContractAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { properties } = useProperties();
  const { contracts } = useContracts();
  const { activities } = useActivities();
  const { transactions } = useFinancialTransactions();

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
        });
      }, 1500);
    };

    loadData();
  }, [properties, toast]);

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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Property Types Chart */}
          <PropertyTypeChart properties={properties} isLoading={isLoading} />
          
          {/* Upcoming Contracts */}
          <UpcomingContractsCard contracts={contracts} isLoading={isLoading} />
        </div>

        {/* Revenue vs Expense Chart */}
        <RevenueExpenseChart transactions={transactions} isLoading={isLoading} />

        {/* Activities Section */}
        <ActivitiesCard activities={activities} properties={properties} isLoading={isLoading} />
      </div>
    </div>
  );
}
