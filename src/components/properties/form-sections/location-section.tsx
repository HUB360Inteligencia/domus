
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Locate, Loader2 } from 'lucide-react';
import { PropertyFormData } from '@/types/property';
import { PropertyMap } from '../property-map';
import { CEPLookup } from '../cep-lookup';
import { geocodeAddress } from '@/api/properties';
import { toast } from 'sonner';

interface LocationSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
  showMap: boolean;
  onAddressFound: (address: {
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => void;
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
}

export function LocationSection({ 
  formData, 
  onInputChange, 
  showMap, 
  onAddressFound, 
  onCoordsChange 
}: LocationSectionProps) {
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

  const handleGeocodeAddress = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Preencha pelo menos o endereço, cidade e estado para buscar coordenadas');
      return;
    }

    setIsGeocodingLocation(true);
    try {
      console.log('Geocoding address:', {
        address: formData.address,
        property_number: formData.property_number,
        city: formData.city,
        state: formData.state
      });

      const coords = await geocodeAddress(
        formData.address,
        formData.property_number,
        formData.city,
        formData.state
      );

      if (coords) {
        console.log('Coordinates found:', coords);
        onInputChange('latitude', coords.lat);
        onInputChange('longitude', coords.lng);
        onCoordsChange(coords);
        toast.success('Coordenadas encontradas com sucesso!');
      } else {
        toast.error('Não foi possível encontrar coordenadas para este endereço');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Erro ao buscar coordenadas do endereço');
    } finally {
      setIsGeocodingLocation(false);
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
        <CEPLookup
          value={formData.zip_code || ''}
          onChange={(value) => onInputChange('zip_code', value)}
          onAddressFound={onAddressFound}
        />

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
            <Label htmlFor="property_number">Número</Label>
            <Input
              id="property_number"
              value={formData.property_number || ''}
              onChange={(e) => onInputChange('property_number', e.target.value)}
              placeholder="123"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={formData.complement || ''}
              onChange={(e) => onInputChange('complement', e.target.value)}
              placeholder="Apto 101, Bloco A..."
            />
          </div>
          
          <div>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood || ''}
              onChange={(e) => onInputChange('neighborhood', e.target.value)}
              placeholder="Centro, Copacabana..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Botão para buscar coordenadas automaticamente */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleGeocodeAddress}
            disabled={isGeocodingLocation || !formData.address || !formData.city || !formData.state}
            className="flex items-center gap-2"
          >
            {isGeocodingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
            {isGeocodingLocation ? 'Buscando...' : 'Buscar Coordenadas'}
          </Button>

          {formData.latitude && formData.longitude && (
            <Badge variant="secondary" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
            </Badge>
          )}
        </div>

        {/* Mapa de Confirmação */}
        {showMap && formData.latitude && formData.longitude && (
          <div className="space-y-2">
            <Label>Confirmar Localização</Label>
            <PropertyMap
              address={formData.address}
              city={formData.city}
              state={formData.state}
              property_number={formData.property_number}
              complement={formData.complement}
              neighborhood={formData.neighborhood}
              initialCoords={formData.latitude && formData.longitude ? 
                { lat: formData.latitude, lng: formData.longitude } : null}
              editable={true}
              onCoordsChange={onCoordsChange}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
