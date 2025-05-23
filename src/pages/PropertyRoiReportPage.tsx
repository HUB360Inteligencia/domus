
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePropertyFinancial } from '@/hooks/use-property-financial';
import { PropertyRoiReportSection } from '@/components/properties/PropertyRoiReportSection';
import { usePropertyInvestments } from '@/hooks/use-property-investments';
import { PropertyInvestmentSection } from '@/components/properties/PropertyInvestmentSection';
import { usePropertyOccupancy } from '@/hooks/use-property-occupancy';
import { PropertyOccupancySection } from '@/components/properties/PropertyOccupancySection';
import { useProperties } from '@/hooks/use-properties';
import { Button } from '@/components/ui/button';
import { Loader2, Home, ArrowLeft } from 'lucide-react';

export default function PropertyRoiReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [propertyId, setPropertyId] = useState<string | null>(null);
  
  const { 
    selectedProperty,
    setSelectedPropertyId,
    isLoadingProperties 
  } = useProperties();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      setPropertyId(id);
      setSelectedPropertyId(id);
    } else {
      navigate('/properties');
    }
  }, [location.search, navigate, setSelectedPropertyId]);

  const handleBack = () => {
    navigate(`/properties/detail?id=${propertyId}`);
  };

  if (isLoadingProperties || !selectedProperty) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do imóvel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold ml-2">
            Relatório Financeiro: {selectedProperty.title}
          </h1>
        </div>
        <Button variant="outline" onClick={() => navigate(`/properties/detail?id=${propertyId}`)}>
          <Home className="mr-2 h-4 w-4" />
          Dados do Imóvel
        </Button>
      </div>
      
      {propertyId && (
        <>
          <PropertyRoiReportSection propertyId={propertyId} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PropertyInvestmentSection propertyId={propertyId} />
            <PropertyOccupancySection 
              propertyId={propertyId} 
              vacancyRate={selectedProperty.vacancy_rate} 
            />
          </div>
        </>
      )}
    </div>
  );
}
