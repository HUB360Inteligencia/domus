import { startOfDay } from "date-fns";

import { parseDateOnly } from "@/lib/dates";

type ContractLike = {
  status: string;
  start_date?: string | null;
  end_date?: string | null;
};

/**
 * O status "active" é gravado no cadastro e não expira sozinho quando a data de
 * término passa. Para métricas (ocupação, cobranças previstas, ROI) o que importa
 * é se o contrato está vigente hoje.
 */
export function isContractInForce(contract: ContractLike, referenceDate: Date = new Date()): boolean {
  if (contract.status !== "active") return false;
  const today = startOfDay(referenceDate);

  if (contract.end_date) {
    const end = parseDateOnly(contract.end_date);
    if (!Number.isNaN(end.getTime()) && end < today) return false;
  }
  if (contract.start_date) {
    const start = parseDateOnly(contract.start_date);
    if (!Number.isNaN(start.getTime()) && start > today) return false;
  }
  return true;
}

/** Contrato marcado como ativo cuja data de término já passou. */
export function isContractOverdueForRenewal(contract: ContractLike, referenceDate: Date = new Date()): boolean {
  if (contract.status !== "active" || !contract.end_date) return false;
  const end = parseDateOnly(contract.end_date);
  return !Number.isNaN(end.getTime()) && end < startOfDay(referenceDate);
}

/** Status para exibição: "expired" quando está ativo no cadastro mas já terminou. */
export function getEffectiveContractStatus<T extends string>(contract: ContractLike & { status: T }, referenceDate?: Date): T | "expired" {
  return isContractOverdueForRenewal(contract, referenceDate) ? "expired" : contract.status;
}
