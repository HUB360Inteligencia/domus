
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DocumentsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Documentos"
          description="Gerencie seus documentos"
        />
        <Button className="flex items-center gap-2" onClick={() => navigate("/documents/new")}>
          <Plus className="h-4 w-4" /> Novo Documento
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground py-8">
            Lista de documentos será implementada em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
