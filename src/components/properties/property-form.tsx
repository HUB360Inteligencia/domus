
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PropertyFormData, Property, PropertyImage } from '@/types/property';
import { BasicInfoSection } from './form-sections/basic-info-section';
import { EnhancedLocationSection } from './form-sections/enhanced-location-section';
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
    square_meter_value: null,
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
        square_meter_value: initialData.square_meter_value || null,
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

  const handleAddressFound = (address: {
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => {
    handleInputChange('address', address.address);
    handleInputChange('neighborhood', address.neighborhood);
    handleInputChange('city', address.city);
    handleInputChange('state', address.state);
  };

  const handleCoordsChange = (coords: { lat: number; lng: number }) => {
    handleInputChange('latitude', coords.lat);
    handleInputChange('longitude', coords.lng);
  };

  const handleImagesChange = (images: PropertyImage[]) => {
    handleInputChange('images', images);
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
      <BasicInfoSection
        formData={formData}
        onInputChange={handleInputChange}
      />
      
      <EnhancedLocationSection
        formData={formData}
        onInputChange={handleInputChange}
        onAddressFound={handleAddressFound}
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
