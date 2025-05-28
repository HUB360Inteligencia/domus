import React, { useState } from 'react';
import { Info, User, Building, Banknote, Ticket, ImageIcon, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PropertyDetailMap } from './property-detail-map';
import { PropertyFinancialInvestmentSection } from './PropertyFinancialInvestmentSection';
import { PropertyTransactionsSection } from './PropertyTransactionsSection';
import { PropertyContractOccupancySection } from './PropertyContractOccupancySection';
import { PropertyImageGallery } from './PropertyImageGallery';
import { PropertyHeroHeader } from './property-hero-header';
import { PropertyStatusCard } from './PropertyStatusCard';
import { PropertyFinancialDetailsCard } from './PropertyFinancialDetailsCard';
import { PropertyContractSection } from './PropertyContractSection';
import { PropertyMonthlyYieldCard } from './PropertyMonthlyYieldCard';
import { Home } from 'lucide-react';

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
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="inline sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
            <span className="inline sm:hidden">Finan.</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Transações</span>
            <span className="inline sm:hidden">Trans.</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Contratos</span>
            <span className="inline sm:hidden">Contr.</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Fotos</span>
            <span className="inline sm:hidden">Fotos</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Linha 1: Property Details + Financial Details + Status Cards - Altura Uniforme */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Property Details Card (sem linha "Valor") */}
            <Card className="h-full min-h-[280px] border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
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
                  // Detalhes do imóvel SEM a linha "Valor"
                  <>
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

            {/* Financial Details Card */}
            <div className="h-full min-h-[280px]">
              <PropertyFinancialDetailsCard property={property} isLoading={isLoading} />
            </div>

            {/* Status Card com Rendimento abaixo */}
            <div className="space-y-6 h-full">
              <PropertyStatusCard property={property} isLoading={isLoading} />
              <PropertyMonthlyYieldCard property={property} isLoading={isLoading} />
            </div>
          </div>

          {/* Linha 2: Map (1,5 cols) + Description + Features (1,5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Localização</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : property ? (
                  <PropertyDetailMap property={property} />
                ) : (
                  <div className="flex items-center justify-center h-[300px] bg-muted">
                    <p className="text-muted-foreground">Propriedade não encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description + Features */}
            <div className="space-y-6">
              {/* Description */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
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

              {/* Features */}
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
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
            </div>
          </div>
        </TabsContent>

        {/* Financial/Investment Tab */}
        <TabsContent value="financial">
          <PropertyFinancialInvestmentSection property={property} isLoading={isLoading} />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <PropertyTransactionsSection property={property} isLoading={isLoading} />
        </TabsContent>

        {/* Contract/Occupancy Tab */}
        <TabsContent value="contracts">
          <PropertyContractSection property={property} isLoading={isLoading} />
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <PropertyImageGallery 
            propertyId={property?.id || null}
            isLoading={isLoading} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
