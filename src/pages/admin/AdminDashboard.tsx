
import { useState, useEffect } from "react";
import { 
  Building, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  CalendarClock,
  BarChart4,
  CircleDollarSign,
  CircleCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/stats-card";
import { OverviewChart } from "@/components/overview-chart";
import { useClients } from "@/hooks/use-clients";
import { usePlans } from "@/hooks/use-plans";
import { 
  useSubscriptionAnalytics, 
  useMrr, 
  useClientDistributionByPlan 
} from "@/hooks/use-subscription-analytics";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: clients, isLoading: isClientsLoading } = useClients();
  const { data: plans, isLoading: isPlansLoading } = usePlans();
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useSubscriptionAnalytics();
  const { data: mrr, isLoading: isMrrLoading } = useMrr();
  const { data: clientsByPlan, isLoading: isDistributionLoading } = useClientDistributionByPlan();
  
  const [financialStats, setFinancialStats] = useState({
    mrr: "R$ 0,00",
    totalClients: 0,
    activeRate: "0%",
    growthRate: "0%"
  });

  useEffect(() => {
    if (analyticsData && !isAnalyticsLoading) {
      const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      });
      
      setFinancialStats({
        mrr: formatter.format(analyticsData.currentMrr),
        totalClients: analyticsData.clientMetrics.totalClients,
        activeRate: `${analyticsData.clientMetrics.retentionRate}%`,
        growthRate: `+${analyticsData.mrrGrowthRate}%`
      });
    }
  }, [analyticsData, isAnalyticsLoading]);

  const isLoading = isClientsLoading || isPlansLoading || isAnalyticsLoading || isMrrLoading || isDistributionLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-2/3 mb-2" />
                  <Skeleton className="h-12 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Faturamento Mensal (MRR)"
              value={financialStats.mrr}
              description="Receita mensal recorrente"
              icon={CircleDollarSign}
              iconColor="text-emerald-500"
              trend="up"
              trendValue={financialStats.growthRate}
            />
            <StatsCard
              title="Total de Clientes"
              value={financialStats.totalClients.toString()}
              description="Clientes ativos na plataforma"
              icon={Users}
              iconColor="text-blue-500"
              trend="up"
              trendValue="+12%"
            />
            <StatsCard
              title="Taxa de Retenção"
              value={financialStats.activeRate}
              description="Clientes que renovaram"
              icon={CircleCheck}
              iconColor="text-purple-500"
              trend="up"
              trendValue="+2%"
            />
            <StatsCard
              title="Taxa de Crescimento"
              value={financialStats.growthRate}
              description="Em relação ao mês anterior"
              icon={TrendingUp}
              iconColor="text-amber-500"
              trend="up"
              trendValue="+3%"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isAnalyticsLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Receita (2024)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Skeleton className="h-full w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <OverviewChart 
              data={analyticsData?.historicalMrr.map(item => ({
                name: item.month,
                income: item.value,
                expenses: item.value * 0.3  // Estimating expenses as 30% of income
              })) || []} 
              title="Crescimento de Receita (2024)" 
            />
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Clientes</CardTitle>
            <CardDescription>Clientes por plano de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            {isDistributionLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="w-24 h-5" />
                    </div>
                    <Skeleton className="w-10 h-5" />
                  </div>
                ))}
              </div>
            ) : clientsByPlan && clientsByPlan.length > 0 ? (
              <div className="space-y-4">
                {clientsByPlan.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-petroleum opacity-${(index + 5) * 10}`}></div>
                      <span className="font-medium">{item.planName}</span>
                    </div>
                    <span className="font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Aquisição de Clientes</CardTitle>
              <CardDescription>Novos clientes por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <p className="text-center text-muted-foreground pt-32">Gráfico de aquisição de clientes será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Valor Médio de Assinaturas</CardTitle>
              <CardDescription>Valor médio por cliente ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <p className="text-center text-muted-foreground pt-32">Gráfico de valor médio de assinaturas será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho dos Planos</CardTitle>
              <CardDescription>Comparativo de receita por plano</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <p className="text-center text-muted-foreground pt-32">Gráfico de desempenho dos planos será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Renovações Próximas</CardTitle>
            <CardDescription>Assinaturas que vencem nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">Lista de renovações próximas será implementada em breve</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">Lista de atividades recentes será implementada em breve</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
