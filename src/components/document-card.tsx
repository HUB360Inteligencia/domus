import { Download, Eye, FileSignature, Lock, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/dates";
import { Document } from "@/types/contract";
import {
  DOCUMENT_KIND_STYLES,
  formatFileSize,
  getDocumentCategoryLabel,
  getDocumentKind,
} from "@/components/documents/document-utils";

interface DocumentCardProps {
  document: Document;
  contractTitle?: string | null;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  className?: string;
}

export function DocumentCard({
  document,
  contractTitle,
  onView,
  onDownload,
  onDelete,
  className,
}: DocumentCardProps) {
  const kind = getDocumentKind(document.file_type, document.name);
  const { icon: KindIcon, label: kindLabel, className: kindClassName } = DOCUMENT_KIND_STYLES[kind];

  return (
    <div
      className={cn(
        "group flex h-full flex-col rounded-[1.75rem] border border-white/70 bg-card/95 p-4 shadow-[0_20px_60px_-46px_rgba(31,27,24,0.8)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_70px_-44px_rgba(31,27,24,0.85)] dark:border-white/10 dark:bg-card/90",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onView?.(document)}
        disabled={!onView}
        className="flex min-w-0 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-2xl"
      >
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", kindClassName)}>
          <KindIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="line-clamp-2 break-words text-sm font-semibold leading-snug text-foreground" title={document.name}>
              {document.name}
            </h3>
            {document.is_encrypted && (
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-label="Criptografado" />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {kindLabel} · {formatFileSize(document.file_size)} · {formatDateBR(document.created_at)}
          </p>
        </div>
      </button>

      <div className="mb-4 mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {getDocumentCategoryLabel(document.category)}
        </span>
        {document.contract_id && (
          <Link
            to={`/contracts/${document.contract_id}`}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] font-medium text-accent-foreground/80 hover:bg-accent/20 dark:text-accent"
            title={contractTitle || "Ver contrato"}
          >
            <FileSignature className="h-3 w-3 shrink-0" />
            <span className="truncate">{contractTitle || "Contrato"}</span>
          </Link>
        )}
      </div>

      <div className="mt-auto flex justify-end gap-1 border-t border-border/60 pt-3">
        {onView && (
          <Button variant="ghost" size="sm" onClick={() => onView(document)} aria-label="Visualizar documento">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Abrir</span>
          </Button>
        )}
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={() => onDownload(document)} aria-label="Baixar documento">
            <Download className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(document)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Excluir documento"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
