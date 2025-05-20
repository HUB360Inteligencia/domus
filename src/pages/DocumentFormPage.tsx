
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { useContracts } from "@/hooks/use-contracts";
import { DocumentFormData } from "@/types/contract";

export default function DocumentFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const contractId = queryParams.get("contract_id");
  
  const { contracts, uploadDocument, isLoadingContracts } = useContracts();

  const [formData, setFormData] = useState<DocumentFormData>({
    name: "",
    file: null,
    category: "geral",
    contract_id: contractId || undefined,
    is_encrypted: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Document categories
  const documentCategories = [
    { value: "geral", label: "Geral" },
    { value: "contrato", label: "Contrato" },
    { value: "identificacao", label: "Identificação" },
    { value: "financeiro", label: "Financeiro" },
    { value: "juridico", label: "Jurídico" },
    { value: "imovel", label: "Imóvel" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setFileError("O arquivo deve ter no máximo 10MB");
        return;
      }
      
      setFileError(null);
      setFormData({
        ...formData,
        file,
        name: formData.name || file.name // Use file name as default document name if empty
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData({ ...formData, [field]: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      setFileError("Por favor, selecione um arquivo");
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error("Por favor, informe um nome para o documento");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await uploadDocument(formData);
      
      // Redirect back to documents page or contract detail page if from there
      if (contractId) {
        navigate(`/contracts/detail?id=${contractId}`);
      } else {
        navigate("/documents");
      }
      
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Erro ao enviar documento. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Documento"
        description="Faça upload de um novo documento para seu acervo."
      />

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>
              Preencha os dados do documento e faça o upload do arquivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Documento</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Contrato de Aluguel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {documentCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {contractId === null && contracts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="contract_id">Contrato Relacionado (Opcional)</Label>
                <Select
                  value={formData.contract_id || ""}
                  onValueChange={(value) => handleSelectChange("contract_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum contrato</SelectItem>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  id="encryption"
                  checked={formData.is_encrypted}
                  onCheckedChange={(checked) => handleSwitchChange("is_encrypted", checked)}
                />
                <Label htmlFor="encryption">Criptografar Documento</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                A criptografia adiciona uma camada extra de segurança aos seus documentos sensíveis.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                <Input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium">
                    {formData.file
                      ? `Arquivo selecionado: ${formData.file.name}`
                      : "Clique para selecionar um arquivo ou arraste e solte aqui"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta arquivos PDF, DOCX, XLSX, JPG, PNG (até 10MB)
                  </p>
                </label>
              </div>
              {fileError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(contractId ? `/contracts/detail?id=${contractId}` : "/documents")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.file}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Enviando..." : "Enviar Documento"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
