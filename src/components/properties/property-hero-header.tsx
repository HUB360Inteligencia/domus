
import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, MapPin, Home, Bed, Bath, Car, Square, Plus, Receipt, Activity, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<'valuation' | null>(null);

  // Helper function to format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleQuickAction = (action: string) => {
    if (!property?.id) return;
    
    switch (action) {
      case 'transaction':
        navigate(`/finances/transactions/new?property=${property.id}`);
        break;
      case 'activity':
        navigate(`/activities/new?property=${property.id}`);
        break;
      case 'valuation':
        setActiveModal('valuation');
        break;
    }
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
      <div className="relative h-48 md:h-64 bg-gradient-to-b from-muted/20 to-muted rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-6">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-white/20" />
            <div className="flex gap-2 md:gap-3">
              <Skeleton className="h-8 w-16 md:h-10 md:w-20 rounded-lg bg-white/20" />
              <Skeleton className="h-8 w-16 md:h-10 md:w-20 rounded-lg bg-white/20" />
            </div>
          </div>

          {/* Bottom Content */}
          <div className="space-y-2 md:space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 md:h-6 md:w-24 rounded-full bg-white/20" />
              <Skeleton className="h-5 w-16 md:h-6 md:w-20 rounded-full bg-white/20" />
            </div>
            <Skeleton className="h-6 w-3/4 md:h-8 bg-white/20" />
            <Skeleton className="h-4 w-1/2 md:h-5 bg-white/20" />
            <div className="flex gap-3 md:gap-4">
              <Skeleton className="h-4 w-12 md:h-5 md:w-16 bg-white/20" />
              <Skeleton className="h-4 w-12 md:h-5 md:w-16 bg-white/20" />
              <Skeleton className="h-4 w-12 md:h-5 md:w-16 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden shadow-2xl">
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
        <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-6 text-white">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size={window.innerWidth < 768 ? "sm" : "icon"} 
              onClick={onBack}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onEdit}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white text-xs md:text-sm"
              >
                <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 border border-red-300/30 text-white text-xs md:text-sm"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Excluir</span>
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

          {/* Property Information and Quick Actions */}
          <div className="flex justify-between items-end">
            {/* Property Info - Left Side */}
            <div className="space-y-2 md:space-y-3 flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-1 md:gap-2">
                <Badge 
                  variant="outline" 
                  className="bg-white/15 border-white/30 text-white backdrop-blur-sm text-xs"
                >
                  {getTypeLabel(property?.type || '')}
                </Badge>
                <Badge 
                  variant={getStatusBadgeVariant(property?.status || '')}
                  className="bg-white/15 border-white/30 text-white backdrop-blur-sm text-xs"
                >
                  {getStatusLabel(property?.status || '')}
                </Badge>
                {property?.tags && property.tags.length > 0 && (
                  property.tags.slice(0, 1).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-blue-500/20 border-blue-300/30 text-blue-100 backdrop-blur-sm text-xs"
                    >
                      {tag}
                    </Badge>
                  ))
                )}
              </div>

              {/* Property Title */}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg line-clamp-2">
                {property?.title}
              </h1>

              {/* Address */}
              <div className="flex items-center gap-1 md:gap-2 text-white/90">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                <span className="text-sm md:text-base line-clamp-1">
                  {property?.address}
                  {property?.neighborhood && ` - ${property.neighborhood}`}
                  {property?.city && `, ${property.city}`}
                </span>
              </div>

              {/* Property Details - Responsive */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-white/90 text-sm md:text-base">
                <div className="flex items-center gap-1 md:gap-2">
                  <Square className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="font-medium">
                    {property?.area ? `${property.area} m²` : 'N/A'}
                  </span>
                </div>
                
                {property?.bedrooms && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Bed className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                )}
                
                {property?.bathrooms && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Bath className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                )}
                
                {property?.garage_spots && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Car className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="font-medium">{property.garage_spots}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-white drop-shadow-lg">
                {formatCurrency(property?.value)}
              </div>
            </div>

            {/* Quick Actions - Right Side */}
            <div className="flex flex-col gap-2 ml-4">
              <Button
                size="sm"
                onClick={() => handleQuickAction('transaction')}
                className="bg-blue-500/20 backdrop-blur-sm hover:bg-blue-500/30 border border-blue-300/30 text-white text-xs"
              >
                <Receipt className="h-3 w-3 mr-1" />
                <span className="hidden md:inline">Transação</span>
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleQuickAction('activity')}
                className="bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 border border-green-300/30 text-white text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                <span className="hidden md:inline">Atividade</span>
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleQuickAction('valuation')}
                className="bg-purple-500/20 backdrop-blur-sm hover:bg-purple-500/30 border border-purple-300/30 text-white text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="hidden md:inline">Avaliação</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Valuation Modal */}
      <Dialog open={activeModal === 'valuation'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Atualizar Avaliação de Mercado</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-muted-foreground">
              Formulário de avaliação será implementado aqui.
              Valor atual: {formatCurrency(property?.value)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
