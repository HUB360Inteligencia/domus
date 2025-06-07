import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PropertyFormData, Property } from '@/types/property';
import { useProperties } from '@/hooks/use-properties';
import { usePropertyFormSubmission } from '@/hooks/use-property-form-submission';
import { PropertyBaseSelector } from './property-base-selector';
import { BasicInfoSection } from './form-sections/basic-info-section';
import { CEPFirstLocationSection } from './form-sections/cep-first-location-section';
import { FinancialSection } from './form-sections/financial-section';
import { DynamicCharacteristicsSection } from './form-sections/dynamic-characteristics-section';
import { PropertyGallerySection } from './form-sections/property-gallery-section';

interface PropertyFormEnhancedProps {
  initialData?: Property | null;
  onSuccess: (propertyId: string) => void;
  onCancel: () => void;
}

export function PropertyFormEnhanced({ 
  initialData, 
  onSuccess, 
  onCancel 
}: PropertyFormEnhancedProps) {
  const { properties } = useProperties();
  const { submitProperty, isSubmitting } = usePropertyFormSubmission();
  const [selectedBasePropertyId, setSelectedBasePropertyId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
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
          ? initialData.features as Record<string, any>
          : {},
        latitude: initialData.latitude || null,
        longitude: initialData.longitude || null,
        purchase_date: initialData.purchase_date || null,
        purchase_value: initialData.purchase_value || null,
        tags: initialData.tags || null,
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

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    console.log(`Updating ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear any previous submission errors when user makes changes
    if (submitError) setSubmitError(null);
  };

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

  const handleCoordsChange = (coords: { lat: number; lng: number }) => {
    handleInputChange('latitude', coords.lat);
    handleInputChange('longitude', coords.lng);
  };

  const handleImagesChange = (images: any[]) => {
    handleInputChange('images', images);
  };

  const handleCopyProperty = (property: Property) => {
    console.log('Copying property data:', property);
    
    // Copiar todos os dados exceto ID e timestamps
    setFormData({
      ...formData,
      title: `${property.title} (Cópia)`,
      description: property.description || '',
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
        ? property.features as Record<string, any>
        : {},
      purchase_value: property.purchase_value || 0,
      tags: property.tags || null,
      // Não copiar localização específica
      address: '',
      property_number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    console.log('Submitting form data:', formData);
    
    try {
      const resultPropertyId = await submitProperty(
        formData, 
        !!initialData, 
        initialData?.id
      );
      
      if (resultPropertyId) {
        onSuccess(resultPropertyId);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'Erro inesperado ao salvar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {submitError}
          </AlertDescription>
        </Alert>
      )}

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
      />

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
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
