
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

// Interface for client distribution data
interface ClientsByPlanData {
  name: string;
  value: number;
}

// Interface for chart data that matches the OverviewChart component's expected format
interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

export default function AdminDashboard() {
  const { data: clients, isLoading: isClientsLoading } = useClients();
  const { data: plans, isLoading: isPlansLoading } = usePlans();
  
  const [clientsByPlan, setClientsByPlan] = useState<ClientsByPlanData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [financialStats, setFinancialStats] = useState({
    mrr: "R$ 0,00",
    totalClients: 0,
    activeRate: "0%",
    growthRate: "0%"
  });

  useEffect(() => {
    // Generate demo data for now - this would be replaced with real data from API
    if (plans && plans.length > 0) {
      const demoClientsByPlan = plans.map(plan => ({
        name: plan.name,
        value: Math.floor(Math.random() * 50) + 1
      }));
      
      setClientsByPlan(demoClientsByPlan);
      
      // Calculate total clients (for demo)
      const totalClients = demoClientsByPlan.reduce((acc, curr) => acc + curr.value, 0);
      
      // Generate MRR (for demo)
      const mrr = plans.reduce((acc, plan) => {
        const clientCount = demoClientsByPlan.find(c => c.name === plan.name)?.value || 0;
        return acc + (plan.price * clientCount);
      }, 0);
      
      setFinancialStats({
        mrr: `R$ ${mrr.toLocaleString('pt-BR')}`,
        totalClients,
        activeRate: "92%",
        growthRate: "+8%"
      });
      
      // Generate revenue chart data (for demo) - updated to match the ChartData interface
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
      const demoRevenueData = months.map((month, index) => {
        // Starting baseline with some growth
        const baseRevenue = 30000 + (index * 5000);
        // Add some randomness
        const revenue = baseRevenue + Math.floor(Math.random() * 10000);
        // Add expenses (typically lower than income for profitable companies)
        const expenses = baseRevenue * 0.7 + Math.floor(Math.random() * 5000);
        
        return {
          name: month,
          income: revenue,
          expenses: expenses
        };
      });
      
      setRevenueData(demoRevenueData);
    }
  }, [plans]);

  // Prepare data for client distribution chart
  const clientDistributionData = clientsByPlan.map(item => ({
    name: item.name,
    value: item.value
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewChart 
            data={revenueData} 
            title="Crescimento de Receita (2024)" 
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Clientes</CardTitle>
            <CardDescription>Clientes por plano de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientsByPlan.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-petroleum opacity-${(index + 5) * 10}`}></div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
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
                {/* Client acquisition chart would go here */}
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
                {/* Average subscription value chart would go here */}
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
                {/* Plan performance chart would go here */}
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
