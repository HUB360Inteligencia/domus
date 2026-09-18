import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, FileCheck2, Loader2, Lock, Upload, X } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { useContracts } from "@/hooks/use-contracts";
import { MAX_DOCUMENT_SIZE_BYTES } from "@/api/documents";
import {
  ACCEPTED_DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_KIND_STYLES,
  formatFileSize,
  getDocumentKind,
} from "@/components/documents/document-utils";
import { cn } from "@/lib/utils";
import { DocumentFormData } from "@/types/contract";

const MIN_PASSWORD_LENGTH = 6;
const stripExtension = (fileName: string) => fileName.replace(/\.[^.]+$/, "");

export default function DocumentFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const contractIdFromUrl = new URLSearchParams(location.search).get("contract_id");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { contracts, uploadDocument } = useContracts();

  const [formData, setFormData] = useState<DocumentFormData>({
    name: "",
    file: null,
    category: contractIdFromUrl ? "contrato" : "geral",
    contract_id: contractIdFromUrl || undefined,
    is_encrypted: false,
    password: "",
  });
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const returnPath = contractIdFromUrl ? `/contracts/${contractIdFromUrl}` : "/documents";
  const sortedContracts = useMemo(
    () => [...contracts].sort((a, b) => a.title.localeCompare(b.title, "pt-BR")),
    [contracts]
  );

  const selectFile = (file: File | null | undefined) => {
    if (!file) return;

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setFileError(`O arquivo deve ter no máximo ${formatFileSize(MAX_DOCUMENT_SIZE_BYTES)}.`);
      return;
    }
    if (file.size === 0) {
      setFileError("O arquivo selecionado está vazio.");
      return;
    }

    setFileError(null);
    setFormData((previous) => ({
      ...previous,
      file,
      name: previous.name.trim() ? previous.name : stripExtension(file.name),
    }));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const passwordError = (() => {
    if (!formData.is_encrypted) return null;
    if ((formData.password || "").length < MIN_PASSWORD_LENGTH) {
      return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (passwordConfirmation && passwordConfirmation !== formData.password) {
      return "As senhas não conferem.";
    }
    return null;
  })();

  const canSubmit =
    !!formData.file &&
    formData.name.trim().length > 0 &&
    !isSubmitting &&
    (!formData.is_encrypted || (!passwordError && passwordConfirmation === formData.password));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.file) {
      setFileError("Selecione um arquivo para enviar.");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Informe um nome para o documento.");
      return;
    }
    if (formData.is_encrypted && (passwordError || passwordConfirmation !== formData.password)) {
      toast.error(passwordError || "Confirme a senha do documento.");
      return;
    }

    try {
      setIsSubmitting(true);
      await uploadDocument({
        ...formData,
        password: formData.is_encrypted ? formData.password : undefined,
      });
      const destination = formData.contract_id ? `/contracts/${formData.contract_id}` : "/documents";
      navigate(contractIdFromUrl ? returnPath : destination);
    } catch (error) {
      // O toast de erro é exibido pela mutation (use-contract-mutations)
      console.error("Error uploading document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedKind = formData.file ? getDocumentKind(formData.file.type, formData.file.name) : null;
  const SelectedIcon = selectedKind ? DOCUMENT_KIND_STYLES[selectedKind].icon : FileCheck2;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(returnPath)} className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        {contractIdFromUrl ? "Voltar ao contrato" : "Voltar aos documentos"}
      </Button>

      <PageHeader
        title="Novo documento"
        description="Envie um arquivo e, se quiser, vincule-o a um contrato de locação."
        className="mb-0"
      />

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl">Arquivo</CardTitle>
            <CardDescription>PDF, imagens, planilhas e documentos de texto de até {formatFileSize(MAX_DOCUMENT_SIZE_BYTES)}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <input
              ref={fileInputRef}
              id="file"
              type="file"
              accept={ACCEPTED_DOCUMENT_TYPES}
              className="hidden"
              onChange={(event) => {
                selectFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            {formData.file ? (
              <div className="flex items-center gap-3 rounded-3xl border bg-muted/40 p-4">
                <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", DOCUMENT_KIND_STYLES[selectedKind || "other"].className)}>
                  <SelectedIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{formData.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(formData.file.size)}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Trocar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover arquivo"
                  onClick={() => setFormData((previous) => ({ ...previous, file: null }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/60 hover:bg-muted/40"
                )}
              >
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary dark:bg-white/10">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">
                  {isDragging ? "Solte o arquivo aqui" : "Clique para selecionar ou arraste um arquivo"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, XLSX, JPG, PNG e outros</p>
              </div>
            )}

            {fileError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome do documento</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Ex.: Contrato de locação — Apto 302"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((previous) => ({ ...previous, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contrato relacionado (opcional)</Label>
                <Select
                  value={formData.contract_id || "none"}
                  onValueChange={(value) =>
                    setFormData((previous) => ({ ...previous, contract_id: value === "none" ? undefined : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum contrato</SelectItem>
                    {sortedContracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="encryption" className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4 text-accent" />
                    Proteger com senha
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    O arquivo é criptografado no seu navegador antes do envio. Só quem souber a senha consegue abri-lo.
                  </p>
                </div>
                <Switch
                  id="encryption"
                  checked={!!formData.is_encrypted}
                  onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, is_encrypted: checked }))}
                />
              </div>

              {formData.is_encrypted && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="doc-password">Senha</Label>
                      <Input
                        id="doc-password"
                        type="password"
                        autoComplete="new-password"
                        value={formData.password || ""}
                        onChange={(event) => setFormData((previous) => ({ ...previous, password: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doc-password-confirm">Confirmar senha</Label>
                      <Input
                        id="doc-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        value={passwordConfirmation}
                        onChange={(event) => setPasswordConfirmation(event.target.value)}
                      />
                    </div>
                  </div>
                  {passwordError && (formData.password || passwordConfirmation) && (
                    <p className="text-xs text-destructive">{passwordError}</p>
                  )}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Guarde esta senha: ela não fica salva no sistema e, sem ela, não é possível recuperar o arquivo.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(returnPath)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isSubmitting ? "Enviando..." : "Enviar documento"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
