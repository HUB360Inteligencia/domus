
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

const PROPERTY_FEATURES = {
  residential: [
    'Piscina', 'Academia', 'Churrasqueira', 'Jardim', 'Varanda', 'Sacada',
    'Ar Condicionado', 'Aquecedor', 'Lareira', 'Closet', 'Despensa',
    'Lavabo', 'Suíte Master', 'Banheira', 'Box Blindex', 'Piso Laminado',
    'Piso Cerâmico', 'Portaria 24h', 'Interfone', 'Câmeras', 'Playground'
  ],
  commercial: [
    'Ar Condicionado Central', 'Elevador', 'Gerador', 'Copa', 'Recepção',
    'Sala de Reunião', 'WC Masculino', 'WC Feminino', 'Estacionamento Rotativo',
    'Segurança 24h', 'CFTV', 'Interfone', 'Internet Fibra', 'Cozinha',
    'Área de Descanso', 'Terraço', 'Vista para Rua', 'Fácil Acesso'
  ],
  land: [
    'Cercado', 'Portão', 'Poço Artesiano', 'Energia Elétrica', 'Água Encanada',
    'Esgoto', 'Pavimentação', 'Iluminação Pública', 'Transporte Público',
    'Declive', 'Plano', 'Esquina', 'Frente para Rua', 'Documentação Regular'
  ]
};

interface DynamicCharacteristicsSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
  selectedFeatures: string[];
  onFeatureToggle: (feature: string) => void;
}

export function DynamicCharacteristicsSection({ 
  formData, 
  onInputChange, 
  selectedFeatures, 
  onFeatureToggle 
}: DynamicCharacteristicsSectionProps) {
  const propertyType = formData.type;
  const isResidential = propertyType === 'apartment' || propertyType === 'house';
  const isCommercial = propertyType === 'commercial';
  const isLand = propertyType === 'land' || propertyType === 'rural';

  const getRoomsLabel = () => {
    if (isCommercial) return 'Salas';
    return 'Quartos';
  };

  const getAreaLabel = () => {
    if (isLand) return 'Área Total (m²)';
    return 'Área Construída (m²)';
  };

  const getAvailableFeatures = () => {
    if (isCommercial) return PROPERTY_FEATURES.commercial;
    if (isLand) return PROPERTY_FEATURES.land;
    return PROPERTY_FEATURES.residential;
  };

  const shouldShowField = (field: string) => {
    switch (field) {
      case 'bedrooms':
        return isResidential || isCommercial;
      case 'bathrooms':
        return !isLand;
      case 'garage_spots':
        return !isLand;
      case 'floor_number':
        return propertyType === 'apartment' || isCommercial;
      case 'furnished':
        return isResidential;
      case 'land_area':
        return !isLand; // Para terrenos, só mostra área total
      default:
        return true;
    }
  };

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
            <Label htmlFor="area">{getAreaLabel()}</Label>
            <Input
              id="area"
              type="number"
              value={formData.area || 0}
              onChange={(e) => onInputChange('area', Number(e.target.value))}
              placeholder="100"
              min="0"
            />
          </div>

          {shouldShowField('land_area') && (
            <div>
              <Label htmlFor="land_area">Área do Terreno (m²)</Label>
              <Input
                id="land_area"
                type="number"
                value={formData.land_area || 0}
                onChange={(e) => onInputChange('land_area', Number(e.target.value))}
                placeholder="200"
                min="0"
              />
            </div>
          )}
          
          {shouldShowField('bedrooms') && (
            <div>
              <Label htmlFor="bedrooms">{getRoomsLabel()}</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms || 0}
                onChange={(e) => onInputChange('bedrooms', Number(e.target.value))}
                placeholder="2"
                min="0"
              />
            </div>
          )}
          
          {shouldShowField('bathrooms') && (
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
          )}
          
          {shouldShowField('garage_spots') && (
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
          )}
        </div>

        {(shouldShowField('floor_number') || shouldShowField('furnished')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shouldShowField('floor_number') && (
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
            )}
            
            {shouldShowField('furnished') && (
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
            )}
          </div>
        )}

        <div>
          <Label>Características Adicionais</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {getAvailableFeatures().map(feature => (
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
