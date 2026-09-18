import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentPasswordError, getDocumentBlob, getDocumentDownloadName } from "@/api/documents";
import { Document } from "@/types/contract";
import { canPreviewDocument, formatFileSize, getDocumentKind, triggerBlobDownload } from "./document-utils";

export type DocumentViewerMode = "view" | "download";

interface DocumentViewerDialogProps {
  document: Document | null;
  mode: DocumentViewerMode;
  onClose: () => void;
}

export function DocumentViewerDialog({ document: doc, mode, onClose }: DocumentViewerDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const open = Boolean(doc);
  const needsPassword = Boolean(doc?.is_encrypted) && !blob;
  const previewable = doc ? canPreviewDocument(doc.file_type, doc.name) : false;

  const reset = useCallback(() => {
    requestRef.current += 1;
    setPassword("");
    setShowPassword(false);
    setBlob(null);
    setTextContent(null);
    setError(null);
    setIsLoading(false);
    setObjectUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const load = useCallback(async (target: Document, secret?: string) => {
    const requestId = ++requestRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const content = await getDocumentBlob(target, secret);
      if (requestId !== requestRef.current) return;

      if (mode === "download") {
        triggerBlobDownload(content, getDocumentDownloadName(target));
        toast.success("Download iniciado");
        onCloseRef.current();
        return;
      }

      setBlob(content);
      if (content.type.startsWith("text/")) {
        setTextContent(await content.text());
      } else {
        setObjectUrl(URL.createObjectURL(content));
      }
    } catch (err) {
      if (requestId !== requestRef.current) return;
      const message = err instanceof Error ? err.message : "Não foi possível abrir o documento.";
      setError(message);
      if (!(err instanceof DocumentPasswordError)) {
        toast.error(message);
      }
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    reset();
    if (doc && !doc.is_encrypted) {
      void load(doc);
    }
  }, [doc, load, reset]);

  useEffect(() => () => {
    requestRef.current += 1;
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      onClose();
    }
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!doc || !password) return;
    void load(doc, password);
  };

  const handleDownload = () => {
    if (!doc || !blob) return;
    triggerBlobDownload(blob, getDocumentDownloadName(doc));
  };

  const kind = doc ? getDocumentKind(doc.file_type, doc.name) : "other";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={mode === "view" && !needsPassword && previewable ? "max-w-5xl" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            {doc?.is_encrypted && <Lock className="h-4 w-4 shrink-0 text-accent" />}
            <span className="truncate">{doc?.name}</span>
          </DialogTitle>
          <DialogDescription>
            {needsPassword
              ? "Este documento foi criptografado. Informe a senha definida no envio."
              : doc
                ? `${formatFileSize(doc.file_size)}${mode === "download" ? " · preparando download" : ""}`
                : ""}
          </DialogDescription>
        </DialogHeader>

        {needsPassword ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-password">Senha do documento</Label>
              <div className="relative">
                <Input
                  id="document-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoFocus
                  autoComplete="off"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!password || isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "download" ? "Baixar" : "Abrir"}
              </Button>
            </DialogFooter>
          </form>
        ) : isLoading || (!blob && !error) ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm">{mode === "download" ? "Preparando download..." : "Carregando documento..."}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed p-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {kind === "pdf" && objectUrl ? (
              <iframe
                src={objectUrl}
                title={doc?.name}
                className="h-[70vh] w-full rounded-2xl border bg-muted"
              />
            ) : kind === "image" && objectUrl && previewable ? (
              <div className="flex max-h-[70vh] justify-center overflow-auto rounded-2xl bg-muted/60 p-2">
                <img src={objectUrl} alt={doc?.name} className="max-h-[68vh] w-auto rounded-xl object-contain" />
              </div>
            ) : textContent !== null ? (
              <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-muted p-4 text-xs">
                {textContent}
              </pre>
            ) : (
              <div className="rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                A pré-visualização não está disponível para este tipo de arquivo. Faça o download para abri-lo.
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
