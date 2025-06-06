
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { PropertyFormData } from '@/types/property';
import { geocodeAddress } from '@/api/properties';
import { toast } from 'sonner';

interface EnhancedLocationSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: any) => void;
  onAddressFound?: (address: {
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => void;
  onCoordsChange?: (coords: { lat: number; lng: number }) => void;
}

export function EnhancedLocationSection({ 
  formData, 
  onInputChange, 
  onAddressFound,
  onCoordsChange 
}: EnhancedLocationSectionProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapPreview, setMapPreview] = useState<string | null>(null);

  // Auto-search quando CEP e número estão preenchidos
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (formData.zip_code && formData.property_number && formData.zip_code.length >= 8) {
        await handleAutoGeocode();
      }
    }, 1000); // Debounce de 1 segundo

    return () => clearTimeout(timeoutId);
  }, [formData.zip_code, formData.property_number]);

  // Atualizar preview do mapa quando coordenadas mudarem
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-building+ff0000(${formData.longitude},${formData.latitude})/${formData.longitude},${formData.latitude},14,0/300x200@2x?access_token=${localStorage.getItem('mapbox_token') || 'pk.example'}`;
      setMapPreview(mapUrl);
    }
  }, [formData.latitude, formData.longitude]);

  const handleAutoGeocode = async () => {
    if (!formData.zip_code || !formData.property_number) return;

    setIsGeocoding(true);
    try {
      const coords = await geocodeAddress(
        formData.address || '',
        formData.property_number,
        formData.city,
        formData.state
      );

      if (coords) {
        onInputChange('latitude', coords.lat);
        onInputChange('longitude', coords.lng);
        onCoordsChange?.(coords);
        console.log('Coordenadas encontradas automaticamente:', coords);
      }
    } catch (error) {
      console.error('Erro na busca automática de coordenadas:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleManualGeocode = async () => {
    if (!formData.address) {
      toast.error('Preencha o endereço primeiro');
      return;
    }

    setIsGeocoding(true);
    try {
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
        toast.success('Coordenadas encontradas!');
      } else {
        toast.error('Não foi possível encontrar as coordenadas para este endereço');
      }
    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      toast.error('Erro ao buscar coordenadas');
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              placeholder="Rua, Avenida, etc."
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
              placeholder="Apt 101, Bloco A"
            />
          </div>
          
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
            <Label htmlFor="zip_code">CEP</Label>
            <Input
              id="zip_code"
              value={formData.zip_code || ''}
              onChange={(e) => onInputChange('zip_code', e.target.value)}
              placeholder="12345-678"
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

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              {formData.latitude && formData.longitude ? (
                <>Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</>
              ) : (
                'Nenhuma coordenada definida'
              )}
            </span>
            {isGeocoding && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualGeocode}
            disabled={isGeocoding || !formData.address}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Buscar Coordenadas
          </Button>
        </div>

        {mapPreview && (
          <div className="mt-4">
            <Label>Preview da Localização</Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              <img
                src={mapPreview}
                alt="Preview do mapa"
                className="w-full h-48 object-cover"
                onError={() => setMapPreview(null)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
