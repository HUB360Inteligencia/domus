import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

export interface ReportTemplate {
  id: string;
  name: string;
  fields: string[];
  createdAt: string;
}

export interface ReportConfig {
  name: string;
  fields: string[];
  dateRange: { start: string; end: string };
}

export type ReportRow = Record<string, string | number | null>;

export const REPORT_FIELDS = [
  { id: 'property', label: 'Imóvel', category: 'Imóveis', kind: 'text' },
  { id: 'status', label: 'Status', category: 'Imóveis', kind: 'text' },
  { id: 'type', label: 'Tipo', category: 'Imóveis', kind: 'text' },
  { id: 'value', label: 'Valor de mercado', category: 'Financeiro', kind: 'currency' },
  { id: 'rental_value', label: 'Valor de aluguel', category: 'Financeiro', kind: 'currency' },
  { id: 'revenue', label: 'Receitas', category: 'Financeiro', kind: 'currency' },
  { id: 'expenses', label: 'Despesas', category: 'Financeiro', kind: 'currency' },
  { id: 'net', label: 'Resultado', category: 'Financeiro', kind: 'currency' },
  { id: 'roi', label: 'ROI no período (%)', category: 'Financeiro', kind: 'percent' },
  { id: 'city', label: 'Cidade', category: 'Localização', kind: 'text' },
  { id: 'neighborhood', label: 'Bairro', category: 'Localização', kind: 'text' },
] as const;

export type ReportFieldId = (typeof REPORT_FIELDS)[number]['id'];

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  rented: 'Alugado',
  airbnb: 'Airbnb',
  maintenance: 'Em manutenção',
  sold: 'Vendido',
};

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  commercial: 'Comercial',
  land: 'Terreno',
  studio: 'Studio',
  office: 'Escritório',
  warehouse: 'Galpão',
  store: 'Loja',
  rural: 'Rural',
};

const PAGE_SIZE = 1000;

