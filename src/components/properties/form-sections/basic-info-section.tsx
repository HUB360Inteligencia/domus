
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home } from 'lucide-react';
import { PropertyFormData, PropertyStatus, PropertyType } from '@/types/property';
import { useDevelopments } from '@/hooks/use-developments';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'land', label: 'Terreno' },
  { value: 'rural', label: 'Rural' },
];

const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'reserved', label: 'Reservado' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'sold', label: 'Vendido' },
];

interface BasicInfoSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: PropertyFormData[keyof PropertyFormData]) => void;
}

export function BasicInfoSection({ formData, onInputChange }: BasicInfoSectionProps) {
  const { data: developments = [] } = useDevelopments();
  // Quadra só faz sentido para lote de loteamento.
  const showBlock = !!formData.development_id && formData.type === 'land';

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
            <Label htmlFor="development_id">Loteamento / Empreendimento</Label>
            <Select
              value={formData.development_id || 'none'}
              onValueChange={(value) =>
                onInputChange('development_id', value === 'none' ? null : value)
              }
            >
              <SelectTrigger id="development_id">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {developments.map((development) => (
                  <SelectItem key={development.id} value={development.id}>
                    {development.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showBlock && (
            <div>
              <Label htmlFor="block">Quadra</Label>
              <Input
                id="block"
                value={formData.block || ''}
                onChange={(e) => onInputChange('block', e.target.value || null)}
                placeholder="Ex: A"
              />
            </div>
          )}
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
