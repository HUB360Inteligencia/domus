
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FileText } from 'lucide-react';
import { applyDateMask, isValidDateFormat, convertToISO } from '@/utils/masks';

export interface PropertyDocument {
  id: string;
  type: string;
  name: string;
  date: string;
  file?: File;
}

interface PropertyDocumentsProps {
  documents: PropertyDocument[];
  onChange: (documents: PropertyDocument[]) => void;
}

const documentTypes = [
  { value: 'contract', label: 'Contrato' },
  { value: 'deed', label: 'Escritura' },
  { value: 'blueprint', label: 'Planta/Projeto' },
  { value: 'receipt', label: 'Recibo' },
  { value: 'invoice', label: 'Nota Fiscal' },
  { value: 'certificate', label: 'Certidão' },
  { value: 'permit', label: 'Alvará' },
  { value: 'iptu', label: 'IPTU' },
  { value: 'registration', label: 'Matrícula' },
  { value: 'appraisal', label: 'Avaliação' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'other', label: 'Outros' }
];

export const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({
  documents,
  onChange
}) => {
  const [newDocument, setNewDocument] = useState<Omit<PropertyDocument, 'id'>>({
    type: '',
    name: '',
    date: '',
    file: undefined
  });

  const addDocument = () => {
    if (!newDocument.type || !newDocument.name || !newDocument.date) {
      return;
    }

    if (!isValidDateFormat(newDocument.date)) {
      return;
    }

    const document: PropertyDocument = {
      id: Math.random().toString(36).substring(2, 15),
      ...newDocument,
      date: convertToISO(newDocument.date)
    };

    onChange([...documents, document]);
    setNewDocument({
      type: '',
      name: '',
      date: '',
      file: undefined
    });
  };

  const removeDocument = (id: string) => {
    onChange(documents.filter(doc => doc.id !== id));
  };

  const handleDateChange = (value: string) => {
    const maskedValue = applyDateMask(value);
    setNewDocument(prev => ({
      ...prev,
      date: maskedValue
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setNewDocument(prev => ({
      ...prev,
      file: file || undefined
    }));
  };

  return (
    <div className="space-y-4">
      {/* Lista de documentos existentes */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-medium">Documentos Cadastrados</Label>
          {documents.map((document) => (
            <Card key={document.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {documentTypes.find(t => t.value === document.type)?.label}
                    </span>
                    <span className="text-muted-foreground">{document.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(document.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para novo documento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="document-type">Tipo de Documento</Label>
              <Select
                value={newDocument.type}
                onValueChange={(value) => setNewDocument(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document-name">Nome do Documento</Label>
              <Input
                id="document-name"
                placeholder="Nome ou descrição"
                value={newDocument.name}
                onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="document-date">Data do Documento</Label>
              <Input
                id="document-date"
                placeholder="dd/mm/aaaa"
                value={newDocument.date}
                onChange={(e) => handleDateChange(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="document-file">Arquivo (opcional)</Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
            </p>
          </div>

          <Button
            type="button"
            onClick={addDocument}
            disabled={!newDocument.type || !newDocument.name || !newDocument.date || !isValidDateFormat(newDocument.date)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Documento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
