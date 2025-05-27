
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench } from 'lucide-react';
import { PropertyFormData, FurnishedStatus } from '@/types/property';

const FURNISHED_OPTIONS: { value: FurnishedStatus; label: string }[] = [
  { value: 'not_furnished', label: 'Não Mobiliado' },
  { value: 'partially_furnished', label: 'Semi-Mobiliado' },
  { value: 'fully_furnished', label: 'Mobiliado' },
];

const PROPERTY_FEATURES = [
  'Piscina', 'Academia', 'Churrasqueira', 'Jardim', 'Varanda', 'Sacada',
  'Ar Condicionado', 'Aquecedor', 'Lareira', 'Closet', 'Despensa',
  'Lavabo', 'Suíte Master', 'Banheira', 'Box Blindex', 'Piso Laminado',
  'Piso Cerâmico', 'Portaria 24h', 'Interfone', 'Câmeras', 'Playground'
];

interface CharacteristicsSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
  selectedFeatures: string[];
  onFeatureToggle: (feature: string) => void;
}

export function CharacteristicsSection({ 
  formData, 
  onInputChange, 
  selectedFeatures, 
  onFeatureToggle 
}: CharacteristicsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Características
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="area">Área (m²)</Label>
            <Input
              id="area"
              type="number"
              value={formData.area || 0}
              onChange={(e) => onInputChange('area', Number(e.target.value))}
              placeholder="100"
              min="0"
            />
          </div>
          
          <div>
            <Label htmlFor="bedrooms">Quartos</Label>
            <Input
              id="bedrooms"
              type="number"
              value={formData.bedrooms || 0}
              onChange={(e) => onInputChange('bedrooms', Number(e.target.value))}
              placeholder="2"
              min="0"
            />
          </div>
          
          <div>
            <Label htmlFor="bathrooms">Banheiros</Label>
            <Input
              id="bathrooms"
              type="number"
              value={formData.bathrooms || 0}
              onChange={(e) => onInputChange('bathrooms', Number(e.target.value))}
              placeholder="1"
              min="0"
            />
          </div>
          
          <div>
            <Label htmlFor="garage_spots">Vagas</Label>
            <Input
              id="garage_spots"
              type="number"
              value={formData.garage_spots || 0}
              onChange={(e) => onInputChange('garage_spots', Number(e.target.value))}
              placeholder="1"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="floor_number">Andar</Label>
            <Input
              id="floor_number"
              type="number"
              value={formData.floor_number || 0}
              onChange={(e) => onInputChange('floor_number', Number(e.target.value))}
              placeholder="5"
              min="0"
            />
          </div>
          
          <div>
            <Label htmlFor="furnished">Mobiliado</Label>
            <Select value={formData.furnished} onValueChange={(value: FurnishedStatus) => onInputChange('furnished', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FURNISHED_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Características Adicionais</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {PROPERTY_FEATURES.map(feature => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={selectedFeatures.includes(feature)}
                  onCheckedChange={() => onFeatureToggle(feature)}
                />
                <Label htmlFor={feature} className="text-sm">
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
