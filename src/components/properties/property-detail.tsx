
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BuildingIcon, 
  MapPinIcon, 
  BedDoubleIcon, 
  BathIcon, 
  SquareIcon,
  EditIcon,
  TrashIcon,
  FileEditIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePropertyQueries } from '@/hooks/use-property-queries';
import { usePropertyMutations } from '@/hooks/use-property-mutations';
import { ExpenseList } from '@/components/properties/expense-list';
import { PropertyActivities } from '@/components/activities/property-activities';
import { PropertyMap } from '@/components/properties/property-map';
import { toast } from 'sonner';
import { PropertyFinances } from './property-finances';

export const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: property, isLoading, error } = usePropertyQueries().usePropertyDetails(id || '');
  const { deleteProperty } = usePropertyMutations();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Imóvel não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          O imóvel que você está procurando não existe ou foi removido.
        </p>
        <Button onClick={() => navigate('/properties')}>Voltar para a lista</Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteProperty.mutateAsync(property.id);
      toast.success('Imóvel excluído com sucesso');
      navigate('/properties');
    } catch (error) {
      toast.error('Erro ao excluir imóvel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com imagem e informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-0 aspect-video relative overflow-hidden">
            {property.image_url ? (
              <img
                src={property.image_url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <BuildingIcon className="h-20 w-20 text-muted-foreground opacity-20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{property.title}</CardTitle>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPinIcon className="h-4 w-4 mr-1" />
              {property.address}, {property.city}, {property.state}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {property.bedrooms && (
                <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-lg">
                  <BedDoubleIcon className="h-5 w-5 mb-1 text-muted-foreground" />
                  <span className="text-sm font-medium">{property.bedrooms}</span>
                  <span className="text-xs text-muted-foreground">Quartos</span>
                </div>
              )}
              
              {property.bathrooms && (
                <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-lg">
                  <BathIcon className="h-5 w-5 mb-1 text-muted-foreground" />
                  <span className="text-sm font-medium">{property.bathrooms}</span>
                  <span className="text-xs text-muted-foreground">Banheiros</span>
                </div>
              )}
              
              {property.area && (
                <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-lg">
                  <SquareIcon className="h-5 w-5 mb-1 text-muted-foreground" />
                  <span className="text-sm font-medium">{property.area}m²</span>
                  <span className="text-xs text-muted-foreground">Área</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`text-sm font-medium ${
                  property.status === 'rented' ? 'text-green-600' :
                  property.status === 'available' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {property.status === 'rented' ? 'Alugado' :
                   property.status === 'available' ? 'Disponível' :
                   property.status === 'unavailable' ? 'Indisponível' : property.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="text-sm font-medium">{property.type}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(property.value))}
                </span>
              </div>
              
              {property.condo_fee && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Condomínio:</span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(Number(property.condo_fee))}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate(`/properties/edit/${property.id}`)}
              >
                <EditIcon className="h-4 w-4 mr-1" />
                Editar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes seções */}
      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="finances">Finanças</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 pt-6">
          {/* Descrição e Características */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {property.description || "Sem descrição disponível."}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {property.features && Array.isArray(property.features) ? (
                    property.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-2 w-2 bg-primary rounded-full mr-2"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Sem características cadastradas.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-0">
              {property.latitude && property.longitude ? (
                <PropertyMap 
                  properties={[property]} 
                  center={{ lat: Number(property.latitude), lng: Number(property.longitude) }}
                  zoom={15}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <div className="text-center p-6">
                    <MapPinIcon className="h-10 w-10 text-muted-foreground opacity-20 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Este imóvel não possui coordenadas definidas.
                    </p>
                    <Button 
                      variant="link" 
                      onClick={() => navigate(`/properties/edit/${property.id}`)}
                      className="mt-2"
                    >
                      <FileEditIcon className="h-4 w-4 mr-1" />
                      Editar imóvel para adicionar localização
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6 pt-6">
          <PropertyFinances />
        </TabsContent>

        <TabsContent value="expenses" className="pt-6">
          <ExpenseList propertyId={property.id} />
        </TabsContent>

        <TabsContent value="activities" className="pt-6">
          <PropertyActivities propertyId={property.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
