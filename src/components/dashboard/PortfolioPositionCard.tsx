import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowDownLeft, ArrowRight, ArrowUpRight, PieChart, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioPosition } from "@/hooks/use-portfolio-position";
import { formatCurrency } from "@/utils/currency";
import { cn } from "@/lib/utils";

interface PortfolioPositionCardProps {
  /** Valor de mercado da carteira já na visão corrente (bruto ou minha cota). */
  marketValue: number;
}

function Row({
  label,
  value,
  hint,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative";
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className={cn("text-sm", strong ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <p
        className={cn(
          "shrink-0 text-right font-semibold tabular-nums",
          strong && "text-lg",
          tone === "positive" && "text-emerald-700 dark:text-emerald-400",
          tone === "negative" && "text-rose-700 dark:text-rose-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * "Integrar tudo e dar um valor": o patrimônio líquido (carteira menos o que ainda
 * se deve das compras) ao lado do caixa previsto — aluguéis a receber, contas do
 * imóvel e parcelas a pagar — e do que já atrasou.
 */
export function PortfolioPositionCard({ marketValue }: PortfolioPositionCardProps) {
  const { position, mode, isLoading } = usePortfolioPosition(marketValue);
  const predictedBalance = position.receivableUpcoming - position.payableUpcoming;
  const hasDebt = position.outstandingDebt > 0;

  return (
    <section className="premium-panel dark:premium-panel-dark animate-rise rounded-[2.5rem] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Consolidado</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Posição patrimonial</h2>
        </div>
        {mode === "mine" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <PieChart className="h-3.5 w-3.5" />
            Minha cota
          </span>
        ) : (
          <Scale className="h-5 w-5 text-accent" />
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/60 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-muted-foreground">Patrimônio líquido</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{formatCurrency(position.netWorth)}</p>

            {hasDebt && position.marketValue > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Já é seu</span>
                  <span>{(position.equityRatio * 100).toFixed(1)}% da carteira</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6f8f74] to-[#c4934f]"
                    style={{ width: `${position.equityRatio * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 divide-y divide-border/70">
              <Row label="Valor de mercado da carteira" value={formatCurrency(position.marketValue)} />
              <Row
                label="(−) Saldo devedor das compras"
                value={hasDebt ? formatCurrency(position.outstandingDebt) : "Sem dívidas"}
                hint={hasDebt ? `${position.pendingInstallments} parcela(s) em aberto` : undefined}
                tone={hasDebt ? "negative" : "default"}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-muted-foreground">Próximos {position.windowDays} dias</p>
            <div className="mt-1 divide-y divide-border/70">
              <Row
                label="A receber"
                hint="Aluguéis previstos"
                value={formatCurrency(position.receivableUpcoming)}
                tone="positive"
              />
              <Row
                label="A pagar"
                hint="Contas do imóvel e parcelas da compra"
                value={formatCurrency(position.payableUpcoming)}
                tone={position.payableUpcoming > 0 ? "negative" : "default"}
              />
              <Row
                label="Saldo previsto"
                value={formatCurrency(predictedBalance)}
                tone={predictedBalance >= 0 ? "positive" : "negative"}
                strong
              />
            </div>

            {position.overdueCount > 0 ? (
              <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  {position.overdueCount} item(ns) em atraso
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {position.overdueReceivable > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ArrowDownLeft className="h-3.5 w-3.5" />A receber {formatCurrency(position.overdueReceivable)}
                    </span>
                  )}
                  {position.overduePayable > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5" />A pagar {formatCurrency(position.overduePayable)}
                    </span>
                  )}
                  {position.tenantConfirmations > 0 && (
                    <span>{position.tenantConfirmations} conta(s) do inquilino a confirmar</span>
                  )}
                </div>
              </div>
            ) : (
              position.tenantConfirmations > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {position.tenantConfirmations} conta(s) paga(s) pelo inquilino aguardando confirmação.
                </p>
              )
            )}

            <Button variant="ghost" size="sm" className="mt-2 h-9 w-full text-xs" asChild>
              <Link to="/agenda">
                Ver vencimentos na agenda
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
