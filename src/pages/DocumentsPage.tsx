
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { useContracts } from "@/hooks/use-contracts";
import { DocumentCard } from "@/components/document-card";
import { toast } from "sonner";

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string>("all");
  const { documents, isLoadingDocuments, deleteDocument } = useContracts();

  // Filter documents by category and search term
  const filteredDocuments = documents.filter(doc => 
    (category === "all" || doc.category === category) && 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique categories
  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  const handleViewDocument = (documentId: string) => {
    window.open(`/documents/view?id=${documentId}`, '_blank');
  };

  const handleDownloadDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  const handleDeleteDocument = async (documentId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.");
    
    if (confirmed) {
      try {
        await deleteDocument(documentId);
        toast.success("Documento excluído com sucesso");
      } catch (error) {
        toast.error("Erro ao excluir documento");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gerencie todos os seus documentos em um só lugar."
        className="pb-4"
      >
        <Button onClick={() => navigate("/documents/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Documento
        </Button>
      </PageHeader>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar documentos..."
            className="pl-8 w-full bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select
            value={category}
            onValueChange={setCategory}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDocuments ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onView={() => handleViewDocument(document.id)}
                  onDownload={() => handleDownloadDocument(document.file_path)}
                  onDelete={() => handleDeleteDocument(document.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">Nenhum documento encontrado.</p>
              <Button variant="outline" onClick={() => navigate("/documents/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Documento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
