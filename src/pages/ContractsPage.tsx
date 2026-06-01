import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Home,
  MapPin,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TransactionModal } from "@/components/finances/transaction-modal";
import {
  FinancialTransaction,
  TransactionFormData,
  useFinancialTransactions,
} from "@/hooks/use-financial-transactions";
import { useFinancialCategories } from "@/hooks/use-financial-categories";
import { useContracts } from "@/hooks/use-contracts";
import { useProperties } from "@/hooks/use-properties";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { Contract, ContractStatus } from "@/types/contract";

type PaymentState = "paid" | "late" | "due" | "scheduled" | "inactive";
type StatusFilter = "all" | ContractStatus;
type PaymentFilter = "all" | PaymentState | "expiring";

interface EnrichedContract {
  contract: Contract;
  propertyTitle: string;
  location: string;
  paymentDate: Date | null;
  paymentState: PaymentState;
  paymentLabel: string;
  daysUntilPayment: number | null;
  daysUntilEnd: number | null;
  termProgress: number;
  receivedThisMonth: number;
  expectedMonthlyValue: number;
}

interface TimelineEvent {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  tone: "success" | "warning" | "danger" | "neutral";
  icon: React.ElementType;
}

const statusLabels: Record<ContractStatus, string> = {
  active: "Ativo",
  pending: "Pendente",
  expired: "Expirado",
  canceled: "Cancelado",
  draft: "Rascunho",
};

const paymentLabels: Record<PaymentState, string> = {
  paid: "Pago",
  late: "Em atraso",
  due: "Vence em breve",
  scheduled: "A vencer",
  inactive: "Fora da vigencia",
};

const formatDate = (date: Date | string | null) => {
  if (!date) return "-";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(parsedDate);
};

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(date);

const getMonthInputValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const diffInDays = (from: Date, to: Date) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(0, 0, 0, 0);
  return Math.ceil((toDate.getTime() - fromDate.getTime()) / 86_400_000);
};

const getLastDayOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const getPaymentDateForMonth = (contract: Contract, baseDate: Date) => {
  if (contract.status !== "active") return null;
  const paymentDay = contract.payment_due_day || contract.payment_day || 1;
  const day = Math.min(paymentDay, getLastDayOfMonth(baseDate));
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), day);
};

const isTransactionInMonth = (transaction: FinancialTransaction, month: string) =>
  transaction.transaction_date?.startsWith(month);

