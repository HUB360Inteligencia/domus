
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PropertyFormData, Property } from '@/types/property';
import { toast } from 'sonner';
import { PropertyFormEnhanced } from './property-form-enhanced';

// Import the new section components
import { BasicInfoSection } from './form-sections/basic-info-section';
import { LocationSection } from './form-sections/location-section';
import { FinancialSection } from './form-sections/financial-section';
import { CharacteristicsSection } from './form-sections/characteristics-section';
import { TenantInfoSection } from './form-sections/tenant-info-section';
import { ImageUploadSection } from './form-sections/image-upload-section';

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
  const [showMap, setShowMap] = useState(false);

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

      // Show map if coordinates exist
      if (initialData.latitude && initialData.longitude) {
        setShowMap(true);
      }
    }
  }, [initialData]);

  // Show map when we have enough address info
  useEffect(() => {
    if (formData.address && formData.city && formData.state) {
      setShowMap(true);
    }
  }, [formData.address, formData.city, formData.state]);

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

  const handleImageRemove = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleAddressFound = (addressData: {
    address: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.address,
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      state: addressData.state,
    }));
  };

  const handleCoordsChange = (coords: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng
    }));
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
      <BasicInfoSection 
        formData={formData} 
        onInputChange={handleInputChange} 
      />

      {/* Localização */}
      <LocationSection 
        formData={formData} 
        onInputChange={handleInputChange}
        showMap={showMap}
        onAddressFound={handleAddressFound}
        onCoordsChange={handleCoordsChange}
      />

      {/* Valores Financeiros */}
      <FinancialSection 
        formData={formData} 
        onInputChange={handleInputChange} 
      />

      {/* Características */}
      <CharacteristicsSection 
        formData={formData} 
        onInputChange={handleInputChange}
        selectedFeatures={selectedFeatures}
        onFeatureToggle={handleFeatureToggle}
      />

      {/* Informações de Inquilino e Imobiliária */}
      <TenantInfoSection 
        formData={formData} 
        onInputChange={handleInputChange} 
      />

      {/* Upload de Imagem */}
      <ImageUploadSection 
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onImageRemove={handleImageRemove}
      />

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
