import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Landmark,
  PieChart as PieChartIcon,
  Plus,
  ReceiptText,
  Search,
  Target,
  TrendingUp,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableTransactionTable } from "@/components/finances/resizable-transaction-table";
import { TransactionModal } from "@/components/finances/transaction-modal";
import { TransactionViewer } from "@/components/finances/transaction-viewer";
import { CategoryManagement } from "@/components/finances/category-management";
import { DeleteTransactionModal } from "@/components/finances/delete-transaction-modal";
import {
  FinancialTransaction,
  TransactionFormData,
  useFinancialTransactions,
} from "@/hooks/use-financial-transactions";
import { useFinancialCategories } from "@/hooks/use-financial-categories";
import { useProperties } from "@/hooks/use-properties";
import { useContracts } from "@/hooks/use-contracts";
import { formatCurrency } from "@/utils/currency";
import { cn } from "@/lib/utils";

type TransactionTypeFilter = "all" | "income" | "expense";
type NewTransactionType = "income" | "expense" | undefined;

interface PropertyPerformance {
  id: string;
  title: string;
  revenue: number;
  expenses: number;
  net: number;
  roi: number;
  expected: number;
  status: "rented" | "open";
}

const chartColors = ["#c4934f", "#6f7f63", "#a6614d", "#445f6f", "#3b332c", "#d6b36d"];

const getMonthInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
    new Date(year, monthNumber - 1, 1),
  );
};

const getShortMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);

const getPreviousMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return getMonthInputValue(new Date(year, monthNumber - 2, 1));
};

const isTransactionInMonth = (transaction: FinancialTransaction, month: string) =>
  transaction.transaction_date?.startsWith(month);

const makeTransactionDefaults = (type: "income" | "expense"): TransactionFormData => ({
  name: "",
  amount: 0,
  transaction_type: type,
  category: "",
  subcategory: null,
  description: "",
  transaction_date: new Date().toISOString().split("T")[0],
  payment_method: null,
  recurring: false,
  recurring_frequency: null,
  recurring_end_date: null,
  property_id: null,
  receipt_url: null,
});

