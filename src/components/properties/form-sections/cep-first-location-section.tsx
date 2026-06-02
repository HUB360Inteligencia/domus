
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Check } from 'lucide-react';
import { PropertyFormData } from '@/types/property';
import { fetchAddressFromCEP, formatCEP } from '@/utils/cep-lookup';
import { geocodeAddress } from '@/api/properties';
import { LocationMapPreview } from '@/components/properties/location-map-preview';
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
      const coords = await geocodeAddress(
        formData.address,
        formData.property_number,
        formData.city,
        formData.state,
        formData.zip_code
      );

      if (coords) {
        onInputChange('latitude', coords.lat);
        onInputChange('longitude', coords.lng);
        onCoordsChange?.(coords);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const mapLabel = [formData.address, formData.property_number].filter(Boolean).join(', ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CEP - Primeiro campo. Busca o endereço automaticamente ao completar 8 dígitos. */}
        <div>
          <Label htmlFor="zip_code">CEP *</Label>
          <div className="relative">
            <Input
              id="zip_code"
              value={formData.zip_code || ''}
              onChange={(e) => handleCEPChange(e.target.value)}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCEPLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : cepFound ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            O endereço é preenchido automaticamente ao digitar o CEP.
          </p>
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

        {/* Mapa do imóvel */}
        {showMapPreview && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isGeocoding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Localizando o imóvel no mapa...
                </>
              ) : (
                <span>Pré-visualização da localização</span>
              )}
            </div>
            <LocationMapPreview
              latitude={formData.latitude}
              longitude={formData.longitude}
              label={mapLabel || undefined}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
