
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Clientes"
          description="Gerencie seus clientes"
        />
        <Button className="flex items-center gap-2" onClick={() => navigate("/clients/new")}>
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground py-8">
            Lista de clientes será implementada em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
