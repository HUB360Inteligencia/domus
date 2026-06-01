import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CircleDollarSign,
  FileCheck2,
  Home,
  Landmark,
  Plus,
  Target,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { AgendaTodayWidget } from "@/components/dashboard/AgendaTodayWidget";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useFinancialTransactions } from "@/hooks/use-financial-transactions";
import { useProperties } from "@/hooks/use-properties";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";

const chartColors = ["#c4934f", "#6f8f74", "#9f5d4c", "#4f6f85", "#242021", "#d9b979"];
const DASHBOARD_PERIOD_MONTHS = 7;

const translatePropertyType = (type: string) => {
  const translations: Record<string, string> = {
    house: "Casa",
    apartment: "Apartamento",
    commercial: "Comercial",
    land: "Terreno",
    studio: "Studio",
    office: "Escritorio",
    warehouse: "Galpao",
    store: "Loja",
    rural: "Rural",
  };

  return translations[type?.toLowerCase()] || type || "Outros";
};

const compactCurrency = (value: number) => {
  const normalizedValue = Number(value || 0);
  const absoluteValue = Math.abs(normalizedValue);
  const formatNumber = (amount: number) => {
    const absoluteAmount = Math.abs(amount);

    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: absoluteAmount < 10 ? 1 : 0,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  if (absoluteValue >= 1_000_000) {
    return `R$ ${formatNumber(normalizedValue / 1_000_000)} mi`;
  }

  if (absoluteValue >= 1_000) {
    return `R$ ${formatNumber(normalizedValue / 1_000)} mil`;
  }

  return formatCurrency(normalizedValue);
};

const getPercentageChange = (current: number, previous: number) => {
  if (previous !== 0) {
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  if (current > 0) return 100;
  if (current < 0) return -100;
  return 0;
};

const getTrend = (value: number): Trend => {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

const getFirstName = (firstName?: string | null, email?: string) => {
  const profileName = firstName?.trim();
  if (profileName) return profileName.split(" ")[0];

  const emailName = email?.split("@")[0]?.trim();
  return emailName || "bem-vindo";
};

type Trend = "up" | "down" | "neutral";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  trend?: Trend;
  trendValue?: string;
  sparkline?: number[];
  progress?: {
    value: number;
    label: string;
  };
  details?: {
    label: string;
    value: string;
  }[];
  icon: React.ElementType;
  featured?: boolean;
};

function MetricCard({
  title,
  value,
  subtitle,
  trend = "neutral",
  trendValue,
  sparkline,
  progress,
  details,
  icon: Icon,
  featured,
}: MetricCardProps) {
  const normalizedSparkline = sparkline?.filter(Number.isFinite) ?? [];
  const max = Math.max(...normalizedSparkline.map((item) => Math.abs(item)), 1);
  const trendClass =
    trend === "up" ? "text-emerald-700" : trend === "down" ? "text-rose-700" : "text-muted-foreground";

  return (
    <div
      className={cn(
        "animate-rise rounded-[2rem] border p-5 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-1",
        featured
          ? "premium-gradient text-primary-foreground shadow-[0_28px_75px_-48px_rgba(80,52,31,0.95)]"
          : "premium-panel dark:premium-panel-dark"
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            featured ? "bg-white/15" : "bg-primary/10 text-primary dark:bg-white/10 dark:text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trendValue && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              featured ? "bg-white/14 text-white" : `bg-white/70 ${trendClass} dark:bg-white/10`
            )}
          >
            {trendValue}
          </span>
        )}
      </div>

      <p className={cn("text-sm", featured ? "text-white/70" : "text-muted-foreground")}>{title}</p>
      <p className="mt-2 text-2xl font-semibold leading-none">{value}</p>
      <p className={cn("mt-2 text-xs", featured ? "text-white/58" : "text-muted-foreground")}>{subtitle}</p>

      {details?.length ? (
        <div
          className={cn(
            "mt-5 grid gap-2 rounded-3xl border p-3",
            featured ? "border-white/14 bg-white/10" : "border-white/60 bg-white/55 dark:border-white/10 dark:bg-white/5"
          )}
        >
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center justify-between gap-3 text-xs">
              <span className={cn(featured ? "text-white/60" : "text-muted-foreground")}>{detail.label}</span>
              <strong className={cn("text-right font-semibold", featured ? "text-white" : "text-foreground")}>
                {detail.value}
              </strong>
            </div>
          ))}
        </div>
      ) : progress ? (
        <div className="mt-5">
          <div className={cn("mb-2 flex justify-between text-xs", featured ? "text-white/65" : "text-muted-foreground")}>
            <span>{progress.label}</span>
            <span>{Math.min(Math.max(progress.value, 0), 100).toFixed(1)}%</span>
          </div>
          <div className={cn("h-3 overflow-hidden rounded-full", featured ? "bg-white/14" : "bg-secondary/80")}>
            <div
              className={cn("h-full rounded-full", featured ? "bg-white/70" : "bg-gradient-to-r from-[#6f8f74] to-[#c4934f]")}
              style={{ width: `${Math.min(Math.max(progress.value, 0), 100)}%` }}
            />
          </div>
        </div>
      ) : normalizedSparkline.length > 0 ? (
        <div className="mt-5 flex h-12 items-end gap-1">
          {normalizedSparkline.slice(-12).map((item, index) => (
            <div
              key={`${title}-${index}`}
              className={cn(
                "flex-1 rounded-t-lg",
                featured
                  ? "bg-white/65"
                  : item < 0
                    ? "bg-gradient-to-t from-[#9f5d4c]/30 to-[#9f5d4c]"
                    : "bg-gradient-to-t from-[#4f6f85]/35 to-[#c4934f]"
              )}
              style={{ height: `${Math.max((Math.abs(item) / max) * 100, 8)}%` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase text-accent">{eyebrow}</p>}
        <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const metrics = useDashboardMetrics();
  const { properties } = useProperties();
  const { transactions } = useFinancialTransactions();
  const greeting = `${getTimeGreeting()}, ${getFirstName(user?.profile?.first_name, user?.email)}`;

  const summarizeTransactions = React.useCallback((startDate: Date, endDate: Date) => {
    const summary = transactions.reduce(
      (acc, transaction) => {
        const transactionDate = new Date(transaction.transaction_date);

        if (transactionDate < startDate || transactionDate > endDate) {
          return acc;
        }

        const amount = Number(transaction.amount) || 0;

        if (transaction.transaction_type === "income") {
          acc.revenue += amount;
        } else {
          acc.expenses += amount;
        }

        return acc;
      },
      { revenue: 0, expenses: 0 }
    );

    return {
      ...summary,
      balance: summary.revenue - summary.expenses,
    };
  }, [transactions]);

  const propertyTypesData = React.useMemo(() => {
    const typeCount = properties.reduce((acc, property) => {
      const type = translatePropertyType(property.type);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount).map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
    }));
  }, [properties]);

  const monthlyCashFlowData = React.useMemo(() => {
    const now = new Date();
    const months = Array.from(
      { length: DASHBOARD_PERIOD_MONTHS },
      (_, index) => new Date(now.getFullYear(), now.getMonth() - DASHBOARD_PERIOD_MONTHS + 1 + index, 1)
    );

    return months.map((monthDate) => {
      const revenue = transactions
        .filter((transaction) => {
          const date = new Date(transaction.transaction_date);
          return (
            date.getMonth() === monthDate.getMonth() &&
            date.getFullYear() === monthDate.getFullYear() &&
            transaction.transaction_type === "income"
          );
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      const expenses = transactions
        .filter((transaction) => {
          const date = new Date(transaction.transaction_date);
          return (
            date.getMonth() === monthDate.getMonth() &&
            date.getFullYear() === monthDate.getFullYear() &&
            transaction.transaction_type === "expense"
          );
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      return {
        month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(monthDate).replace(".", ""),
        revenue,
        expenses,
        balance: revenue - expenses,
      };
    });
  }, [transactions]);

  const periodSummary = React.useMemo(
    () =>
      monthlyCashFlowData.reduce(
        (summary, item) => ({
          revenue: summary.revenue + item.revenue,
          expenses: summary.expenses + item.expenses,
          balance: summary.balance + item.balance,
        }),
        { revenue: 0, expenses: 0, balance: 0 }
      ),
    [monthlyCashFlowData]
  );

  const previousPeriodSummary = React.useMemo(() => {
    const now = new Date();
    const previousPeriodStart = new Date(
      now.getFullYear(),
      now.getMonth() - DASHBOARD_PERIOD_MONTHS * 2 + 1,
      1
    );
    const previousPeriodEnd = new Date(
      now.getFullYear(),
      now.getMonth() - DASHBOARD_PERIOD_MONTHS + 1,
      0,
      23,
      59,
      59,
      999
    );

    return summarizeTransactions(previousPeriodStart, previousPeriodEnd);
  }, [summarizeTransactions]);

  const topProperties = React.useMemo(
    () => [...properties].sort((a, b) => Number(b.value || 0) - Number(a.value || 0)).slice(0, 5),
    [properties]
  );

  const roiBase = metrics.totalPurchaseValue || metrics.totalMarketValue;
  const averageMonthlyROI = roiBase > 0
    ? (periodSummary.balance / roiBase / DASHBOARD_PERIOD_MONTHS) * 100
    : 0;
  const previousAverageMonthlyROI = roiBase > 0
    ? (previousPeriodSummary.balance / roiBase / DASHBOARD_PERIOD_MONTHS) * 100
    : 0;
  const roiTrendDelta = averageMonthlyROI - previousAverageMonthlyROI;
  const periodBalanceChangePercentage = getPercentageChange(periodSummary.balance, previousPeriodSummary.balance);
  const occupancyBase = metrics.rentableProperties || metrics.totalProperties;
  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        metrics.occupancyRate * 0.6 +
          Math.min(Math.max(averageMonthlyROI, 0) * 16, 22) +
          (periodSummary.balance > 0 ? 18 : 0)
      )
    )
  );

  const cashFlowSparkline = monthlyCashFlowData.map((item) => item.balance);
  const roiSparkline = monthlyCashFlowData.map((item) =>
    roiBase > 0 ? (item.balance / roiBase) * 100 : 0
  );
  const valuedProperties = properties.filter((property) => Number(property.value || 0) > 0).length;

  const kpiCards: MetricCardProps[] = [
    {
      title: "Patrimônio total",
      value: compactCurrency(metrics.totalMarketValue),
      subtitle: metrics.totalPurchaseValue > 0 ? "Valor de mercado vs. base cadastrada" : "Valor de mercado consolidado",
      icon: Landmark,
      trend: getTrend(metrics.assetGrowthPercentage),
      trendValue: metrics.totalPurchaseValue > 0
        ? `${metrics.assetGrowthPercentage >= 0 ? "+" : ""}${metrics.assetGrowthPercentage.toFixed(1)}%`
        : undefined,
      details: [
        {
          label: "Base cadastrada",
          value: metrics.totalPurchaseValue > 0 ? compactCurrency(metrics.totalPurchaseValue) : "Sem custo informado",
        },
        {
          label: "Ativos avaliados",
          value: `${valuedProperties}/${metrics.totalProperties}`,
        },
      ],
      featured: true,
    },
    {
      title: "Ocupação",
      value: `${metrics.rentedProperties}/${occupancyBase}`,
      subtitle: "Ativos locáveis ocupados",
      icon: Home,
      trend: metrics.occupancyRate > 80 ? "up" : metrics.occupancyRate < 60 ? "down" : "neutral",
      trendValue: `${metrics.occupancyRate.toFixed(1)}%`,
      progress: {
        value: metrics.occupancyRate,
        label: "Carteira ocupada",
      },
    },
    {
      title: "ROI médio mensal",
      value: `${averageMonthlyROI.toFixed(2)}%`,
      subtitle: `Média dos últimos ${DASHBOARD_PERIOD_MONTHS} meses`,
      icon: Target,
      trend: getTrend(roiTrendDelta),
      trendValue: `${roiTrendDelta >= 0 ? "+" : ""}${roiTrendDelta.toFixed(2)} pp`,
      sparkline: roiSparkline,
    },
    {
      title: "Resultado do período",
      value: compactCurrency(periodSummary.balance),
      subtitle: `Receitas ${compactCurrency(periodSummary.revenue)} | Despesas ${compactCurrency(periodSummary.expenses)}`,
      icon: WalletCards,
      trend: getTrend(periodBalanceChangePercentage),
      trendValue: `${periodBalanceChangePercentage >= 0 ? "+" : ""}${periodBalanceChangePercentage.toFixed(1)}%`,
      sparkline: cashFlowSparkline,
    },
  ];

  return (
    <div className="mx-auto max-w-[1540px] space-y-5 pb-8">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="premium-gradient animate-rise relative overflow-hidden rounded-[2.5rem] p-5 text-primary-foreground shadow-[0_34px_90px_-58px_rgba(31,27,24,0.95)] md:p-7">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="mb-5 text-sm font-semibold text-white/72">{greeting}</p>
                <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
                  Dashboard patrimonial
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/66">
                  Indicadores, fluxo financeiro e composição do portfólio em uma leitura rápida.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-white/18 bg-white/12 text-white hover:bg-white/18" asChild>
                  <Link to="/properties/new">
                    <Plus className="h-4 w-4" />
                    Novo imóvel
                  </Link>
                </Button>
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/16" asChild>
                  <Link to="/reports">
                    Relatórios
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="min-h-[270px] rounded-[2rem] border border-white/14 bg-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Resultado do período</p>
                  <p className="text-2xl font-semibold">{compactCurrency(periodSummary.balance)}</p>
                </div>
                <span className="rounded-full bg-white/14 px-3 py-1 text-xs text-white/72">
                  {DASHBOARD_PERIOD_MONTHS} meses
                </span>
              </div>

              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyCashFlowData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardRevenue" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.72} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="dashboardExpense" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#d9b979" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#d9b979" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }} />
                    <YAxis hide domain={[0, "auto"]} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "revenue" ? "Receitas" : "Despesas",
                      ]}
                      contentStyle={{
                        background: "rgba(32,28,27,0.94)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "18px",
                        color: "#fff",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Area type="monotone" dataKey="expenses" stroke="#d9b979" fill="url(#dashboardExpense)" strokeWidth={2} />
                    <Area type="monotone" dataKey="revenue" stroke="#ffffff" fill="url(#dashboardRevenue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <aside className="premium-panel dark:premium-panel-dark animate-rise rounded-[2.5rem] p-5">
          <PanelHeader eyebrow="Score" title="Saúde operacional" />
          <div className="flex items-center gap-5">
            <div
              className="grid h-36 w-36 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#c4934f ${score * 3.6}deg, rgba(36,32,33,0.1) 0deg)`,
              }}
            >
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner dark:bg-card">
                <span className="text-3xl font-semibold">{score}</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Ocupação, resultado do período e ROI médio.
              </p>
              <div className="mt-5 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Ocupação</span>
                    <span>{metrics.occupancyRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-[#6f8f74]" style={{ width: `${Math.min(metrics.occupancyRate, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>ROI médio</span>
                    <span>{averageMonthlyROI.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-[#c4934f]"
                      style={{ width: `${Math.min(Math.max(averageMonthlyROI * 24, 0), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="premium-panel dark:premium-panel-dark animate-rise rounded-[2.5rem] p-5">
          <PanelHeader
            eyebrow="Financeiro"
            title="Receitas x despesas"
            action={<CircleDollarSign className="h-5 w-5 text-accent" />}
          />
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCashFlowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(36,32,33,0.08)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6f6760", fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6f6760", fontSize: 12 }}
                  tickFormatter={(value) => compactCurrency(Number(value))}
                  width={72}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "revenue" ? "Receitas" : "Despesas",
                  ]}
                  contentStyle={{
                    background: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(36,32,33,0.1)",
                    borderRadius: "18px",
                    boxShadow: "0 24px 60px -40px rgba(31,27,24,0.8)",
                  }}
                />
                <Bar dataKey="revenue" fill="#c4934f" radius={[14, 14, 4, 4]} />
                <Bar dataKey="expenses" fill="#4f6f85" radius={[14, 14, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-panel dark:premium-panel-dark animate-rise rounded-[2.5rem] p-5">
          <PanelHeader eyebrow="Portfólio" title="Composição por tipo" action={<Building2 className="h-5 w-5 text-accent" />} />
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] xl:grid-cols-1 2xl:grid-cols-[0.9fr_1.1fr]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propertyTypesData} innerRadius={58} outerRadius={92} paddingAngle={4} dataKey="value">
                    {propertyTypesData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}`, "Quantidade"]}
                    contentStyle={{
                      borderRadius: "18px",
                      border: "1px solid rgba(36,32,33,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {propertyTypesData.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  Nenhum imóvel cadastrado.
                </div>
              ) : (
                propertyTypesData.slice(0, 6).map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-3 py-2 dark:bg-white/5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="premium-panel dark:premium-panel-dark animate-rise rounded-[2.5rem] p-5">
          <PanelHeader eyebrow="Ativos" title="Maiores posições" action={<FileCheck2 className="h-5 w-5 text-accent" />} />
          <div className="space-y-3">
            {topProperties.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Cadastre seu primeiro imóvel para visualizar o ranking.
              </div>
            ) : (
              topProperties.map((property, index) => {
                const maxValue = Number(topProperties[0]?.value || 1);
                const currentValue = Number(property.value || 0);
                const width = Math.max((currentValue / maxValue) * 100, 8);

                return (
                  <Link
                    key={property.id}
                    to={`/properties/${property.id}`}
                    className="group block w-full rounded-3xl border border-white/60 bg-white/55 p-4 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{index + 1}. {property.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {property.city}, {property.state}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span>{translatePropertyType(property.type)}</span>
                      <strong>{formatCurrency(currentValue)}</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#242021] to-[#c4934f]" style={{ width: `${width}%` }} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <AgendaTodayWidget />
      </section>
    </div>
  );
}
