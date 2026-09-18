import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileBox, HardDrive, Loader2, Lock, Plus, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useContracts } from "@/hooks/use-contracts";
import { DocumentCard } from "@/components/document-card";
import { useDocumentViewer } from "@/components/documents/use-document-viewer";
import {
  DOCUMENT_CATEGORIES,
  formatFileSize,
  getDocumentCategoryLabel,
  normalizeDocumentCategory,
} from "@/components/documents/document-utils";
import { Document } from "@/types/contract";

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const { documents, contracts, isLoadingDocuments, deleteDocument } = useContracts();
  const { viewDocument, downloadDocument, viewerDialog } = useDocumentViewer();

  const contractTitles = useMemo(
    () => new Map(contracts.map((contract) => [contract.id, contract.title])),
    [contracts]
  );

  const categoryOptions = useMemo<{ value: string; label: string }[]>(() => {
    const used = new Set(documents.map((doc) => normalizeDocumentCategory(doc.category)));
    const known = DOCUMENT_CATEGORIES.filter((item) => used.has(item.value)).map(({ value, label }) => ({ value, label }));
    const custom = [...used]
      .filter((value) => !DOCUMENT_CATEGORIES.some((item) => item.value === value))
      .map((value) => ({ value, label: getDocumentCategoryLabel(value) }));
    return [...known, ...custom];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const term = normalizeText(searchTerm.trim());
    return documents.filter((doc) => {
      if (category !== "all" && normalizeDocumentCategory(doc.category) !== category) return false;
      if (!term) return true;
      const contractTitle = doc.contract_id ? contractTitles.get(doc.contract_id) || "" : "";
      return normalizeText(`${doc.name} ${contractTitle} ${getDocumentCategoryLabel(doc.category)}`).includes(term);
    });
  }, [documents, category, searchTerm, contractTitles]);

  const totalSize = useMemo(() => documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0), [documents]);
  const encryptedCount = useMemo(() => documents.filter((doc) => doc.is_encrypted).length, [documents]);

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    // Os toasts de sucesso/erro vêm da mutation (use-contract-mutations)
    await deleteDocument(documentToDelete);
  };

  const hasFilters = category !== "all" || searchTerm.trim().length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Contratos, comprovantes e arquivos do seu patrimônio em um só lugar."
        className="pb-0"
      >
        <Button onClick={() => navigate("/documents/new")}>
          <Plus className="h-4 w-4" />
          Novo documento
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: FileBox, label: "Documentos", value: String(documents.length) },
          { icon: HardDrive, label: "Espaço utilizado", value: formatFileSize(totalSize) },
          { icon: Lock, label: "Criptografados", value: String(encryptedCount) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="premium-panel dark:premium-panel-dark flex items-center gap-3 rounded-[1.75rem] p-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou contrato..."
            className="w-full bg-background pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categoryOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setCategory("all");
              setSearchTerm("");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {isLoadingDocuments ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              contractTitle={document.contract_id ? contractTitles.get(document.contract_id) : null}
              onView={viewDocument}
              onDownload={downloadDocument}
              onDelete={setDocumentToDelete}
            />
          ))}
        </div>
      ) : (
        <div className="premium-panel dark:premium-panel-dark flex flex-col items-center justify-center rounded-[2rem] px-6 py-14 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-primary/10 text-primary dark:bg-white/10">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">
            {hasFilters ? "Nenhum documento corresponde aos filtros" : "Nenhum documento enviado ainda"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {hasFilters
              ? "Ajuste a busca ou a categoria para encontrar o que procura."
              : "Envie contratos, escrituras, comprovantes e outros arquivos para tê-los sempre à mão."}
          </p>
          {!hasFilters && (
            <Button className="mt-5" onClick={() => navigate("/documents/new")}>
              <Plus className="h-4 w-4" />
              Enviar primeiro documento
            </Button>
          )}
        </div>
      )}

      {viewerDialog}

      <ConfirmDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        title="Excluir documento?"
        description={
          documentToDelete ? (
            <>
              O arquivo <strong>{documentToDelete.name}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </>
          ) : undefined
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
