import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PropertyFormData, PropertyStatus, PropertyType, FurnishedStatus, Property } from '@/types/property';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Upload, MapPin, DollarSign, Home, FileText, Users, Wrench } from 'lucide-react';
import { geocodeAddress } from '@/api/properties';
import { toast } from 'sonner';
import { PropertyFormEnhanced } from './property-form-enhanced';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartamento' },
  { value: 'house', label: 'Casa' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'land', label: 'Terreno' },
  { value: 'rural', label: 'Rural' },
];

const PROPERTY_STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'available', label: 'Disponível' },
  { value: 'rented', label: 'Alugado' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'sold', label: 'Vendido' },
];

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

interface PropertyFormProps {
  initialData?: Property;
  onSubmit: (data: PropertyFormData, imageFile?: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PropertyForm({ initialData, onSubmit, onCancel, isLoading = false }: PropertyFormProps) {
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    address: '',
    property_number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    type: 'apartment',
    status: 'available',
    value: 0,
    rental_value: 0,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    garage_spots: 0,
    condo_fee: 0,
    floor_number: 0,
    furnished: 'not_furnished',
    features: {},
    latitude: null,
    longitude: null,
    purchase_date: null,
    purchase_value: null,
    tenant_name: '',
    tenant_contact: '',
    agency_name: '',
    agency_responsible: '',
    agency_contact: '',
    square_meter_value: 0,
    tags: [],
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Handle features properly based on the type
      let featuresArray: string[] = [];
      let featuresObject: Record<string, boolean> = {};
      
      if (Array.isArray(initialData.features)) {
        featuresArray = initialData.features;
        featuresObject = initialData.features.reduce((acc, feat) => {
          acc[feat] = true;
          return acc;
        }, {} as Record<string, boolean>);
      } else if (typeof initialData.features === 'object' && initialData.features) {
        featuresObject = initialData.features as Record<string, boolean>;
        featuresArray = Object.keys(featuresObject).filter(key => featuresObject[key]);
      } else if (typeof initialData.features === 'string') {
        try {
          const parsed = JSON.parse(initialData.features);
          if (Array.isArray(parsed)) {
            featuresArray = parsed;
            featuresObject = parsed.reduce((acc, feat) => {
              acc[feat] = true;
              return acc;
            }, {} as Record<string, boolean>);
          } else if (typeof parsed === 'object') {
            featuresObject = parsed;
            featuresArray = Object.keys(parsed).filter(key => parsed[key]);
          }
        } catch {
          featuresArray = [];
          featuresObject = {};
        }
      }

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        address: initialData.address || '',
        property_number: initialData.property_number || '',
        complement: initialData.complement || '',
        neighborhood: initialData.neighborhood || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip_code: initialData.zip_code || '',
        type: initialData.type || 'apartment',
        status: initialData.status || 'available',
        value: Number(initialData.value) || 0,
        rental_value: Number(initialData.rental_value) || 0,
        area: Number(initialData.area) || 0,
        bedrooms: Number(initialData.bedrooms) || 0,
        bathrooms: Number(initialData.bathrooms) || 0,
        garage_spots: Number(initialData.garage_spots) || 0,
        condo_fee: Number(initialData.condo_fee) || 0,
        floor_number: Number(initialData.floor_number) || 0,
        furnished: initialData.furnished || 'not_furnished',
        features: featuresObject,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        purchase_date: initialData.purchase_date,
        purchase_value: Number(initialData.purchase_value) || null,
        tenant_name: initialData.tenant_name || '',
        tenant_contact: initialData.tenant_contact || '',
        agency_name: initialData.agency_name || '',
        agency_responsible: initialData.agency_responsible || '',
        agency_contact: initialData.agency_contact || '',
        square_meter_value: Number(initialData.square_meter_value) || 0,
        tags: initialData.tags || [],
      });