async function fetchTransactions(range: ReportConfig['dateRange']) {
  const rows: { property_id: string | null; amount: number; transaction_type: string }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase
      .from('financial_transactions')
      .select('property_id, amount, transaction_type')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (range.start) query = query.gte('transaction_date', range.start);
    if (range.end) query = query.lte('transaction_date', range.end);

    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

// ---- Exportação -------------------------------------------------------------

const formatCell = (fieldId: string, value: ReportRow[string]): string => {
  if (value === null || value === undefined || value === '') return '-';
  const field = REPORT_FIELDS.find((item) => item.id === fieldId);
  if (typeof value !== 'number' || !field) return String(value);
  if (field.kind === 'currency') {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  if (field.kind === 'percent') {
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }
  return value.toLocaleString('pt-BR');
};

export const formatReportCell = formatCell;

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'relatorio';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function exportCsv(rows: ReportRow[], fields: string[], name: string) {
  const headers = fields.map((id) => REPORT_FIELDS.find((field) => field.id === id)?.label || id);
  const csvValue = (fieldId: string, value: ReportRow[string]) => {
    // Números sem símbolo de moeda, com vírgula decimal (padrão do Excel em pt-BR)
    const text = typeof value === 'number'
      ? value.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 2 })
      : value === null || value === undefined ? '' : String(value);
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [headers.join(';'), ...rows.map((row) => fields.map((id) => csvValue(id, row[id])).join(';'))];
  // BOM para o Excel reconhecer UTF-8 (acentos)
  const blob = new Blob([String.fromCharCode(0xfeff) + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(name)}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportPdf(rows: ReportRow[], fields: string[], name: string, period: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.');
  }

  const headers = fields.map((id) => `<th>${escapeHtml(REPORT_FIELDS.find((field) => field.id === id)?.label || id)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${fields.map((id) => `<td>${escapeHtml(formatCell(id, row[id]))}</td>`).join('')}</tr>`)
    .join('');

  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${escapeHtml(name)}</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #1f1b1a; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { color: #6b635c; font-size: 12px; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #f3ede4; border-bottom: 2px solid #c4934f; padding: 8px; }
  td { border-bottom: 1px solid #e7e1d8; padding: 7px 8px; }
  tr:nth-child(even) td { background: #faf8f4; }
  @page { margin: 16mm; }
</style></head><body>
<h1>${escapeHtml(name)}</h1>
<p>${escapeHtml(period)} · ${rows.length} registro(s) · gerado em ${new Date().toLocaleString('pt-BR')}</p>
<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`);
  printWindow.document.close();
}

// ---- Hook -------------------------------------------------------------------

const templatesKey = (userId?: string) => `domus:report-templates:${userId || 'anon'}`;

const readTemplates = (userId?: string): ReportTemplate[] => {
  try {
    const raw = localStorage.getItem(templatesKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const useAdvancedReports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>(() => readTemplates(user?.id));

  useEffect(() => {
    setTemplates(readTemplates(user?.id));
  }, [user?.id]);

  const persistTemplates = useCallback((next: ReportTemplate[]) => {
    setTemplates(next);
    try {
      localStorage.setItem(templatesKey(user?.id), JSON.stringify(next));
    } catch (error) {
      logger.error('Não foi possível salvar os templates de relatório:', error);
      throw new Error('Não foi possível salvar o template neste navegador.');
    }
  }, [user?.id]);

  const generateReport = useCallback(async (config: ReportConfig) => {
    const [{ data: properties, error: propertiesError }, transactions] = await Promise.all([
      supabase
        .from('properties')
        .select('id, title, status, type, value, rental_value, purchase_value, total_investment, city, neighborhood')
        .order('title', { ascending: true }),
      fetchTransactions(config.dateRange),
    ]);

    if (propertiesError) throw propertiesError;

    const totals = new Map<string, { revenue: number; expenses: number }>();
    transactions.forEach((transaction) => {
      if (!transaction.property_id) return;
      const entry = totals.get(transaction.property_id) || { revenue: 0, expenses: 0 };
      if (transaction.transaction_type === 'income') entry.revenue += Number(transaction.amount || 0);
      else entry.expenses += Number(transaction.amount || 0);
      totals.set(transaction.property_id, entry);
    });

    const rows: ReportRow[] = (properties || []).map((property) => {
      const { revenue, expenses } = totals.get(property.id) || { revenue: 0, expenses: 0 };
      const net = revenue - expenses;
      // ROI sobre o capital: custo de aquisição/investimento, ou valor de mercado na falta dele
      const capital = Number(property.purchase_value || property.total_investment || property.value || 0);
      return {
        property: property.title,
        status: STATUS_LABELS[property.status] || property.status,
        type: TYPE_LABELS[property.type] || property.type,
        value: Number(property.value || 0),
        rental_value: property.rental_value ? Number(property.rental_value) : null,
        revenue,
        expenses,
        net,
        roi: capital > 0 ? (net / capital) * 100 : 0,
        city: property.city,
        neighborhood: property.neighborhood,
      };
    });

    setReportData(rows);
    return rows;
  }, []);

  const exportReport = useCallback((format: 'pdf' | 'excel', config: ReportConfig) => {
    if (reportData.length === 0) throw new Error('Gere o relatório antes de exportar.');
    const name = config.name.trim() || 'Relatório Domus';
    const period = config.dateRange.start || config.dateRange.end
      ? `Período: ${config.dateRange.start ? new Date(`${config.dateRange.start}T00:00:00`).toLocaleDateString('pt-BR') : 'início'} a ${config.dateRange.end ? new Date(`${config.dateRange.end}T00:00:00`).toLocaleDateString('pt-BR') : 'hoje'}`
      : 'Todo o período';

    if (format === 'excel') exportCsv(reportData, config.fields, name);
    else exportPdf(reportData, config.fields, name, period);
  }, [reportData]);

  const saveTemplate = useCallback((name: string, fields: string[]) => {
    const trimmed = name.trim();
    const existing = templates.find((template) => template.name.toLowerCase() === trimmed.toLowerCase());
    const template: ReportTemplate = {
      id: existing?.id || `${Date.now()}`,
      name: trimmed,
      fields,
      createdAt: new Date().toISOString(),
    };
    persistTemplates([template, ...templates.filter((item) => item.id !== template.id)]);
    return template;
  }, [persistTemplates, templates]);

  const deleteTemplate = useCallback((id: string) => {
    persistTemplates(templates.filter((template) => template.id !== id));
  }, [persistTemplates, templates]);

  return {
    templates,
    reportData,
    isLoadingTemplates: false,
    generateReport,
    exportReport,
    saveTemplate,
    deleteTemplate,
  };
};
