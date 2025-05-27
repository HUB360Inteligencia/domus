
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PropertyFormData, Property } from '@/types/property';
import { BasicInfoSection } from './form-sections/basic-info-section';
import { LocationSection } from './form-sections/location-section';
import { FinancialSection } from './form-sections/financial-section';
import { CharacteristicsSection } from './form-sections/characteristics-section';
import { TenantInfoSection } from './form-sections/tenant-info-section';
import { ImageUploadSection } from './form-sections/image-upload-section';

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
    tenant_name: null,
    tenant_contact: null,
    agency_name: null,
    agency_responsible: null,
    agency_contact: null,
    square_meter_value: null,
    tags: null,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);

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
        tenant_name: initialData.tenant_name || null,
        tenant_contact: initialData.tenant_contact || null,
        agency_name: initialData.agency_name || null,
        agency_responsible: initialData.agency_responsible || null,
        agency_contact: initialData.agency_contact || null,
        square_meter_value: initialData.square_meter_value || null,
        tags: initialData.tags || null,
      });
      
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }

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

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    onSubmit(formData, imageFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicInfoSection
        formData={formData}
        onInputChange={handleInputChange}
      />
      
      <LocationSection
        formData={formData}
        onInputChange={handleInputChange}
        showMap={showMap}
        onAddressFound={handleAddressFound}
        onCoordsChange={handleCoordsChange}
      />
      
      <FinancialSection
        formData={formData}
        onInputChange={handleInputChange}
      />
      
      <CharacteristicsSection
        formData={formData}
        onInputChange={handleInputChange}
        selectedFeatures={selectedFeatures}
        onFeatureToggle={handleFeatureToggle}
      />
      
      <TenantInfoSection
        formData={formData}
        onInputChange={handleInputChange}
      />
      
      <ImageUploadSection
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onImageRemove={handleImageRemove}
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