      setSelectedFeatures(featuresArray);

      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData]);

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    
    setSelectedFeatures(newFeatures);
    
    const featuresObject = newFeatures.reduce((acc, feat) => {
      acc[feat] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    handleInputChange('features', featuresObject);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetCoordinates = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Preencha o endereço, cidade e estado para obter as coordenadas');
      return;
    }

    setIsLoadingCoordinates(true);
    try {
      const coordinates = await geocodeAddress(
        formData.address,
        formData.property_number,
        formData.city,
        formData.state
      );

      if (coordinates) {
        setFormData(prev => ({
          ...prev,
          latitude: coordinates.lat,
          longitude: coordinates.lng
        }));
        toast.success('Coordenadas obtidas com sucesso!');
      } else {
        toast.warning('Não foi possível obter as coordenadas para este endereço');
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      toast.error('Erro ao obter coordenadas');
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.address || !formData.city || !formData.state) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    onSubmit(formData, imageFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Informações Básicas */}
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
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Apartamento 2 quartos no Centro"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Tipo de Imóvel</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
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

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva as características do imóvel..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Endereço *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Rua, Avenida..."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="property_number">Número</Label>
              <Input
                id="property_number"
                value={formData.property_number}
                onChange={(e) => handleInputChange('property_number', e.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => handleInputChange('complement', e.target.value)}
                placeholder="Apto 101, Bloco A..."
              />
            </div>
            
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                placeholder="Centro, Copacabana..."
              />
            </div>
            
            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="São Paulo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="SP"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCoordinates}
              disabled={isLoadingCoordinates}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              {isLoadingCoordinates ? 'Obtendo...' : 'Obter Coordenadas'}
            </Button>
            
            {formData.latitude && formData.longitude && (
              <Badge variant="secondary">
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Valores Financeiros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valores Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value">Valor de Mercado do Imóvel *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleInputChange('value', Number(e.target.value))}
                placeholder="500000"
                min="0"
                step="1000"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="rental_value">Valor de Aluguel</Label>
              <Input
                id="rental_value"
                type="number"
                value={formData.rental_value}
                onChange={(e) => handleInputChange('rental_value', Number(e.target.value))}
                placeholder="2500"
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase_value">Valor de Compra</Label>
              <Input
                id="purchase_value"
                type="number"
                value={formData.purchase_value || ''}
                onChange={(e) => handleInputChange('purchase_value', e.target.value ? Number(e.target.value) : null)}
                placeholder="450000"
                min="0"
                step="1000"
              />
            </div>
            
            <div>
              <Label htmlFor="purchase_date">Data de Compra</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date || ''}
                onChange={(e) => handleInputChange('purchase_date', e.target.value || null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condo_fee">Taxa de Condomínio</Label>
              <Input
                id="condo_fee"
                type="number"
                value={formData.condo_fee}
                onChange={(e) => handleInputChange('condo_fee', Number(e.target.value))}
                placeholder="300"
                min="0"
                step="50"
              />
            </div>
            
            <div>
              <Label htmlFor="square_meter_value">Valor por m²</Label>
              <Input
                id="square_meter_value"
                type="number"
                value={formData.square_meter_value}
                onChange={(e) => handleInputChange('square_meter_value', Number(e.target.value))}
                placeholder="5000"
                min="0"
                step="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Características */}
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
                value={formData.area}
                onChange={(e) => handleInputChange('area', Number(e.target.value))}
                placeholder="100"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="bedrooms">Quartos</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                placeholder="2"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="bathrooms">Banheiros</Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                placeholder="1"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="garage_spots">Vagas</Label>
              <Input
                id="garage_spots"
                type="number"
                value={formData.garage_spots}
                onChange={(e) => handleInputChange('garage_spots', Number(e.target.value))}
                placeholder="1"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="floor_number">Andar</Label>
              <Input
                id="floor_number"
                type="number"
                value={formData.floor_number}
                onChange={(e) => handleInputChange('floor_number', Number(e.target.value))}
                placeholder="5"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="furnished">Mobiliado</Label>
              <Select value={formData.furnished} onValueChange={(value) => handleInputChange('furnished', value)}>
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
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
            <Label>Características Adicionais</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {PROPERTY_FEATURES.map(feature => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={selectedFeatures.includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
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

      {/* Informações de Inquilino e Imobiliária */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Informações de Inquilino e Imobiliária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tenant_name">Nome do Inquilino</Label>
              <Input
                id="tenant_name"
                value={formData.tenant_name}
                onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                placeholder="João Silva"
              />
            </div>
            
            <div>
              <Label htmlFor="tenant_contact">Contato do Inquilino</Label>
              <Input
                id="tenant_contact"
                value={formData.tenant_contact}
                onChange={(e) => handleInputChange('tenant_contact', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="agency_name">Nome da Imobiliária</Label>
              <Input
                id="agency_name"
                value={formData.agency_name}
                onChange={(e) => handleInputChange('agency_name', e.target.value)}
                placeholder="Imobiliária XYZ"
              />
            </div>
            
            <div>
              <Label htmlFor="agency_responsible">Responsável</Label>
              <Input
                id="agency_responsible"
                value={formData.agency_responsible}
                onChange={(e) => handleInputChange('agency_responsible', e.target.value)}
                placeholder="Maria Santos"
              />
            </div>
            
            <div>
              <Label htmlFor="agency_contact">Contato da Imobiliária</Label>
              <Input
                id="agency_contact"
                value={formData.agency_contact}
                onChange={(e) => handleInputChange('agency_contact', e.target.value)}
                placeholder="(11) 3333-3333"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload de Imagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Imagem do Imóvel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image">Selecionar Imagem</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1"
              />
            </div>
            
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Componente de melhorias avançadas */}
      <PropertyFormEnhanced 
        formData={formData} 
        onFormDataChange={setFormData}
      />

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'} Imóvel
        </Button>
      </div>
    </form>
  );
}
