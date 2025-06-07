
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, X } from 'lucide-react';
import { Property, PropertyFormData } from '@/types/property';

interface PropertyBaseSelectorProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onPropertySelect: (propertyId: string) => void;
  onCopyProperty: (property: Property) => void;
  onClear: () => void;
}

export function PropertyBaseSelector({
  properties,
  selectedPropertyId,
  onPropertySelect,
  onCopyProperty,
  onClear
}: PropertyBaseSelectorProps) {
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const handleCopyClick = () => {
    if (selectedProperty) {
      onCopyProperty(selectedProperty);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-blue-800">
          Criar com base em imóvel existente
        </Label>
        {selectedPropertyId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Select value={selectedPropertyId || ''} onValueChange={onPropertySelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um imóvel para copiar" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.title} - {property.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedProperty && (
          <Button
            type="button"
            onClick={handleCopyClick}
            size="sm"
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            Copiar
          </Button>
        )}
      </div>
      
      {selectedProperty && (
        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
          <strong>Selecionado:</strong> {selectedProperty.title} - {selectedProperty.address}, {selectedProperty.city}
        </div>
      )}
    </div>
  );
}
