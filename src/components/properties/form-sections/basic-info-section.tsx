
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home } from 'lucide-react';
import { PropertyFormData, PropertyStatus, PropertyType } from '@/types/property';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'land', label: 'Terreno' },
  { value: 'rural', label: 'Rural' },
];

const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'sold', label: 'Vendido' },
];

interface BasicInfoSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
}

export function BasicInfoSection({ formData, onInputChange }: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Informações Básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              placeholder="Ex: Apartamento 2 quartos no Centro"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type">Tipo de Imóvel</Label>
            <Select value={formData.type} onValueChange={(value: PropertyType) => onInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: PropertyStatus) => onInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Descreva as características do imóvel..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
