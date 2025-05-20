
import { DocumentText, Download, Eye, Lock, LockOpen, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Document } from "@/types/contract";

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

export function DocumentCard({
  document,
  onView,
  onDownload,
  onDelete,
}: DocumentCardProps) {
  // Format file size to readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get file extension
  const getFileExtension = (name: string): string => {
    return name.split('.').pop()?.toUpperCase() || '';
  };

  // File type badge color
  const getFileBadgeColor = (type: string): string => {
    const fileTypes: Record<string, string> = {
      'application/pdf': 'bg-red-100 text-red-800',
      'image/jpeg': 'bg-blue-100 text-blue-800',
      'image/png': 'bg-green-100 text-green-800',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bg-indigo-100 text-indigo-800',
      'application/msword': 'bg-indigo-100 text-indigo-800',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'bg-emerald-100 text-emerald-800',
      'application/vnd.ms-excel': 'bg-emerald-100 text-emerald-800',
      'text/plain': 'bg-gray-100 text-gray-800',
      'application/encrypted': 'bg-purple-100 text-purple-800',
    };

    return fileTypes[type] || 'bg-gray-100 text-gray-800';
  };

  // Format the creation date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-start gap-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <DocumentText className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {document.name}
                </h3>
                {document.is_encrypted && (
                  <Lock className="h-4 w-4 text-purple-500 ml-2 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center mt-1 gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getFileBadgeColor(document.file_type))}
                >
                  {getFileExtension(document.name)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Adicionado em {formatDate(document.created_at)}
              </p>
            </div>
          </div>
          <div className="border-t p-2 flex justify-end gap-1">
            {onView && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onView(document)}
                title="Visualizar"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDownload(document)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(document)}
                className="text-red-500 hover:text-red-600"
                title="Excluir"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