export default function FinancesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<(TransactionFormData & { id: string }) | null>(null);
  const [newTransactionType, setNewTransactionType] = useState<NewTransactionType>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [transactionToView, setTransactionToView] = useState<FinancialTransaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthInputValue(new Date()));
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    transactions,
    isLoadingTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFinancialTransactions();
  const {
    categories,
    categoryOptions,
    incomeCategoryOptions,
    expenseCategoryOptions,
    initializeDefaultCategories,
  } = useFinancialCategories();
  const { properties } = useProperties();
  const { contracts } = useContracts();

  useEffect(() => {
    if (categories.length === 0) {
      initializeDefaultCategories().catch(() => undefined);
    }
  }, [categories.length, initializeDefaultCategories]);

  const propertyOptions = useMemo(
    () => properties.map((property) => ({ label: property.title, value: property.id })),
    [properties],
  );

  const activeContracts = useMemo(
    () => contracts.filter((contract) => contract.status === "active"),
    [contracts],
  );

  const activePropertyIds = useMemo(
    () => new Set(activeContracts.map((contract) => contract.property_id).filter(Boolean) as string[]),
    [activeContracts],
  );

  const monthlyTransactions = useMemo(
    () => transactions.filter((transaction) => isTransactionInMonth(transaction, selectedMonth)),
    [selectedMonth, transactions],
  );

  const previousMonthTransactions = useMemo(() => {
    const previousMonth = getPreviousMonth(selectedMonth);
    return transactions.filter((transaction) => isTransactionInMonth(transaction, previousMonth));
  }, [selectedMonth, transactions]);

  const financialSummary = useMemo(() => {
    const income = monthlyTransactions
      .filter((transaction) => transaction.transaction_type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const expenses = monthlyTransactions
      .filter((transaction) => transaction.transaction_type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const net = income - expenses;
    const previousIncome = previousMonthTransactions
      .filter((transaction) => transaction.transaction_type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const previousExpenses = previousMonthTransactions
      .filter((transaction) => transaction.transaction_type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const previousNet = previousIncome - previousExpenses;
    const expectedRent = activeContracts.reduce((sum, contract) => sum + Number(contract.value || 0), 0);
    const receivedRent = monthlyTransactions
      .filter(
        (transaction) =>
          transaction.transaction_type === "income" &&
          transaction.property_id &&
          activePropertyIds.has(transaction.property_id),
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const portfolioValue = properties.reduce((sum, property) => sum + Number(property.value || 0), 0);
    const monthlyRoi = portfolioValue > 0 ? (net / portfolioValue) * 100 : 0;
    const margin = income > 0 ? (net / income) * 100 : 0;
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
    const growth = previousNet !== 0 ? ((net - previousNet) / Math.abs(previousNet)) * 100 : net > 0 ? 100 : 0;

    return {
      income,
      expenses,
      net,
      previousNet,
      growth,
      expectedRent,
      receivedRent,
      receivable: Math.max(expectedRent - receivedRent, 0),
      collectionRate: expectedRent > 0 ? Math.min((receivedRent / expectedRent) * 100, 100) : 0,
      portfolioValue,
      monthlyRoi,
      margin,
      expenseRatio,
    };
  }, [activeContracts, activePropertyIds, monthlyTransactions, previousMonthTransactions, properties]);

  const lateRentalCount = useMemo(() => {
    const now = new Date();
    const [year, monthNumber] = selectedMonth.split("-").map(Number);
    const isCurrentMonth = selectedMonth === getMonthInputValue(now);
    const referenceDate = isCurrentMonth ? now : new Date(year, monthNumber, 0);

    return activeContracts.filter((contract) => {
      if (!contract.property_id) return false;
      const received = monthlyTransactions.some(
        (transaction) =>
          transaction.transaction_type === "income" &&
          transaction.property_id === contract.property_id &&
          Number(transaction.amount || 0) >= Number(contract.value || 0) * 0.75,
      );
      if (received) return false;

      const paymentDay = contract.payment_due_day || contract.payment_day || 1;
      const dueDate = new Date(year, monthNumber - 1, Math.min(paymentDay, new Date(year, monthNumber, 0).getDate()));
      return dueDate < referenceDate;
    }).length;
  }, [activeContracts, monthlyTransactions, selectedMonth]);

  const cashFlowData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
      const month = getMonthInputValue(date);
      const monthTransactions = transactions.filter((transaction) => isTransactionInMonth(transaction, month));
      const income = monthTransactions
        .filter((transaction) => transaction.transaction_type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
      const expenses = monthTransactions
        .filter((transaction) => transaction.transaction_type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

      return {
        month: getShortMonthLabel(date),
        income,
        expenses,
        net: income - expenses,
      };
    });
  }, [transactions]);

  const expenseCategoryData = useMemo(() => {
    const groups = new Map<string, number>();
    monthlyTransactions
      .filter((transaction) => transaction.transaction_type === "expense")
      .forEach((transaction) => {
        const category = transaction.category_name || "Sem categoria";
        groups.set(category, (groups.get(category) || 0) + Number(transaction.amount || 0));
      });

    return Array.from(groups.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [monthlyTransactions]);

  const propertyPerformance = useMemo<PropertyPerformance[]>(() => {
    const expectedByProperty = new Map<string, number>();
    activeContracts.forEach((contract) => {
      if (contract.property_id) {
        expectedByProperty.set(contract.property_id, (expectedByProperty.get(contract.property_id) || 0) + Number(contract.value || 0));
      }
    });

    return properties
      .map((property) => {
        const propertyTransactions = monthlyTransactions.filter((transaction) => transaction.property_id === property.id);
        const revenue = propertyTransactions
          .filter((transaction) => transaction.transaction_type === "income")
          .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
        const expenses = propertyTransactions
          .filter((transaction) => transaction.transaction_type === "expense")
          .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
        const net = revenue - expenses;
        const value = Number(property.value || 0);

        return {
          id: property.id,
          title: property.title,
          revenue,
          expenses,
          net,
          roi: value > 0 ? (net / value) * 100 : 0,
          expected: expectedByProperty.get(property.id) || 0,
          status: expectedByProperty.has(property.id) ? "rented" : "open",
        };
      })
      .filter((property) => property.revenue !== 0 || property.expenses !== 0 || property.expected !== 0)
      .sort((a, b) => b.net - a.net)
      .slice(0, 6);
  }, [activeContracts, monthlyTransactions, properties]);

  const visibleTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return monthlyTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.transaction_type !== typeFilter) {
        return false;
      }

      if (propertyFilter !== "all" && transaction.property_id !== propertyFilter) {
        return false;
      }

      if (normalizedSearch) {
        const haystack = [
          transaction.name,
          transaction.description,
          transaction.category_name,
          transaction.property_title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [monthlyTransactions, propertyFilter, searchTerm, typeFilter]);

  const newTransactionInitialData = useMemo(
    () => (newTransactionType ? makeTransactionDefaults(newTransactionType) : undefined),
    [newTransactionType],
  );

  const handleOpenModal = (transaction?: FinancialTransaction, type?: "income" | "expense") => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setNewTransactionType(undefined);
    } else {
      setSelectedTransaction(null);
      setNewTransactionType(type);
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setNewTransactionType(undefined);
  };

  const handleSubmit = async (data: TransactionFormData) => {
    if (selectedTransaction?.id) {
      await updateTransaction({ ...data, id: selectedTransaction.id });
    } else {
      await createTransaction(data);
    }

    handleCloseModal();
  };

  const handleDeleteClick = (transaction: FinancialTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    await deleteTransaction(transactionToDelete.id);
    setDeleteModalOpen(false);
    setTransactionToDelete(null);
  };

  const handleViewDetails = (transaction: FinancialTransaction) => {
    setTransactionToView(transaction);
    setViewerOpen(true);
  };

  const handleViewReceipt = (transaction: FinancialTransaction) => {
    if (transaction.receipt_url) {
      window.open(transaction.receipt_url, "_blank");
    }
  };

  const resetFilters = () => {
    setTypeFilter("all");
    setPropertyFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 pb-10">
      <section className="premium-gradient rounded-[2rem] p-6 text-white shadow-2xl shadow-stone-950/20 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_430px]">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border-white/20 bg-white/12 px-3 py-1 text-white hover:bg-white/15">
                <Landmark className="mr-2 h-3.5 w-3.5" />
                Finanças
              </Badge>
              <Badge className="rounded-full border-white/15 bg-white/10 px-3 py-1 text-white/85 hover:bg-white/15">
                {getMonthLabel(selectedMonth)}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/55">
                Resultado financeiro
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                O dinheiro do portfólio, sem ruído.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                Compare aluguel previsto, recebimento real, despesas, saldo e ROI mensal em uma leitura executiva.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleOpenModal(undefined, "income")}
                className="h-11 rounded-full bg-white text-stone-950 hover:bg-white/90"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Nova receita
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenModal(undefined, "expense")}
                className="h-11 rounded-full border-white/25 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              >
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Nova despesa
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/18 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60">Saldo líquido do mês</p>
                <p className="mt-2 text-4xl font-semibold">{formatCurrency(financialSummary.net)}</p>
              </div>
              <div className="rounded-2xl bg-white/12 p-3">
                <WalletCards className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <HeroFinanceStat label="Receitas" value={formatCurrency(financialSummary.income)} />
              <HeroFinanceStat label="Despesas" value={formatCurrency(financialSummary.expenses)} />
              <HeroFinanceStat label="ROI mensal" value={`${financialSummary.monthlyRoi.toFixed(2)}%`} />
              <HeroFinanceStat label="Margem" value={`${financialSummary.margin.toFixed(0)}%`} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard
          icon={ReceiptText}
          label="Aluguel previsto"
          value={formatCurrency(financialSummary.expectedRent)}
          detail={`${financialSummary.collectionRate.toFixed(0)}% recebido`}
          tone="dark"
        />
        <FinanceKpiCard
          icon={Banknote}
          label="Recebido de locações"
          value={formatCurrency(financialSummary.receivedRent)}
          detail={`${formatCurrency(financialSummary.receivable)} a receber`}
          tone="success"
        />
        <FinanceKpiCard
          icon={CircleDollarSign}
          label="Despesas do mês"
          value={formatCurrency(financialSummary.expenses)}
          detail={`${financialSummary.expenseRatio.toFixed(0)}% das receitas`}
          tone="warning"
        />
        <FinanceKpiCard
          icon={Target}
          label="Inadimplência operacional"
          value={lateRentalCount.toString()}
          detail="Contratos sem pagamento registrado"
          tone="danger"
        />
      </section>

      <Tabs defaultValue="overview" className="space-y-5">
        <div className="premium-panel rounded-[1.5rem] p-2">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-[1.1rem] bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-2xl py-3 data-[state=active]:bg-stone-950 data-[state=active]:text-white">
              Visão geral
            </TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-2xl py-3 data-[state=active]:bg-stone-950 data-[state=active]:text-white">
              Transações
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-2xl py-3 data-[state=active]:bg-stone-950 data-[state=active]:text-white">
              Categorias
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="premium-panel rounded-[2rem] p-5">
              <PanelHeader
                icon={BarChart3}
                eyebrow="Fluxo"
                title="Receitas x despesas"
                description="Últimos 6 meses, com saldo líquido por período."
              />
              <div className="mt-6 h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6f7f63" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#6f7f63" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a6614d" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#a6614d" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(68, 55, 45, 0.12)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="income" name="Receitas" stroke="#6f7f63" fill="url(#incomeGradient)" strokeWidth={3} />
                    <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#a6614d" fill="url(#expenseGradient)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="premium-panel rounded-[2rem] p-5">
              <PanelHeader
                icon={PieChartIcon}
                eyebrow="Despesas"
                title="Categorias do mês"
                description="Onde o caixa está sendo consumido."
              />
              <div className="mt-5 h-[210px]">
                {expenseCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseCategoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyPanelText text="Nenhuma despesa registrada neste mês." />
                )}
              </div>
              <div className="mt-4 space-y-2">
                {expenseCategoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white/60 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
                      {item.name}
                    </span>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="premium-panel rounded-[2rem] p-5">
              <PanelHeader
                icon={TrendingUp}
                eyebrow="Rentabilidade"
                title="Performance por imóvel"
                description="Saldo do mês comparado ao previsto."
              />
              <div className="mt-5 space-y-3">
                {propertyPerformance.length === 0 ? (
                  <EmptyPanelText text="Ainda não há fluxo por imóvel neste período." />
                ) : (
                  propertyPerformance.map((property) => (
                    <PropertyPerformanceRow key={property.id} property={property} />
                  ))
                )}
              </div>
            </div>

            <div className="premium-panel rounded-[2rem] p-5">
              <PanelHeader
                icon={CalendarDays}
                eyebrow="Comparativo"
                title="Resultado mensal"
                description={`Variação contra ${getMonthLabel(getPreviousMonth(selectedMonth))}.`}
              />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <ComparisonCard
                  label="Saldo atual"
                  value={formatCurrency(financialSummary.net)}
                  detail="Receitas menos despesas"
                />
                <ComparisonCard
                  label="Mês anterior"
                  value={formatCurrency(financialSummary.previousNet)}
                  detail="Base de comparação"
                />
                <ComparisonCard
                  label="Variação"
                  value={`${financialSummary.growth >= 0 ? "+" : ""}${financialSummary.growth.toFixed(1)}%`}
                  detail="Evolução do saldo"
                  positive={financialSummary.growth >= 0}
                />
              </div>

              <div className="mt-6 h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(68, 55, 45, 0.12)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="net" name="Saldo" fill="#c4934f" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-5">
          <div className="premium-panel rounded-[2rem] p-4">
            <div className="grid gap-3 xl:grid-cols-[160px_150px_220px_1fr_auto]">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-12 rounded-2xl border-transparent bg-white/70 shadow-sm"
              />

              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionTypeFilter)}>
                <SelectTrigger className="h-12 rounded-2xl border-transparent bg-white/70 shadow-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="h-12 rounded-2xl border-transparent bg-white/70 shadow-sm">
                  <SelectValue placeholder="Imóvel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os imóveis</SelectItem>
                  {propertyOptions.map((property) => (
                    <SelectItem key={property.value} value={property.value}>
                      {property.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar transação, categoria ou imóvel"
                  className="h-12 rounded-2xl border-transparent bg-white/70 pl-11 shadow-sm"
                />
              </div>

              <Button variant="outline" onClick={resetFilters} className="h-12 rounded-2xl border-stone-200 bg-white/70">
                Limpar
              </Button>
            </div>
          </div>

          <div className="premium-panel overflow-hidden rounded-[2rem] p-2">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Lançamentos
                </p>
                <h2 className="text-xl font-semibold">{visibleTransactions.length} transações em {getMonthLabel(selectedMonth)}</h2>
              </div>
              <Button onClick={() => handleOpenModal(undefined)} className="rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Nova transação
              </Button>
            </div>

            <ResizableTransactionTable
              transactions={visibleTransactions}
              isLoading={isLoadingTransactions}
              onEdit={handleOpenModal}
              onDelete={handleDeleteClick}
              onViewReceipt={handleViewReceipt}
              onViewDetails={handleViewDetails}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="premium-panel rounded-[2rem] p-4">
            <CategoryManagement />
          </div>
        </TabsContent>
      </Tabs>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedTransaction || newTransactionInitialData}
        isSubmitting={isCreating || isUpdating}
        properties={propertyOptions}
        categories={
          newTransactionType === "income"
            ? incomeCategoryOptions
            : newTransactionType === "expense"
              ? expenseCategoryOptions
              : categoryOptions
        }
      />

      <TransactionViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setTransactionToView(null);
        }}
        transaction={transactionToView}
      />

      <DeleteTransactionModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        transactionName={transactionToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}

interface HeroFinanceStatProps {
  label: string;
  value: string;
}

function HeroFinanceStat({ label, value }: HeroFinanceStatProps) {
  return (
    <div className="rounded-3xl border border-white/14 bg-white/10 p-4">
      <p className="text-xs text-white/52">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

interface FinanceKpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone: "dark" | "success" | "warning" | "danger";
}

function FinanceKpiCard({ icon: Icon, label, value, detail, tone }: FinanceKpiCardProps) {
  const toneClass = {
    dark: "bg-stone-950 text-white",
    success: "bg-emerald-700 text-white",
    warning: "bg-amber-600 text-white",
    danger: "bg-rose-700 text-white",
  }[tone];

  return (
    <div className="premium-panel rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight xl:text-3xl">{value}</p>
        </div>
        <div className={cn("rounded-2xl p-3", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

interface PanelHeaderProps {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description: string;
}

function PanelHeader({ icon: Icon, eyebrow, title, description }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-2xl bg-stone-950 p-3 text-white">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

interface EmptyPanelTextProps {
  text: string;
}

function EmptyPanelText({ text }: EmptyPanelTextProps) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-white/50 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

interface PropertyPerformanceRowProps {
  property: PropertyPerformance;
}

function PropertyPerformanceRow({ property }: PropertyPerformanceRowProps) {
  const completion = property.expected > 0 ? Math.min((property.revenue / property.expected) * 100, 100) : 0;

  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white/65 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="truncate font-semibold">{property.title}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full">
              {property.status === "rented" ? "Locado" : "Sem contrato ativo"}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              ROI {property.roi.toFixed(2)}%
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-semibold", property.net >= 0 ? "text-emerald-700" : "text-rose-700")}>
            {formatCurrency(property.net)}
          </p>
          <p className="text-xs text-muted-foreground">saldo</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Receita</p>
          <p className="font-medium">{formatCurrency(property.revenue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Despesa</p>
          <p className="font-medium">{formatCurrency(property.expenses)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Previsto</p>
          <p className="font-medium">{formatCurrency(property.expected)}</p>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-stone-950 to-amber-500"
          style={{ width: `${completion}%` }}
        />
      </div>
    </div>
  );
}

interface ComparisonCardProps {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
}

function ComparisonCard({ label, value, detail, positive }: ComparisonCardProps) {
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white/65 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold", positive === true && "text-emerald-700", positive === false && "text-rose-700")}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
