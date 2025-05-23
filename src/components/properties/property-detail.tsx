import React, { useState } from 'react';
import { ChevronLeft, Edit, Trash2, MapPin, Home, Info, User, Building, Banknote, SquareStack, Ticket, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PropertyMap } from './property-map';
import { PropertyFinancialSection } from './PropertyFinancialSection';
import { PropertyContractSection } from './PropertyContractSection';
import { PropertyImageGallery } from './PropertyImageGallery';
import { PropertyInvestmentSection } from './PropertyInvestmentSection';
import { PropertyOccupancySection } from './PropertyOccupancySection';

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

  // Function to render property details or skeletons when loading
  const renderPropertyInfo = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      );
    }

    return (
      <div>
        <h1 className="text-2xl font-bold">{property?.title}</h1>
        <p className="text-muted-foreground">{property?.address}, {property?.property_number} - {property?.city}, {property?.state}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className="text-muted-foreground">
            {property?.type === 'apartment' ? 'Apartamento' :
             property?.type === 'house' ? 'Casa' :
             property?.type === 'commercial' ? 'Comercial' :
             property?.type === 'land' ? 'Terreno' :
             property?.type === 'rural' ? 'Rural' :
             property?.type || 'N/A'}
          </Badge>
          <Badge 
            variant={
              property?.status === 'rented' ? 'default' :
              property?.status === 'available' ? 'outline' :
              property?.status === 'airbnb' ? 'secondary' :
              property?.status === 'maintenance' ? 'destructive' :
              'outline'
            }
          >
            {property?.status === 'rented' ? 'Alugado' :
             property?.status === 'available' ? 'Disponível' :
             property?.status === 'airbnb' ? 'Airbnb' :
             property?.status === 'maintenance' ? 'Em manutenção' :
             property?.status === 'sold' ? 'Vendido' :
             property?.status || 'N/A'}
          </Badge>
          {property?.tags && property.tags.length > 0 && (
            property.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {tag}
              </Badge>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {renderPropertyInfo()}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Imóvel</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Property Tabs */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
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
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            {/* Key Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
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

        {/* Location Tab */}
        <TabsContent value="location">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <PropertyMap 
                  address={property?.address || ''}
                  city={property?.city || ''}
                  state={property?.state || ''}
                  propertyId={property?.id}
                  property_number={property?.property_number}
                  complement={property?.complement}
                  neighborhood={property?.neighborhood}
                  initialCoords={property?.latitude && property?.longitude 
                    ? { lat: property.latitude, lng: property.longitude }
                    : null
                  }
                />
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