const getContractSearchText = (contract: Contract) =>
  [
    contract.title,
    contract.tenant_name,
    contract.tenant_contact,
    contract.property?.title,
    contract.property?.address,
    contract.property?.neighborhood,
    contract.property?.city,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const buildPaymentInitialData = (
  enriched: EnrichedContract,
  categoryId: string,
): TransactionFormData => {
  const today = new Date();
  const propertyName = enriched.propertyTitle || "imovel";

  return {
    name: `Aluguel ${formatMonth(today)} - ${propertyName}`,
    amount: enriched.contract.value || 0,
    transaction_type: "income",
    category: categoryId,
    subcategory: null,
    description: `Recebimento referente ao contrato ${enriched.contract.title} com ${enriched.contract.tenant_name}.`,
    transaction_date: today.toISOString().split("T")[0],
    payment_method: null,
    recurring: false,
    recurring_frequency: null,
    recurring_end_date: null,
    property_id: enriched.contract.property_id,
    receipt_url: null,
  };
};

const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    contracts,
    deleteContract,
    isLoadingContracts,
    isDeletingContract,
    refetchContracts,
  } = useContracts();
  const {
    transactions,
    createTransaction,
    isCreating,
  } = useFinancialTransactions();
  const {
    categories,
    incomeCategoryOptions,
    initializeDefaultCategories,
  } = useFinancialCategories();
  const { properties } = useProperties();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [selectedPayment, setSelectedPayment] = useState<TransactionFormData | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      initializeDefaultCategories().catch(() => undefined);
    }
  }, [categories.length, initializeDefaultCategories]);

  const today = useMemo(() => new Date(), []);
  const currentMonth = getMonthInputValue(today);
  const rentalIncomeCategory = useMemo(
    () =>
      incomeCategoryOptions.find((category) =>
        category.label.toLowerCase().includes("alug"),
      ) || incomeCategoryOptions[0],
    [incomeCategoryOptions],
  );

  const enrichedContracts = useMemo<EnrichedContract[]>(() => {
    const currentMonthIncomeByProperty = new Map<string, number>();

    transactions.forEach((transaction) => {
      if (
        transaction.transaction_type === "income" &&
        transaction.property_id &&
        isTransactionInMonth(transaction, currentMonth)
      ) {
        currentMonthIncomeByProperty.set(
          transaction.property_id,
          (currentMonthIncomeByProperty.get(transaction.property_id) || 0) + Number(transaction.amount || 0),
        );
      }
    });

    return contracts.map((contract) => {
      const property = contract.property;
      const propertyTitle = property?.title || "Imovel nao vinculado";
      const location = [property?.neighborhood, property?.city].filter(Boolean).join(", ");
      const paymentDate = getPaymentDateForMonth(contract, today);
      const receivedThisMonth = contract.property_id
        ? currentMonthIncomeByProperty.get(contract.property_id) || 0
        : 0;
      const hasPayment = contract.value > 0 && receivedThisMonth >= contract.value * 0.75;
      const daysUntilPayment = paymentDate ? diffInDays(today, paymentDate) : null;
      const endDate = new Date(contract.end_date);
      const startDate = new Date(contract.start_date);
      const daysUntilEnd = Number.isNaN(endDate.getTime()) ? null : diffInDays(today, endDate);
      const duration = Math.max(endDate.getTime() - startDate.getTime(), 1);
      const elapsed = today.getTime() - startDate.getTime();
      const termProgress = Number.isNaN(endDate.getTime()) || Number.isNaN(startDate.getTime())
        ? 0
        : clamp((elapsed / duration) * 100);

      let paymentState: PaymentState = "inactive";
      if (contract.status === "active" && paymentDate) {
        if (hasPayment) paymentState = "paid";
        else if (daysUntilPayment !== null && daysUntilPayment < 0) paymentState = "late";
        else if (daysUntilPayment !== null && daysUntilPayment <= 5) paymentState = "due";
        else paymentState = "scheduled";
      }

      return {
        contract,
        propertyTitle,
        location,
        paymentDate,
        paymentState,
        paymentLabel: paymentLabels[paymentState],
        daysUntilPayment,
        daysUntilEnd,
        termProgress,
        receivedThisMonth,
        expectedMonthlyValue: contract.status === "active" ? contract.value || 0 : 0,
      };
    });
  }, [contracts, currentMonth, today, transactions]);

  const summary = useMemo(() => {
    const active = enrichedContracts.filter((item) => item.contract.status === "active");
    const expiringSoon = active.filter(
      (item) => item.daysUntilEnd !== null && item.daysUntilEnd >= 0 && item.daysUntilEnd <= 60,
    );
    const latePayments = active.filter((item) => item.paymentState === "late");
    const dueSoon = active.filter((item) => item.paymentState === "due");
    const expectedMonthlyRevenue = active.reduce((sum, item) => sum + item.expectedMonthlyValue, 0);
    const receivedThisMonth = active.reduce((sum, item) => sum + item.receivedThisMonth, 0);
    const collectionRate = expectedMonthlyRevenue > 0
      ? clamp((receivedThisMonth / expectedMonthlyRevenue) * 100)
      : 0;

    return {
      total: enrichedContracts.length,
      active: active.length,
      pending: enrichedContracts.filter((item) => item.contract.status === "pending").length,
      expiringSoon: expiringSoon.length,
      latePayments: latePayments.length,
      attention: latePayments.length + dueSoon.length + expiringSoon.length,
      expectedMonthlyRevenue,
      receivedThisMonth,
      collectionRate,
      occupancyRate: properties.length > 0 ? clamp((active.length / properties.length) * 100) : 0,
    };
  }, [enrichedContracts, properties.length]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    enrichedContracts.forEach((item) => {
      if (item.contract.status === "active" && item.paymentDate) {
        events.push({
          id: `${item.contract.id}-payment`,
          title: item.paymentState === "paid" ? "Pagamento registrado" : "Pagamento do aluguel",
          subtitle: `${item.propertyTitle} - ${formatCurrency(item.contract.value || 0)}`,
          date: item.paymentDate,
          tone:
            item.paymentState === "paid"
              ? "success"
              : item.paymentState === "late"
                ? "danger"
                : item.paymentState === "due"
                  ? "warning"
                  : "neutral",
          icon: item.paymentState === "paid" ? CheckCircle2 : ReceiptText,
        });
      }

      if (
        item.contract.status === "active" &&
        item.daysUntilEnd !== null &&
        item.daysUntilEnd >= 0 &&
        item.daysUntilEnd <= 90
      ) {
        events.push({
          id: `${item.contract.id}-expiration`,
          title: "Contrato perto do vencimento",
          subtitle: `${item.contract.tenant_name} - ${item.propertyTitle}`,
          date: new Date(item.contract.end_date),
          tone: item.daysUntilEnd <= 30 ? "danger" : "warning",
          icon: TimerReset,
        });
      }

      if (item.contract.adjustment_date) {
        const adjustmentDate = new Date(item.contract.adjustment_date);
        const daysUntilAdjustment = diffInDays(today, adjustmentDate);
        if (!Number.isNaN(adjustmentDate.getTime()) && daysUntilAdjustment >= 0 && daysUntilAdjustment <= 90) {
          events.push({
            id: `${item.contract.id}-adjustment`,
            title: "Reajuste programado",
            subtitle: `${item.contract.adjustment_index || "Indice"} - ${item.propertyTitle}`,
            date: adjustmentDate,
            tone: "warning",
            icon: CalendarClock,
          });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 7);
  }, [enrichedContracts, today]);

  const filteredContracts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return enrichedContracts
      .filter((item) => {
        if (normalizedSearch && !getContractSearchText(item.contract).includes(normalizedSearch)) {
          return false;
        }

        if (statusFilter !== "all" && item.contract.status !== statusFilter) {
          return false;
        }

        if (paymentFilter === "expiring") {
          return item.daysUntilEnd !== null && item.daysUntilEnd >= 0 && item.daysUntilEnd <= 60;
        }

        if (paymentFilter !== "all" && item.paymentState !== paymentFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priority = (item: EnrichedContract) => {
          if (item.paymentState === "late") return 0;
          if (item.paymentState === "due") return 1;
          if (item.daysUntilEnd !== null && item.daysUntilEnd <= 60 && item.daysUntilEnd >= 0) return 2;
          if (item.contract.status === "active") return 3;
          return 4;
        };

        return priority(a) - priority(b);
      });
  }, [enrichedContracts, paymentFilter, searchTerm, statusFilter]);

  const handleView = (contract: Contract) => {
    if (contract.property_id) {
      navigate(`/properties/${contract.property_id}?tab=contracts&contractId=${contract.id}`);
      return;
    }

    navigate(`/contracts/${contract.id}`);
  };

  const handleOpenPaymentModal = (item: EnrichedContract) => {
    if (!rentalIncomeCategory?.value) {
      toast.error("Crie uma categoria de receita antes de registrar o pagamento.");
      return;
    }

    setSelectedPayment(buildPaymentInitialData(item, rentalIncomeCategory.value));
  };

  const handleSubmitPayment = async (data: TransactionFormData) => {
    await createTransaction(data);
    setSelectedPayment(null);
  };

  const handleDelete = async (contractId: string) => {
    try {
      await deleteContract(contractId);
      await refetchContracts();
      toast.success("Contrato excluido com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente em instantes.";
      toast.error(`Erro ao excluir contrato: ${message}`);
    }
  };

  if (isLoadingContracts) {
    return (
      <div className="space-y-6">
        <div className="premium-panel animate-pulse rounded-[2rem] p-8">
          <div className="h-8 w-64 rounded-full bg-muted" />
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 rounded-3xl bg-muted" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-52 animate-pulse rounded-[1.75rem] bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="premium-gradient overflow-hidden rounded-[2rem] p-6 text-white shadow-2xl shadow-stone-950/20 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border-white/20 bg-white/12 px-3 py-1 text-white hover:bg-white/15">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Locações
              </Badge>
              <Badge className="rounded-full border-white/15 bg-white/10 px-3 py-1 text-white/85 hover:bg-white/15">
                {formatMonth(today)}
              </Badge>
            </div>

            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/55">
                Operação patrimonial
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
                Contratos, pagamentos e vencimentos em uma leitura.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                Acompanhe o que está ativo, o que precisa de ação e o quanto do aluguel previsto já foi registrado no mês.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/contracts/new")}
                className="h-11 rounded-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo contrato
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/finances")}
                className="h-11 rounded-full border-white/25 bg-white/10 text-white hover:bg-white/16 hover:text-white"
              >
                <WalletCards className="mr-2 h-4 w-4" />
                Ver financeiro
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/18 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60">Receita prevista no mês</p>
                <p className="mt-2 text-4xl font-semibold">{formatCurrency(summary.expectedMonthlyRevenue)}</p>
              </div>
              <div className="rounded-2xl bg-white/12 p-3">
                <Banknote className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Recebido registrado</span>
                <span className="font-medium">{summary.collectionRate.toFixed(0)}%</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-white/14">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white via-amber-100 to-amber-300"
                  style={{ width: `${summary.collectionRate}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/55">
                <span>{formatCurrency(summary.receivedThisMonth)}</span>
                <span>{formatCurrency(Math.max(summary.expectedMonthlyRevenue - summary.receivedThisMonth, 0))} a acompanhar</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <HeroMiniStat label="Contratos ativos" value={summary.active.toString()} />
              <HeroMiniStat label="Ocupação" value={`${summary.occupancyRate.toFixed(0)}%`} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ShieldCheck}
          label="Contratos ativos"
          value={summary.active.toString()}
          detail={`${summary.total} contratos cadastrados`}
          tone="dark"
        />
        <MetricCard
          icon={ReceiptText}
          label="Recebido no mês"
          value={formatCurrency(summary.receivedThisMonth)}
          detail={`${summary.collectionRate.toFixed(0)}% do previsto`}
          tone="success"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Pagamentos em atraso"
          value={summary.latePayments.toString()}
          detail="Sem receita registrada após o vencimento"
          tone="danger"
        />
        <MetricCard
          icon={TimerReset}
          label="Vencendo em 60 dias"
          value={summary.expiringSoon.toString()}
          detail="Contratos para revisar ou renovar"
          tone="warning"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="premium-panel rounded-[2rem] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por contrato, inquilino, imóvel ou endereço"
                  className="h-12 rounded-2xl border-transparent bg-white/70 pl-11 shadow-sm"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="h-12 rounded-2xl border-transparent bg-white/70 shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                  <SelectItem value="canceled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentFilter)}>
                <SelectTrigger className="h-12 rounded-2xl border-transparent bg-white/70 shadow-sm">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="late">Em atraso</SelectItem>
                  <SelectItem value="due">Vence em breve</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="scheduled">A vencer</SelectItem>
                  <SelectItem value="expiring">Vencendo contrato</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentFilter("all");
                }}
                className="h-12 rounded-2xl border-stone-200 bg-white/70 px-5"
              >
                Limpar
              </Button>
            </div>
          </div>

          {filteredContracts.length === 0 ? (
            <div className="premium-panel flex min-h-[340px] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
              <div className="rounded-3xl bg-stone-950 p-4 text-white">
                <FileText className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">Nenhuma locação encontrada</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Ajuste os filtros ou crie um contrato para conectar imóvel, inquilino e fluxo financeiro.
              </p>
              <Button onClick={() => navigate("/contracts/new")} className="mt-6 rounded-full">
                <Plus className="mr-2 h-4 w-4" />
                Criar contrato
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredContracts.map((item) => (
                <ContractOperationCard
                  key={item.contract.id}
                  item={item}
                  isDeleting={isDeletingContract}
                  onView={() => handleView(item.contract)}
                  onEdit={() => navigate(`/contracts/edit/${item.contract.id}`)}
                  onRegisterPayment={() => handleOpenPaymentModal(item)}
                  onDelete={() => handleDelete(item.contract.id)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="premium-panel rounded-[2rem] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Agenda
                </p>
                <h2 className="mt-2 text-xl font-semibold">Próximos movimentos</h2>
              </div>
              <div className="rounded-2xl bg-stone-950 p-3 text-white">
                <CalendarClock className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {timelineEvents.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-white/50 p-5 text-sm text-muted-foreground">
                  Nenhum pagamento, reajuste ou vencimento crítico nos próximos dias.
                </div>
              ) : (
                timelineEvents.map((event) => <TimelineRow key={event.id} event={event} />)
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-stone-950 p-5 text-white shadow-2xl shadow-stone-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                  Operação
                </p>
                <h2 className="mt-2 text-xl font-semibold">Leitura rápida</h2>
              </div>
              <WalletCards className="h-5 w-5 text-amber-200" />
            </div>
            <div className="mt-5 space-y-3 text-sm text-white/74">
              <InsightLine
                label="Fluxo previsto"
                value={formatCurrency(summary.expectedMonthlyRevenue)}
              />
              <InsightLine
                label="Pontos de atenção"
                value={summary.attention.toString()}
              />
              <InsightLine
                label="Contratos pendentes"
                value={summary.pending.toString()}
              />
            </div>
          </div>
        </aside>
      </section>

      <TransactionModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onSubmit={handleSubmitPayment}
        initialData={selectedPayment || undefined}
        isSubmitting={isCreating}
        properties={properties.map((property) => ({ label: property.title, value: property.id }))}
        categories={incomeCategoryOptions}
      />
    </div>
  );
};

interface HeroMiniStatProps {
  label: string;
  value: string;
}

function HeroMiniStat({ label, value }: HeroMiniStatProps) {
  return (
    <div className="rounded-3xl border border-white/14 bg-white/10 p-4">
      <p className="text-xs text-white/52">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone: "dark" | "success" | "warning" | "danger";
}

function MetricCard({ icon: Icon, label, value, detail, tone }: MetricCardProps) {
  const toneClass = {
    dark: "bg-stone-950 text-white",
    success: "bg-emerald-700 text-white",
    warning: "bg-amber-600 text-white",
    danger: "bg-rose-700 text-white",
  }[tone];

  return (
    <div className="premium-panel rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("rounded-2xl p-3", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

interface ContractOperationCardProps {
  item: EnrichedContract;
  isDeleting: boolean;
  onView: () => void;
  onEdit: () => void;
  onRegisterPayment: () => void;
  onDelete: () => void;
}

function ContractOperationCard({
  item,
  isDeleting,
  onView,
  onEdit,
  onRegisterPayment,
  onDelete,
}: ContractOperationCardProps) {
  const { contract } = item;
  const paymentTone = {
    paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
    late: "border-rose-200 bg-rose-50 text-rose-800",
    due: "border-amber-200 bg-amber-50 text-amber-800",
    scheduled: "border-stone-200 bg-stone-50 text-stone-700",
    inactive: "border-stone-200 bg-stone-100 text-stone-500",
  }[item.paymentState];
  const statusTone = contract.status === "active"
    ? "bg-stone-950 text-white"
    : contract.status === "pending"
      ? "bg-amber-100 text-amber-800"
      : "bg-stone-100 text-stone-600";

  return (
    <article className="premium-panel overflow-hidden rounded-[2rem] p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-stone-950/10">
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("rounded-full px-3 py-1 hover:bg-stone-950", statusTone)}>
                  {statusLabels[contract.status]}
                </Badge>
                <Badge variant="outline" className={cn("rounded-full px-3 py-1", paymentTone)}>
                  {item.paymentLabel}
                </Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{contract.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Home className="h-4 w-4" />
                  {item.propertyTitle}
                </span>
                {item.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Aluguel mensal</p>
              <p className="text-2xl font-semibold">{formatCurrency(contract.value || 0)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SmallInfo icon={UserRound} label="Inquilino" value={contract.tenant_name || "-"} />
            <SmallInfo icon={Clock3} label="Vigência" value={`${formatDate(contract.start_date)} - ${formatDate(contract.end_date)}`} />
            <SmallInfo
              icon={ReceiptText}
              label="Vencimento"
              value={item.paymentDate ? `Dia ${formatDate(item.paymentDate)}` : "-"}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso do contrato</span>
              <span>{item.termProgress.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-stone-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-stone-950 via-stone-700 to-amber-500"
                style={{ width: `${item.termProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-stone-200/70 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Ações rápidas
          </p>

          <div className="mt-4 grid gap-2">
            <Button onClick={onRegisterPayment} className="h-11 justify-start rounded-2xl">
              <ReceiptText className="mr-2 h-4 w-4" />
              Registrar pagamento
            </Button>
            <Button variant="outline" onClick={onView} className="h-11 justify-start rounded-2xl bg-white/70">
              <Eye className="mr-2 h-4 w-4" />
              Ver imóvel/contrato
            </Button>
            <Button variant="outline" onClick={onEdit} className="h-11 justify-start rounded-2xl bg-white/70">
              <Pencil className="mr-2 h-4 w-4" />
              Editar contrato
            </Button>
          </div>

          <div className="mt-4 rounded-2xl bg-stone-950 p-4 text-white">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/62">Recebido no mês</span>
              <span>{formatCurrency(item.receivedThisMonth)}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-emerald-300"
                style={{ width: `${clamp((item.receivedThisMonth / Math.max(contract.value || 1, 1)) * 100)}%` }}
              />
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                disabled={isDeleting}
                className="mt-3 h-10 w-full justify-start rounded-2xl text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove o contrato da sua operação de locação. As transações financeiras já registradas permanecem no histórico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-rose-700 text-white hover:bg-rose-800">
                  Excluir contrato
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </article>
  );
}

interface SmallInfoProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function SmallInfo({ icon: Icon, label, value }: SmallInfoProps) {
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white/60 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium">{value}</p>
    </div>
  );
}

interface TimelineRowProps {
  event: TimelineEvent;
}

function TimelineRow({ event }: TimelineRowProps) {
  const toneClass = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
    neutral: "bg-stone-100 text-stone-700",
  }[event.tone];
  const Icon = event.icon;

  return (
    <div className="flex gap-3 rounded-3xl border border-stone-200/70 bg-white/65 p-3">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", toneClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-5">{event.title}</p>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{event.subtitle}</p>
        <p className="mt-2 text-xs font-medium text-stone-700">{formatDate(event.date)}</p>
      </div>
    </div>
  );
}

interface InsightLineProps {
  label: string;
  value: string;
}

function InsightLine({ label, value }: InsightLineProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/8 px-4 py-3">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export default ContractsPage;
