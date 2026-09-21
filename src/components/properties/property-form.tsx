
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PropertyFormData, Property, PropertyImage } from '@/types/property';
import { useProperties } from '@/hooks/use-properties';
import { PropertyBaseSelector } from './property-base-selector';
import { BasicInfoSection } from './form-sections/basic-info-section';
import { CEPFirstLocationSection } from './form-sections/cep-first-location-section';
import { FinancialSection } from './form-sections/financial-section';
import { DynamicCharacteristicsSection } from './form-sections/dynamic-characteristics-section';
import { PropertyGallerySection } from './form-sections/property-gallery-section';

interface PropertyFormProps {
  initialData?: Property | null;
  onSubmit: (data: PropertyFormData, imageFile?: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PropertyForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: PropertyFormProps) {
  const { properties } = useProperties();
  const [selectedBasePropertyId, setSelectedBasePropertyId] = useState<string | null>(null);
  
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
    land_area: 0,
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
    tags: null,
    development_id: null,
    block: null,
    payment_type: null,
    down_payment: null,
    installments_count: null,
    installment_amount: null,
    installment_frequency: 'monthly',
    first_installment_date: null,
    creditor_name: null,
    purchase_index: 'none',
    purchase_notes: null,
    images: [],
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Initialize form data with initial data
  useEffect(() => {
    if (initialData) {
      console.log('Initializing form with data:', initialData);
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
        value: initialData.value || 0,
        rental_value: initialData.rental_value || 0,
        area: initialData.area || 0,
        land_area: initialData.land_area || 0,
        bedrooms: initialData.bedrooms || 0,
        bathrooms: initialData.bathrooms || 0,
        garage_spots: initialData.garage_spots || 0,
        condo_fee: initialData.condo_fee || 0,
        floor_number: initialData.floor_number || 0,
        furnished: initialData.furnished || 'not_furnished',
        features: (typeof initialData.features === 'object' && initialData.features !== null) 
          ? initialData.features as Record<string, boolean>
          : {},
        latitude: initialData.latitude ?? null,
        longitude: initialData.longitude ?? null,
        purchase_date: initialData.purchase_date || null,
        purchase_value: initialData.purchase_value || null,
        tags: initialData.tags || null,
        development_id: initialData.development_id ?? null,
        block: initialData.block ?? null,
        payment_type: initialData.payment_type ?? null,
        down_payment: initialData.down_payment ?? null,
        installments_count: initialData.installments_count ?? null,
        installment_amount: initialData.installment_amount ?? null,
        installment_frequency: initialData.installment_frequency ?? 'monthly',
        first_installment_date: initialData.first_installment_date ?? null,
        creditor_name: initialData.creditor_name ?? null,
        purchase_index: initialData.purchase_index ?? 'none',
        purchase_notes: initialData.purchase_notes ?? null,
        images: [],
      });

      // Extract features from initialData
      if (initialData.features && typeof initialData.features === 'object') {
        const features = Object.keys(initialData.features).filter(key => 
          initialData.features[key] === true
        );
        setSelectedFeatures(features);
      }
    }
  }, [initialData]);

  const handleInputChange = useCallback((
    field: keyof PropertyFormData,
    value: PropertyFormData[keyof PropertyFormData],
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const handleCoordsChange = useCallback((coords: { lat: number; lng: number }) => {
    setFormData((previous) => ({
      ...previous,
      latitude: coords.lat,
      longitude: coords.lng,
    }));
  }, []);

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => {
      const newFeatures = prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature];
      
      // Update form data features
      const featuresObject = newFeatures.reduce((acc, feat) => {
        acc[feat] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      handleInputChange('features', featuresObject);
      return newFeatures;
    });
  };

  const handleImagesChange = (images: PropertyImage[]) => {
    handleInputChange('images', images);
  };

  const handleCopyProperty = (property: Property) => {
    console.log('Copying property data:', property);
    
    // Copiar todos os dados incluindo localização, exceto coordenadas específicas
    setFormData({
      ...formData,
      title: `${property.title} (Cópia)`,
      description: property.description || '',
      // Manter informações de localização
      address: property.address || '',
      property_number: property.property_number || '',
      complement: property.complement || '',
      neighborhood: property.neighborhood || '',
      city: property.city || '',
      state: property.state || '',
      zip_code: property.zip_code || '',
      type: property.type,
      status: 'available', // Sempre começa como disponível
      value: property.value,
      rental_value: property.rental_value || 0,
      area: property.area || 0,
      land_area: property.land_area || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      garage_spots: property.garage_spots || 0,
      condo_fee: property.condo_fee || 0,
      floor_number: property.floor_number || 0,
      furnished: property.furnished || 'not_furnished',
      features: (typeof property.features === 'object' && property.features !== null) 
        ? property.features as Record<string, boolean>
        : {},
      purchase_value: property.purchase_value || 0,
      tags: property.tags || null,
      development_id: property.development_id ?? null,
      block: property.block ?? null,
      payment_type: property.payment_type ?? null,
      installment_frequency: property.installment_frequency ?? 'monthly',
      purchase_index: property.purchase_index ?? 'none',
      down_payment: null,
      installments_count: null,
      installment_amount: null,
      first_installment_date: null,
      creditor_name: null,
      purchase_notes: null,
      // Limpar apenas coordenadas específicas (para evitar duplicação exata)
      latitude: null,
      longitude: null,
      purchase_date: null,
      images: [],
    });

    // Extrair características
    if (property.features && typeof property.features === 'object') {
      const features = Object.keys(property.features).filter(key => 
        property.features[key] === true
      );
      setSelectedFeatures(features);
    }
  };

  const handleClearBaseProperty = () => {
    setSelectedBasePropertyId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    
    // Para manter compatibilidade, se há uma imagem principal, passa como imageFile
    const primaryImage = formData.images?.find(img => img.is_primary);
    onSubmit(formData, primaryImage?.file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seletor de propriedade base - apenas no modo criar */}
      {!initialData && properties.length > 0 && (
        <PropertyBaseSelector
          properties={properties}
          selectedPropertyId={selectedBasePropertyId}
          onPropertySelect={setSelectedBasePropertyId}
          onCopyProperty={handleCopyProperty}
          onClear={handleClearBaseProperty}
        />
      )}
      
      <BasicInfoSection
        formData={formData}
        onInputChange={handleInputChange}
      />
      
      <CEPFirstLocationSection
        formData={formData}
        onInputChange={handleInputChange}
        onCoordsChange={handleCoordsChange}
      />
      
      <FinancialSection
        formData={formData}
        onInputChange={handleInputChange}
      />
      
      <DynamicCharacteristicsSection
        formData={formData}
        onInputChange={handleInputChange}
        selectedFeatures={selectedFeatures}
        onFeatureToggle={handleFeatureToggle}
      />
      
      <PropertyGallerySection
        images={formData.images || []}
        onImagesChange={handleImagesChange}
        isEditing={!!initialData}
      />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Imóvel'
          )}
        </Button>
      </div>
    </form>
  );
}
