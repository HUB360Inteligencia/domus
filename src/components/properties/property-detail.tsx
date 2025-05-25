import React, { useState } from 'react';
import { MapPin, Info, User, Building, Banknote, SquareStack, Ticket, ImageIcon, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PropertyDetailMap } from './property-detail-map';
import { PropertyFinancialSection } from './PropertyFinancialSection';
import { PropertyContractSection } from './PropertyContractSection';
import { PropertyImageGallery } from './PropertyImageGallery';
import { PropertyInvestmentSection } from './PropertyInvestmentSection';
import { PropertyOccupancySection } from './PropertyOccupancySection';
import { PropertyHeroHeader } from './property-hero-header';

interface PropertyDetailProps {
  property: Property | null | undefined;
  isLoading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({
  property,
  isLoading,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Modern Hero Header */}
      <PropertyHeroHeader
        property={property}
        isLoading={isLoading}
        onBack={onBack}
        onEdit={onEdit}
        onDelete={onDelete}
        isDeleting={isDeleting}
      />

      {/* Property Tabs */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="inline sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Fotos</span>
            <span className="inline sm:hidden">Fotos</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Localização</span>
            <span className="inline sm:hidden">Local</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
            <span className="inline sm:hidden">Finan.</span>
          </TabsTrigger>
          <TabsTrigger value="investments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Investimentos</span>
            <span className="inline sm:hidden">Invest.</span>
          </TabsTrigger>
          <TabsTrigger value="occupancy" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Ocupação</span>
            <span className="inline sm:hidden">Ocup.</span>
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Contrato</span>
            <span className="inline sm:hidden">Contrato</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Property Details */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  // ... keep existing code (loading skeletons)
                  <>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </>
                ) : (
                  // ... keep existing code (property details display)
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor</span>
                      <span className="font-medium">{formatCurrency(property?.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área</span>
                      <span className="font-medium">{property?.area ? `${property.area} m²` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quartos</span>
                      <span className="font-medium">{property?.bedrooms || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banheiros</span>
                      <span className="font-medium">{property?.bathrooms || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vagas</span>
                      <span className="font-medium">{property?.garage_spots || 'N/A'}</span>
                    </div>
                    {property?.condo_fee !== undefined && property?.condo_fee !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Condomínio</span>
                        <span className="font-medium">{formatCurrency(property.condo_fee)}</span>
                      </div>
                    )}
                    {property?.neighborhood && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bairro</span>
                        <span className="font-medium">{property.neighborhood}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Property Image */}
            <Card className="lg:col-span-2 overflow-hidden">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : property?.image_url ? (
                <img 
                  src={property.image_url} 
                  alt={property.title}
                  className="w-full h-[300px] object-cover"
                />
              ) : (
                <div className="w-full h-[300px] bg-muted flex items-center justify-center">
                  <Home className="h-16 w-16 text-muted-foreground opacity-20" />
                </div>
              )}
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : property?.description ? (
                <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
              ) : (
                <p className="text-muted-foreground italic">Nenhuma descrição disponível.</p>
              )}
            </CardContent>
          </Card>

          {/* Additional Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Características</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : property?.features && Object.keys(property.features).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                  {Object.entries(property.features as Record<string, any>)
                    .filter(([_, value]) => value === true)
                    .map(([key]) => (
                      <div key={key} className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                        <span className="text-sm">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Nenhuma característica adicionada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments">
          <PropertyInvestmentSection 
            property={property}
            isLoading={isLoading} 
          />
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <PropertyImageGallery 
            propertyId={property?.id || null}
            isLoading={isLoading} 
          />
        </TabsContent>

        {/* Enhanced Location Tab with Advanced Map */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização Avançada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : property ? (
                <PropertyDetailMap property={property} />
              ) : (
                <div className="flex items-center justify-center h-[500px] bg-muted">
                  <p className="text-muted-foreground">Propriedade não encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <PropertyFinancialSection property={property} isLoading={isLoading} />
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy">
          <PropertyOccupancySection property={property} isLoading={isLoading} />
        </TabsContent>

        {/* Contract Tab */}
        <TabsContent value="contract">
          <PropertyContractSection property={property} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
