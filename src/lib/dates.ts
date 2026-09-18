import { format } from "date-fns";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Converte valores vindos do banco em Date sem deslocamento de fuso.
 *
 * Colunas `date` do Postgres chegam como "2026-01-15". `new Date("2026-01-15")`
 * interpreta isso como meia-noite UTC, que no Brasil (UTC-3) vira 14/01 às 21h:
 * datas exibidas um dia antes e lançamentos do dia 1º caindo no mês anterior.
 * Aqui datas puras viram meia-noite local; timestamps completos seguem o parse padrão.
 */
export function parseDateOnly(value: string | Date | null | undefined): Date {
  if (value instanceof Date) return value;
  if (!value) return new Date(NaN);

  const match = DATE_ONLY_PATTERN.exec(value.trim());
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
}

/** Data local no formato aceito por colunas `date` (yyyy-MM-dd), sem passar por UTC. */
export function toDateOnlyString(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** Chave de mês (yyyy-MM) de uma data do banco, sem deslocamento de fuso. */
export function toMonthKey(value: string | Date | null | undefined): string {
  if (typeof value === "string" && /^\d{4}-\d{2}/.test(value) && value.length <= 10) {
    return value.slice(0, 7);
  }
  const date = parseDateOnly(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM");
}

/** Formata uma data do banco como dd/MM/yyyy (pt-BR). Retorna "" para valores inválidos. */
export function formatDateBR(value: string | Date | null | undefined): string {
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "dd/MM/yyyy");
}
