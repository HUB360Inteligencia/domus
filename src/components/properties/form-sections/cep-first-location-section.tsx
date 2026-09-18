import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Loader2, MapPin } from 'lucide-react';
import type { PropertyFormData } from '@/types/property';
import { fetchAddressFromCEP, formatCEP } from '@/utils/cep-lookup';
import { geocodeAddress } from '@/api/properties';
import { LocationMapPreview } from '@/components/properties/location-map-preview';
import { hasValidCoordinates } from '@/lib/property-map-data';
import { toast } from 'sonner';

interface CEPFirstLocationSectionProps {
  formData: PropertyFormData;
  onInputChange: (field: keyof PropertyFormData, value: PropertyFormData[keyof PropertyFormData]) => void;
  onCoordsChange?: (coords: { lat: number; lng: number }) => void;
  showMapPreview?: boolean;
}

const GEOCODE_DEBOUNCE_MS = 500;

export function CEPFirstLocationSection({
  formData,
  onInputChange,
  onCoordsChange,
  showMapPreview = true,
}: CEPFirstLocationSectionProps) {
  const [isCEPLoading, setIsCEPLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const userTypedCEP = useRef(false);
  const resolvedAddressKey = useRef('');

  useEffect(() => {
    if (!userTypedCEP.current) return;
    const cleanCEP = (formData.zip_code || '').replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;

    let isCancelled = false;
    setIsCEPLoading(true);

    void fetchAddressFromCEP(formData.zip_code || '')
      .then((addressData) => {
        if (isCancelled) return;
        if (!addressData || addressData.erro) {
          setCepFound(false);
          toast.error('CEP não encontrado');
          return;
        }

        onInputChange('address', addressData.logradouro || '');
        onInputChange('neighborhood', addressData.bairro || '');
        onInputChange('city', addressData.localidade || '');
        onInputChange('state', addressData.uf || '');
        setCepFound(true);
        toast.success('Endereço encontrado!');
      })
      .catch(() => {
        if (!isCancelled) toast.error('Erro ao buscar CEP');
      })
      .finally(() => {
        if (!isCancelled) setIsCEPLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [formData.zip_code, onInputChange]);

  useEffect(() => {
    if (!formData.address || !formData.property_number || !formData.city) {
      setGeocodeError(null);
      return;
    }

    const addressKey = [
      formData.address,
      formData.property_number,
      formData.city,
      formData.state,
      formData.zip_code,
    ].join('|');
    if (!resolvedAddressKey.current && hasValidCoordinates({
      latitude: formData.latitude,
      longitude: formData.longitude,
    })) {
      resolvedAddressKey.current = addressKey;
      return;
    }
    if (resolvedAddressKey.current === addressKey) return;

    const abortController = new AbortController();
    const timer = window.setTimeout(() => {
      setIsGeocoding(true);
      setGeocodeError(null);

      void geocodeAddress(
        formData.address,
        formData.property_number,
        formData.city,
        formData.state,
        formData.zip_code,
        abortController.signal,
      )
        .then((coords) => {
          if (abortController.signal.aborted) return;
          resolvedAddressKey.current = addressKey;
          if (!coords) {
            onInputChange('latitude', null);
            onInputChange('longitude', null);
            setGeocodeError('Não foi possível localizar este endereço com precisão.');
            return;
          }

          onInputChange('latitude', coords.lat);
          onInputChange('longitude', coords.lng);
          onCoordsChange?.(coords);
        })
        .finally(() => {
          if (!abortController.signal.aborted) setIsGeocoding(false);
        });
    }, GEOCODE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      abortController.abort();
    };
  }, [
    formData.address,
    formData.city,
    formData.latitude,
    formData.longitude,
    formData.property_number,
    formData.state,
    formData.zip_code,
    onCoordsChange,
    onInputChange,
  ]);

  const handleCEPChange = (value: string) => {
    userTypedCEP.current = true;
    onInputChange('zip_code', formatCEP(value));
    setCepFound(false);
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
        <div>
          <Label htmlFor="zip_code">CEP *</Label>
          <div className="relative">
            <Input
              id="zip_code"
              value={formData.zip_code || ''}
              onChange={(event) => handleCEPChange(event.target.value)}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(event) => onInputChange('address', event.target.value)}
              placeholder="Rua, Avenida..."
              required
            />
          </div>
          <div>
            <Label htmlFor="property_number">Número *</Label>
            <Input
              id="property_number"
              value={formData.property_number || ''}
              onChange={(event) => onInputChange('property_number', event.target.value)}
              placeholder="123"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={formData.complement || ''}
            onChange={(event) => onInputChange('complement', event.target.value)}
            placeholder="Apto 101, Bloco A..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood || ''}
              onChange={(event) => onInputChange('neighborhood', event.target.value)}
              placeholder="Centro"
            />
          </div>
          <div>
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(event) => onInputChange('city', event.target.value)}
              placeholder="São Paulo"
              required
            />
          </div>
          <div>
            <Label htmlFor="state">Estado *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(event) => onInputChange('state', event.target.value)}
              placeholder="SP"
              required
            />
          </div>
        </div>

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
            {geocodeError && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {geocodeError}
              </p>
            )}
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
