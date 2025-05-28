
import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, MapPin, Home, Bed, Bath, Car, Square, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Property } from '@/types/property';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionForm } from '@/components/finances/transaction-form';
import { ActivityForm } from '@/components/activities/activity-form';
import { PropertyValuationForm } from './PropertyValuationForm';
import { ContractForm } from '@/components/contracts/contract-form';
import { useFinancialCategories } from '@/hooks/use-financial-categories';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';
import { useActivityMutations } from '@/hooks/use-activity-mutations';
import { useContracts } from '@/hooks/use-contracts';
import { useProperties } from '@/hooks/use-properties';
import { toast } from 'sonner';

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
  const [activeModal, setActiveModal] = useState<'transaction' | 'activity' | 'valuation' | 'contract' | null>(null);

  // Hooks for form integrations
  const { categoryOptions } = useFinancialCategories();
  const { createTransaction, isCreating: isCreatingTransaction } = useFinancialTransactions();
  const { createActivity, isCreating: isCreatingActivity } = useActivityMutations();
  const { createContract, isCreatingContract } = useContracts();
  const { properties } = useProperties();

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

  // Property options for forms
  const propertyOptions = properties.map(prop => ({
    value: prop.id,
    label: prop.title
  }));

  // Handler functions for form submissions
  const handleTransactionSubmit = async (data: any) => {
    try {
      await createTransaction({
        ...data,
        property_id: property?.id || null
      });
      setActiveModal(null);
      toast.success('Transação criada com sucesso!');
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Erro ao criar transação');
    }
  };

  const handleActivitySubmit = async (data: any) => {
    try {
      await createActivity({
        ...data,
        property_id: property?.id || null
      });
      setActiveModal(null);
      toast.success('Atividade criada com sucesso!');
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Erro ao criar atividade');
    }
  };

  const handleContractSubmit = async (data: any, documentFile?: File) => {
    try {
      await createContract({
        ...data,
        property_id: property?.id || ''
      });
      setActiveModal(null);
      toast.success('Contrato criado com sucesso!');
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Erro ao criar contrato');
    }
  };

  const handleContractCancel = () => {
    setActiveModal(null);
  };

  if (isLoading) {
    return (
      <div className="relative h-48 md:h-64 bg-gradient-to-b from-muted/20 to-muted rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-8">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-white/20" />
            <div className="flex gap-2 md:gap-3">
              <Skeleton className="h-8 w-16 md:h-10 md:w-20 rounded-lg bg-white/20" />
              <Skeleton className="h-8 w-16 md:h-10 md:w-20 rounded-lg bg-white/20" />
            </div>
          </div>
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
        
        {/* Content Overlay with margin for safety */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-6 text-white">
          {/* Top Navigation with Badges on same line as back button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="ghost" 
                size={window.innerWidth < 768 ? "sm" : "icon"} 
                onClick={onBack}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              {/* Badges on same line as back button */}
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
            </div>

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

          {/* Property Information */}
          <div className="space-y-2 md:space-y-3">
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

            {/* Property Details - Smaller font size */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-white/90 text-xs">
              <div className="flex items-center gap-1">
                <Square className="h-3 w-3" />
                <span className="font-medium">
                  {property?.area ? `${property.area} m²` : 'N/A'}
                </span>
              </div>
              
              {property?.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
              )}
              
              {property?.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
              )}
              
              {property?.garage_spots && (
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  <span className="font-medium">{property.garage_spots}</span>
                </div>
              )}
            </div>

            {/* Bottom Row: Price + Status Info + Quick Actions */}
            <div className="flex justify-between items-end">
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-white drop-shadow-lg">
                {formatCurrency(property?.value)}
              </div>

              {/* Status and Rental Info + Quick Actions */}
              <div className="text-right space-y-1">
                {/* Status and Rental Value above buttons */}
                <div className="space-y-1">
                  {property?.status === 'rented' && property?.rental_value && (
                    <div className="text-sm text-white/90">
                      Aluguel: {formatCurrency(property.rental_value)}
                    </div>
                  )}
                  <div className="text-xs text-white/80">
                    Status: {getStatusLabel(property?.status || '')}
                  </div>
                </div>

                {/* Quick Actions - Horizontal Layout */}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => setActiveModal('transaction')}
                    className="bg-blue-500/20 backdrop-blur-sm hover:bg-blue-500/30 border border-blue-300/30 text-white text-xs px-2 py-1"
                  >
                    + Transação
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => setActiveModal('activity')}
                    className="bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 border border-green-300/30 text-white text-xs px-2 py-1"
                  >
                    + Atividade
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => setActiveModal('valuation')}
                    className="bg-purple-500/20 backdrop-blur-sm hover:bg-purple-500/30 border border-purple-300/30 text-white text-xs px-2 py-1"
                  >
                    + Avaliação
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setActiveModal('contract')}
                    className="bg-yellow-500/20 backdrop-blur-sm hover:bg-yellow-500/30 border border-yellow-300/30 text-white text-xs px-2 py-1"
                  >
                    + Contrato
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <Dialog open={activeModal === 'transaction'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Transação Financeira</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            onSubmit={handleTransactionSubmit}
            onCancel={() => setActiveModal(null)}
            isSubmitting={isCreatingTransaction}
            properties={propertyOptions}
            categories={categoryOptions}
          />
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={activeModal === 'activity'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
          </DialogHeader>
          <ActivityForm 
            onSubmit={handleActivitySubmit}
            isSubmitting={isCreatingActivity}
            initialData={{ property_id: property?.id || '' }}
          />
        </DialogContent>
      </Dialog>

      {/* Valuation Modal */}
      <Dialog open={activeModal === 'valuation'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atualizar Avaliação de Mercado</DialogTitle>
          </DialogHeader>
          <PropertyValuationForm 
            property={property}
            onSuccess={() => setActiveModal(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Contract Modal */}
      <Dialog open={activeModal === 'contract'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Contrato</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <ContractForm 
              initialData={{ property_id: property?.id || '' }}
              onSubmit={handleContractSubmit}
              onCancel={handleContractCancel}
              isSubmitting={isCreatingContract}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
