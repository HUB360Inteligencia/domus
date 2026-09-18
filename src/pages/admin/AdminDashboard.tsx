import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, CircleCheck, CircleDollarSign, History, TrendingDown, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionAnalytics } from "@/hooks/use-subscription-analytics";
import { useAdminInsights } from "@/hooks/use-admin-insights";
import { cn } from "@/lib/utils";

const PALETTE = ["#c4934f", "#6f8f74", "#4f6f85", "#9f5d4c", "#242021", "#d9b979"];

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const tooltipStyle = {
  borderRadius: "16px",
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
};

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: { label: string; direction: "up" | "down" | "neutral" };
}) {
  return (
    <div className="premium-panel rounded-[1.75rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              trend.direction === "up" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              trend.direction === "down" && "bg-rose-500/10 text-rose-700 dark:text-rose-300",
              trend.direction === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : trend.direction === "down" ? <TrendingDown className="h-3 w-3" /> : null}
            {trend.label}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

const signed = (value: number, suffix = "%") =>
  `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;

const direction = (value: number): "up" | "down" | "neutral" => (value > 0 ? "up" : value < 0 ? "down" : "neutral");

export default function AdminDashboard() {
  const { data: analytics, isLoading: isAnalyticsLoading } = useSubscriptionAnalytics();
  const { data: insights, isLoading: isInsightsLoading } = useAdminInsights();

  const isLoading = isAnalyticsLoading || isInsightsLoading;
  const mrrHistory = analytics?.historicalMrr ?? [];
  const newClientsDelta = (insights?.newClientsThisMonth ?? 0) - (insights?.newClientsPreviousMonth ?? 0);
  const activeRate = insights && insights.totalClients > 0 ? (insights.activeClients / insights.totalClients) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Painel Domus</h1>
        <p className="mt-1 text-muted-foreground">Receita recorrente, organizações e assinaturas da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-[1.75rem]" />)
        ) : (
          <>
            <KpiCard
              title="Receita recorrente (MRR)"
              value={currency(analytics?.currentMrr ?? 0)}
              description="Assinaturas ativas, normalizadas por mês"
              icon={CircleDollarSign}
              trend={{ label: signed(analytics?.mrrGrowthRate ?? 0), direction: direction(analytics?.mrrGrowthRate ?? 0) }}
            />
            <KpiCard
              title="Organizações"
              value={String(insights?.totalClients ?? 0)}
              description={`${insights?.newClientsThisMonth ?? 0} nova(s) neste mês`}
              icon={Users}
              trend={{ label: `${signed(newClientsDelta, "")} vs. mês anterior`, direction: direction(newClientsDelta) }}
            />
            <KpiCard
              title="Organizações ativas"
              value={`${activeRate.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}
              description={`${insights?.activeClients ?? 0} de ${insights?.totalClients ?? 0} com acesso ativo`}
              icon={CircleCheck}
            />
            <KpiCard
              title="Ticket médio"
              value={currency(analytics?.averageRevenuePerUser ?? 0)}
              description="MRR dividido pelas organizações ativas"
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Receita recorrente — últimos 6 meses</CardTitle>
            <CardDescription>Calculada a partir das datas de início e fim de cada assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mrrHistory} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(120,110,100,0.18)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} width={80} tickFormatter={(value) => currency(Number(value))} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [currency(value), "MRR"]} />
                    <Line type="monotone" dataKey="value" stroke="#c4934f" strokeWidth={3} dot={{ r: 4, fill: "#c4934f" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita por plano</CardTitle>
            <CardDescription>Assinaturas vigentes hoje</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
              </div>
            ) : insights && insights.revenueByPlan.length > 0 ? (
              <div className="space-y-3">
                {insights.revenueByPlan.map((item, index) => {
                  const max = insights.revenueByPlan[0]?.mrr || 1;
                  return (
                    <div key={item.plan}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETTE[index % PALETTE.length] }} />
                          {item.plan}
                        </span>
                        <span className="text-muted-foreground">
                          {item.assinaturas} · <strong className="text-foreground">{currency(item.mrr)}</strong>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${Math.max((item.mrr / max) * 100, 4)}%`, backgroundColor: PALETTE[index % PALETTE.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma assinatura vigente.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">Aquisição</TabsTrigger>
          <TabsTrigger value="ticket">Ticket médio</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Novas organizações por mês</CardTitle>
              <CardDescription>Cadastros nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights?.clientAcquisition ?? []}>
                      <CartesianGrid vertical={false} stroke="rgba(120,110,100,0.18)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value, "Organizações"]} />
                      <Bar dataKey="clientes" fill="#6f8f74" radius={[10, 10, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ticket">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valor médio por assinatura</CardTitle>
              <CardDescription>MRR dividido pelas assinaturas vigentes em cada mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights?.averageTicket ?? []}>
                      <CartesianGrid vertical={false} stroke="rgba(120,110,100,0.18)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} width={80} tickFormatter={(value) => currency(Number(value))} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [currency(value), "Ticket médio"]} />
                      <Bar dataKey="ticket" fill="#4f6f85" radius={[10, 10, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-5 w-5" />
              Renovações próximas
            </CardTitle>
            <CardDescription>Assinaturas que terminam nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : insights && insights.upcomingRenewals.length > 0 ? (
              <ul className="divide-y divide-border">
                {insights.upcomingRenewals.map((renewal) => (
                  <li key={renewal.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{renewal.clientName}</p>
                      <p className="text-xs text-muted-foreground">{renewal.planName} · {currency(renewal.value)}/mês</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {format(new Date(renewal.endsAt), "dd/MM/yyyy")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma renovação nos próximos 30 dias.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Atividade recente
            </CardTitle>
            <CardDescription>Novas organizações e assinaturas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : insights && insights.recentActivity.length > 0 ? (
              <ul className="divide-y divide-border">
                {insights.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{activity.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{activity.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(new Date(activity.date), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem atividade registrada.</p>
            )}
            <Link to="/admin/clients" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
              Ver todas as organizações
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
