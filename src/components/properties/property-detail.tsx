import { useState } from 'react';
import { Building, ArrowLeft, Edit, Trash2, Home, MapPin, Square, Bed, Bath, Loader2, AlertTriangle } from 'lucide-react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PropertyMap } from './property-map';

interface PropertyDetailProps {
  property: Property | null;
  isLoading: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function PropertyDetail({
  property,
  isLoading,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}: PropertyDetailProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency', 
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'Disponível', color: 'bg-emerald-500' };
      case 'rented':
        return { label: 'Alugado', color: 'bg-blue-500' };
      case 'airbnb':
        return { label: 'Airbnb', color: 'bg-red-500' };
      case 'maintenance':
        return { label: 'Em manutenção', color: 'bg-amber-500' };
      case 'sold':
        return { label: 'Vendido', color: 'bg-purple-500' };
      default:
        return { label: status, color: 'bg-gray-500' };
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      apartment: 'Apartamento',
      house: 'Casa',
      commercial: 'Comercial',
      land: 'Terreno',
      rural: 'Rural',
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-petroleum mb-4" />
        <p className="text-muted-foreground">Carregando detalhes do imóvel...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h3 className="text-xl font-semibold mb-1">Imóvel não encontrado</h3>
        <p className="text-muted-foreground mb-4">
          O imóvel solicitado não foi encontrado ou você não tem acesso a ele.
        </p>
        <Button onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(property.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            {property.image_url ? (
              <div className="h-64 w-full">
                <img 
                  src={property.image_url} 
                  alt={property.title}
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-dark-blue-100 to-dark-blue-200 flex items-center justify-center">
                <Home className="h-24 w-24 text-white/50" />
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className={`${statusConfig.color} text-white`}>
                    {statusConfig.label}
                  </Badge>
                  <CardTitle className="text-2xl mt-2">{property.title}</CardTitle>
                </div>
                <div className="text-xl font-bold text-petroleum">
                  {formatCurrency(property.value)}
                  <div className="text-xs text-muted-foreground font-normal">
                    {property.status === 'available' || property.status === 'sold' ? 'Valor de venda' : 'Valor do aluguel'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {property.address}, {property.city}, {property.state}
                {property.zip_code && ` - ${property.zip_code}`}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg mb-2">Descrição</h3>
                <p className="text-muted-foreground">
                  {property.description || "Sem descrição disponível."}
                </p>
              </div>
              
              {/* Map section */}
              <div>
                <h3 className="font-medium text-lg mb-2">Localização</h3>
                <PropertyMap 
                  address={property.address}
                  city={property.city}
                  state={property.state}
                />
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Características</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Tipo</div>
                      <div className="text-sm text-muted-foreground">
                        {getPropertyTypeLabel(property.type)}
                      </div>
                    </div>
                  </div>
                  
                  {property.area && (
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Área</div>
                        <div className="text-sm text-muted-foreground">{property.area} m²</div>
                      </div>
                    </div>
                  )}
                  
                  {property.bedrooms && (
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Quartos</div>
                        <div className="text-sm text-muted-foreground">{property.bedrooms}</div>
                      </div>
                    </div>
                  )}
                  
                  {property.bathrooms && (
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Banheiros</div>
                        <div className="text-sm text-muted-foreground">{property.bathrooms}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">ID do imóvel</div>
                <div className="font-mono text-sm">{property.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Criado em</div>
                <div>{formatDate(property.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Atualizado em</div>
                <div>{formatDate(property.updated_at)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o imóvel "{property.title}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>Excluir</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
