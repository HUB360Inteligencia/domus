import { describe, expect, it } from "vitest";
import { formatDateBR, parseDateOnly, toDateOnlyString, toMonthKey } from "./dates";

describe("parseDateOnly", () => {
  it("interpreta colunas date como meia-noite local (sem voltar um dia)", () => {
    const date = parseDateOnly("2026-09-01");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
  });

  it("mantém timestamps completos com o parse padrão", () => {
    const iso = "2026-09-01T15:30:00.000Z";
    expect(parseDateOnly(iso).getTime()).toBe(new Date(iso).getTime());
  });

  it("retorna data inválida para valores vazios", () => {
    expect(Number.isNaN(parseDateOnly(null).getTime())).toBe(true);
    expect(Number.isNaN(parseDateOnly("").getTime())).toBe(true);
  });
});

describe("toDateOnlyString", () => {
  it("usa a data local, não a UTC (ex.: 22h no Brasil continua sendo o mesmo dia)", () => {
    expect(toDateOnlyString(new Date(2026, 0, 31, 23, 59))).toBe("2026-01-31");
    expect(toDateOnlyString(new Date(2026, 1, 1, 0, 0))).toBe("2026-02-01");
  });
});

describe("toMonthKey", () => {
  it("lançamentos do dia 1º ficam no próprio mês", () => {
    expect(toMonthKey("2026-09-01")).toBe("2026-09");
    expect(toMonthKey(new Date(2026, 8, 1))).toBe("2026-09");
  });
});

describe("formatDateBR", () => {
  it("formata datas do banco em dd/MM/yyyy", () => {
    expect(formatDateBR("2026-01-15")).toBe("15/01/2026");
    expect(formatDateBR(undefined)).toBe("");
  });
});
