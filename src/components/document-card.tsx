
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  id: string;
  title: string;
  type: string;
  date: string;
  property?: string;
  fileSize: string;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function DocumentCard({
  id,
  title,
  type,
  date,
  property,
  fileSize,
  onView,
  onDownload,
}: DocumentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const getDocumentIcon = () => {
    const iconClasses = "h-8 w-8 text-petroleum";
    return <FileText className={iconClasses} />;
  };

  const getDocumentColor = () => {
    switch (type) {
      case "Escritura":
        return "bg-blue-500/10 text-blue-500";
      case "IPTU":
        return "bg-amber-500/10 text-amber-500";
      case "Contrato":
        return "bg-emerald-500/10 text-emerald-500";
      default:
        return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="p-2 rounded-md bg-muted">
              {getDocumentIcon()}
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline" className={cn(getDocumentColor())}>
            {type}
          </Badge>
          <span className="text-xs text-muted-foreground">{fileSize}</span>
        </div>
        
        {property && (
          <div className="text-xs text-muted-foreground mb-4">
            Imóvel: <span className="font-medium">{property}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView && onView(id)}
          >
            <Eye className="mr-2 h-4 w-4" /> Visualizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onDownload && onDownload(id)}
          >
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
