
import { Client } from "@/api/clients";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Edit, User, Mail, Phone, FileText } from "lucide-react";

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="truncate">{client.name}</CardTitle>
          <Badge variant={client.is_active ? "default" : "outline"}>
            {client.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center text-sm">
              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.document_number && (
            <div className="flex items-center text-sm">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Documento: {client.document_number}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => navigate(`/clients/${client.id}`)}>
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
