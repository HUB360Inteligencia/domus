import { useCallback, useState } from "react";

import { Document } from "@/types/contract";
import { DocumentViewerDialog, DocumentViewerMode } from "./document-viewer-dialog";

/** Controla o diálogo de visualização/download de documentos. Renderize `viewerDialog` na página. */
export function useDocumentViewer() {
  const [target, setTarget] = useState<{ document: Document; mode: DocumentViewerMode } | null>(null);

  const viewDocument = useCallback((document: Document) => setTarget({ document, mode: "view" }), []);
  const downloadDocument = useCallback((document: Document) => setTarget({ document, mode: "download" }), []);
  const close = useCallback(() => setTarget(null), []);

  const viewerDialog = (
    <DocumentViewerDialog document={target?.document ?? null} mode={target?.mode ?? "view"} onClose={close} />
  );

  return { viewDocument, downloadDocument, viewerDialog };
}
