import { FileArchive, FileImage, FileSpreadsheet, FileText, FileType2, type LucideIcon } from "lucide-react";

export const DOCUMENT_CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "contrato", label: "Contrato" },
  { value: "identificacao", label: "Identificação" },
  { value: "financeiro", label: "Financeiro" },
  { value: "juridico", label: "Jurídico" },
  { value: "imovel", label: "Imóvel" },
] as const;

// Valores antigos gravados por fluxos legados
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  contract: "Contrato",
  general: "Geral",
  financial: "Financeiro",
  legal: "Jurídico",
  property: "Imóvel",
};

export const getDocumentCategoryLabel = (category?: string | null): string => {
  if (!category) return "Geral";
  const match = DOCUMENT_CATEGORIES.find((item) => item.value === category);
  return match?.label || LEGACY_CATEGORY_LABELS[category] || category;
};

/** Normaliza categorias legadas para o valor atual (ex.: "contract" → "contrato"). */
export const normalizeDocumentCategory = (category?: string | null): string => {
  if (!category) return "geral";
  const legacy = LEGACY_CATEGORY_LABELS[category];
  if (!legacy) return category;
  return DOCUMENT_CATEGORIES.find((item) => item.label === legacy)?.value || category;
};

export const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.odt,.ods,.jpg,.jpeg,.png,.webp,.heic,.zip";

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: exponent > 1 ? 1 : 0 })} ${units[exponent]}`;
};

export type DocumentKind = "pdf" | "image" | "sheet" | "text" | "archive" | "other";

export const getDocumentKind = (mimeType?: string | null, fileName?: string | null): DocumentKind => {
  const type = (mimeType || "").toLowerCase();
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";

  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (type.includes("sheet") || type.includes("excel") || ["xls", "xlsx", "ods", "csv"].includes(ext)) return "sheet";
  if (type.startsWith("text/") || type.includes("word") || ["doc", "docx", "odt", "txt"].includes(ext)) return "text";
  if (type.includes("zip") || ["zip", "rar", "7z"].includes(ext)) return "archive";
  return "other";
};

export const DOCUMENT_KIND_STYLES: Record<DocumentKind, { icon: LucideIcon; label: string; className: string }> = {
  pdf: { icon: FileText, label: "PDF", className: "bg-[#9f5d4c]/12 text-[#9f5d4c] dark:bg-[#9f5d4c]/25 dark:text-[#e4a494]" },
  image: { icon: FileImage, label: "Imagem", className: "bg-[#4f6f85]/12 text-[#4f6f85] dark:bg-[#4f6f85]/30 dark:text-[#a9c5d8]" },
  sheet: { icon: FileSpreadsheet, label: "Planilha", className: "bg-[#6f8f74]/14 text-[#4b6b50] dark:bg-[#6f8f74]/30 dark:text-[#b5d1b9]" },
  text: { icon: FileType2, label: "Documento", className: "bg-[#c4934f]/14 text-[#8a6330] dark:bg-[#c4934f]/25 dark:text-[#e6c38f]" },
  archive: { icon: FileArchive, label: "Arquivo", className: "bg-muted text-muted-foreground" },
  other: { icon: FileText, label: "Arquivo", className: "bg-muted text-muted-foreground" },
};

/** Tipos que o navegador consegue exibir dentro do visualizador. */
export const canPreviewDocument = (mimeType?: string | null, fileName?: string | null) => {
  const kind = getDocumentKind(mimeType, fileName);
  const type = (mimeType || "").toLowerCase();
  return kind === "pdf" || (kind === "image" && !type.includes("heic")) || type === "text/plain" || type === "text/csv";
};

export const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};
