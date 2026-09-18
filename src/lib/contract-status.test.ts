import { describe, expect, it } from "vitest";
import { getEffectiveContractStatus, isContractInForce, isContractOverdueForRenewal } from "./contract-status";

const today = new Date(2026, 8, 18, 15, 0);

describe("isContractInForce", () => {
  it("considera vigente o contrato ativo dentro do período (inclusive no último dia)", () => {
    expect(isContractInForce({ status: "active", start_date: "2025-01-01", end_date: "2026-09-18" }, today)).toBe(true);
  });

  it("não considera vigente o contrato ativo que já terminou", () => {
    expect(isContractInForce({ status: "active", start_date: "2025-01-01", end_date: "2026-09-17" }, today)).toBe(false);
  });

  it("não considera vigente o contrato que ainda não começou", () => {
    expect(isContractInForce({ status: "active", start_date: "2026-10-01", end_date: "2027-10-01" }, today)).toBe(false);
  });

  it("ignora contratos com outro status", () => {
    expect(isContractInForce({ status: "pending", start_date: "2025-01-01", end_date: "2027-01-01" }, today)).toBe(false);
  });
});

describe("getEffectiveContractStatus", () => {
  it("mostra 'expired' para ativo vencido e mantém os demais", () => {
    expect(isContractOverdueForRenewal({ status: "active", end_date: "2026-01-28" }, today)).toBe(true);
    expect(getEffectiveContractStatus({ status: "active", end_date: "2026-01-28" }, today)).toBe("expired");
    expect(getEffectiveContractStatus({ status: "active", end_date: "2027-01-28" }, today)).toBe("active");
    expect(getEffectiveContractStatus({ status: "canceled", end_date: "2020-01-01" }, today)).toBe("canceled");
  });
});
