import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DocumentCard } from "@/components/document-card";
import { fetchContractDocuments } from "@/api/documents";
import { useContractMutations } from "@/hooks/use-contract-mutations";
import { Document } from "@/types/contract";
import { useDocumentViewer } from "./use-document-viewer";

interface ContractDocumentsSectionProps {
  contractId: string;
}

export function ContractDocumentsSection({ contractId }: ContractDocumentsSectionProps) {
  const navigate = useNavigate();
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const { deleteDocument } = useContractMutations();
  const { viewDocument, downloadDocument, viewerDialog } = useDocumentViewer();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["contractDocuments", contractId],
    queryFn: () => fetchContractDocuments(contractId),
    enabled: !!contractId,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5" />
          Documentos do contrato
        </CardTitle>
        <Button size="sm" onClick={() => navigate(`/documents/new?contract_id=${contractId}`)}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum documento vinculado. Anexe o contrato assinado, vistorias e comprovantes para mantê-los junto da locação.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onView={viewDocument}
                onDownload={downloadDocument}
                onDelete={setDocumentToDelete}
              />
            ))}
          </div>
        )}
      </CardContent>

      {viewerDialog}

      <ConfirmDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        title="Excluir documento?"
        description={documentToDelete ? `"${documentToDelete.name}" será removido permanentemente.` : undefined}
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (documentToDelete) await deleteDocument(documentToDelete);
        }}
      />
    </Card>
  );
}
