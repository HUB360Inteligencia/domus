
import React from 'react';
import { ArrowLeft, Edit, Trash2, MapPin, Home, Bed, Bath, Car, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyHeroHeaderProps {
  property: Property | null | undefined;
  isLoading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export const PropertyHeroHeader: React.FC<PropertyHeroHeaderProps> = ({
  property,
  isLoading,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  // Helper function to format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'rented':
        return 'default';
      case 'available':
        return 'outline';
      case 'airbnb':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rented':
        return 'Alugado';
      case 'available':
        return 'Disponível';
      case 'airbnb':
        return 'Airbnb';
      case 'maintenance':
        return 'Em manutenção';
      case 'sold':
        return 'Vendido';
      default:
        return status || 'N/A';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'apartment':
        return 'Apartamento';
      case 'house':
        return 'Casa';
      case 'commercial':
        return 'Comercial';
      case 'land':
        return 'Terreno';
      case 'rural':
        return 'Rural';
      default:
        return type || 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="relative h-96 bg-gradient-to-b from-muted/20 to-muted rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-20 rounded-lg bg-white/20" />
              <Skeleton className="h-10 w-20 rounded-lg bg-white/20" />
            </div>
          </div>

          {/* Bottom Content */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full bg-white/20" />
              <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
            </div>
            <Skeleton className="h-8 w-3/4 bg-white/20" />
            <Skeleton className="h-5 w-1/2 bg-white/20" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-16 bg-white/20" />
              <Skeleton className="h-5 w-16 bg-white/20" />
              <Skeleton className="h-5 w-16 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: property?.image_url 
            ? `url(${property.image_url})`
            : 'url(https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&h=800&fit=crop)'
        }}
      />
      
      {/* Progressive Blur Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent backdrop-blur-[1px]" />
      
      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onEdit}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost"
                  className="bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 border border-red-300/30 text-white"
                >
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

        {/* Property Information */}
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="bg-white/15 border-white/30 text-white backdrop-blur-sm"
            >
              {getTypeLabel(property?.type || '')}
            </Badge>
            <Badge 
              variant={getStatusBadgeVariant(property?.status || '')}
              className="bg-white/15 border-white/30 text-white backdrop-blur-sm"
            >
              {getStatusLabel(property?.status || '')}
            </Badge>
            {property?.tags && property.tags.length > 0 && (
              property.tags.slice(0, 2).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-blue-500/20 border-blue-300/30 text-blue-100 backdrop-blur-sm"
                >
                  {tag}
                </Badge>
              ))
            )}
          </div>

          {/* Property Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {property?.title}
          </h1>

          {/* Address */}
          <div className="flex items-center gap-2 text-white/90">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">
              {property?.address}
              {property?.property_number && `, ${property.property_number}`}
              {property?.neighborhood && ` - ${property.neighborhood}`}
              {property?.city && `, ${property.city}`}
              {property?.state && ` - ${property.state}`}
            </span>
          </div>

          {/* Property Details */}
          <div className="flex flex-wrap items-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Square className="h-5 w-5" />
              <span className="font-medium">
                {property?.area ? `${property.area} m²` : 'N/A'}
              </span>
            </div>
            
            {property?.bedrooms && (
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5" />
                <span className="font-medium">{property.bedrooms} quartos</span>
              </div>
            )}
            
            {property?.bathrooms && (
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5" />
                <span className="font-medium">{property.bathrooms} banheiros</span>
              </div>
            )}
            
            {property?.garage_spots && (
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                <span className="font-medium">{property.garage_spots} vagas</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
            {formatCurrency(property?.value)}
          </div>
        </div>
      </div>
    </div>
  );
};
