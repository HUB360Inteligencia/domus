
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Check } from 'lucide-react';
import { PropertyFormData } from '@/types/property';
import { fetchAddressFromCEP, formatCEP, createFullAddressString } from '@/utils/cep-lookup';
import { geocodeAddress } from '@/api/properties';
import { toast } from 'sonner';

interface CEPFirstLocationSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
  onCoordsChange?: (coords: { lat: number; lng: number }) => void;
  showMapPreview?: boolean;
}

export function CEPFirstLocationSection({ 
  formData, 
  onInputChange, 
  onCoordsChange,
  showMapPreview = true 
}: CEPFirstLocationSectionProps) {
  const [isCEPLoading, setIsCEPLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  const [coordsFound, setCoordsFound] = useState(false);

  // Auto busca CEP quando tem 8 dígitos
  useEffect(() => {
    const cleanCEP = (formData.zip_code || '').replace(/\D/g, '');
    if (cleanCEP.length === 8 && !isCEPLoading) {
      handleCEPLookup();
    }
  }, [formData.zip_code]);

  // Auto busca coordenadas quando endereço + número estão completos
  useEffect(() => {
    if (formData.address && formData.property_number && formData.city && !isGeocoding) {
      handleGeocode();
    }
  }, [formData.address, formData.property_number, formData.city]);

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    onInputChange('zip_code', formatted);
    setCepFound(false);
  };

  const handleCEPLookup = async () => {
    if (!formData.zip_code || formData.zip_code.length < 9) return;

    setIsCEPLoading(true);
    try {
      const addressData = await fetchAddressFromCEP(formData.zip_code);
      
      if (addressData && !addressData.erro) {
        onInputChange('address', addressData.logradouro || '');
        onInputChange('neighborhood', addressData.bairro || '');
        onInputChange('city', addressData.localidade || '');
        onInputChange('state', addressData.uf || '');
        setCepFound(true);
        toast.success('Endereço encontrado!');
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsCEPLoading(false);
    }
  };

  const handleGeocode = async () => {
    if (!formData.address || !formData.property_number || !formData.city) return;

    setIsGeocoding(true);
    try {
      const fullAddress = createFullAddressString(
        formData.address,
        formData.property_number,
        formData.city,
        formData.state
      );

      const coords = await geocodeAddress(
        formData.address,
        formData.property_number,
        formData.city,
        formData.state
      );

      if (coords) {
        onInputChange('latitude', coords.lat);
        onInputChange('longitude', coords.lng);
        onCoordsChange?.(coords);
        setCoordsFound(true);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CEP - Primeiro campo */}
        <div>
          <Label htmlFor="zip_code">CEP *</Label>
          <div className="flex gap-2">
            <Input
              id="zip_code"
              value={formData.zip_code || ''}
              onChange={(e) => handleCEPChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className="flex-1"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCEPLookup}
              disabled={isCEPLoading || !formData.zip_code || formData.zip_code.length < 9}
              className="flex items-center gap-2"
            >
              {isCEPLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cepFound ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {isCEPLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Endereço e Número */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              placeholder="Rua, Avenida..."
              required
            />
          </div>
          <div>
            <Label htmlFor="property_number">Número *</Label>
            <Input
              id="property_number"
              value={formData.property_number || ''}
              onChange={(e) => onInputChange('property_number', e.target.value)}
              placeholder="123"
              required
            />
          </div>
        </div>

        {/* Complemento */}
        <div>
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={formData.complement || ''}
            onChange={(e) => onInputChange('complement', e.target.value)}
            placeholder="Apto 101, Bloco A..."
          />
        </div>

        {/* Bairro, Cidade, Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood || ''}
              onChange={(e) => onInputChange('neighborhood', e.target.value)}
              placeholder="Centro"
            />
          </div>
          <div>
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              placeholder="São Paulo"
              required
            />
          </div>
          <div>
            <Label htmlFor="state">Estado *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => onInputChange('state', e.target.value)}
              placeholder="SP"
              required
            />
          </div>
        </div>

        {/* Status de coordenadas e busca automática */}
        {isGeocoding && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando coordenadas...
          </div>
        )}

        {coordsFound && formData.latitude && formData.longitude && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">Coordenadas encontradas</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
            </div>
          </div>
        )}

        {/* Preview do mapa seria aqui se showMapPreview for true */}
        {showMapPreview && formData.latitude && formData.longitude && (
          <div className="bg-gray-100 border rounded-lg p-4 text-center text-sm text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            Localização no mapa será exibida aqui
          </div>
        )}
      </CardContent>
    </Card>
  );
}
