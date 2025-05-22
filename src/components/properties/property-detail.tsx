import { useState, useEffect } from 'react';
import { Building, ArrowLeft, Edit, Trash2, Home, MapPin, Square, Bed, Bath, Loader2, AlertTriangle, Calendar, Users, Building2, CheckSquare, Plus } from 'lucide-react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PropertyMap } from './property-map';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useActivities } from '@/hooks/use-activities';
import { useNavigate } from 'react-router-dom';
import { Activity } from '@/types/activity';

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
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const navigate = useNavigate();

  // Use the activities hook to fetch activities for this property
  const { propertyActivities, isLoadingPropertyActivities } = useActivities(
    property?.id || null
  );

  // Separate activities into pending and history (completed/cancelled)
  const pendingActivities = propertyActivities.filter(
    activity => ['pending', 'in_progress'].includes(activity.status)
  );
  
  const historicalActivities = propertyActivities.filter(
    activity => ['completed', 'cancelled'].includes(activity.status)
  );

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const handleViewActivity = (activityId: string) => {
    navigate(`/activities/detail?id=${activityId}`);
  };

  const handleCreateActivity = () => {
    navigate(`/activities/new?property_id=${property?.id}&date=${new Date().toISOString().split('T')[0]}`);
  };

  // Function to format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
      return '-';
    }
  };

  // Function to format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', {
      style: 'currency', 
      currency: 'BRL',
    });
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

  const getActivityStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', color: 'bg-yellow-500' };
      case 'in_progress':
        return { label: 'Em Progresso', color: 'bg-blue-500' };
      case 'completed':
        return { label: 'Concluída', color: 'bg-green-500' };
      case 'cancelled':
        return { label: 'Cancelada', color: 'bg-red-500' };
      default:
        return { label: status, color: 'bg-gray-500' };
    }
  };

  const getActivityPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'low':
        return { label: 'Baixa', color: 'bg-blue-500' };
      case 'medium':
        return { label: 'Média', color: 'bg-yellow-500' };
      case 'high':
        return { label: 'Alta', color: 'bg-red-500' };
      default:
        return { label: priority, color: 'bg-gray-500' };
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

  // Component to render an activity card
  const ActivityItem = ({ activity }: { activity: Activity }) => {
    const statusConfig = getActivityStatusConfig(activity.status);
    const priorityConfig = getActivityPriorityConfig(activity.priority);
    
    return (
      <div 
        className="border rounded-md p-4 mb-3 hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => handleViewActivity(activity.id)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">{activity.title}</h4>
          <div className="flex space-x-2">
            <Badge className={statusConfig.color + " text-white"}>{statusConfig.label}</Badge>
            <Badge className={priorityConfig.color + " text-white"}>{priorityConfig.label}</Badge>
          </div>
        </div>
        
        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{activity.description}</p>
        )}
        
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {activity.due_date ? formatDate(activity.due_date) : 'Sem prazo'}
          </div>
          
          {activity.responsible_name && (
            <div>Resp: {activity.responsible_name}</div>
          )}
        </div>
      </div>
    );
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

  // Check if the property has coordinates
  const hasCoordinates = 
    property.latitude !== undefined && 
    property.latitude !== null && 
    property.longitude !== undefined && 
    property.longitude !== null;

  // If property has coordinates, use them
  const initialCoords = hasCoordinates 
    ? { lat: Number(property.latitude), lng: Number(property.longitude) } 
    : null;

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

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="details">Detalhes do Imóvel</TabsTrigger>
          <TabsTrigger value="purchase">Dados de Compra</TabsTrigger>
          <TabsTrigger value="rental">Dados do Locatário</TabsTrigger>
          <TabsTrigger value="agency">Dados da Imobiliária</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
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
                  
                  {/* Map section with edit location functionality */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-lg">Localização</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditingLocation(!isEditingLocation)}
                      >
                        {isEditingLocation ? 'Concluir Edição' : 'Ajustar Localização'}
                      </Button>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <PropertyMap 
                        address={property.address}
                        city={property.city}
                        state={property.state}
                        propertyId={property.id}
                        initialCoords={initialCoords}
                        editable={isEditingLocation}
                      />
                    </div>
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
                      
                      {property.square_meter_value && (
                        <div className="flex items-center">
                          <Square className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">Valor do m²</div>
                            <div className="text-sm text-muted-foreground">{formatCurrency(property.square_meter_value)}</div>
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
                  {hasCoordinates && (
                    <div>
                      <div className="text-sm text-muted-foreground">Coordenadas</div>
                      <div className="font-mono text-xs break-all">
                        {property.latitude}, {property.longitude}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="purchase">
          <Card>
            <CardHeader>
              <CardTitle>Dados de Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium">Data de Compra</h3>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="text-muted-foreground">
                      {property.purchase_date ? formatDate(property.purchase_date) : "Não informado"}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Valor de Compra</h3>
                  <div className="flex items-center mt-1">
                    <div className="text-petroleum font-semibold">
                      {property.purchase_value ? formatCurrency(property.purchase_value) : "Não informado"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rental">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Locatário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.status === 'rented' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium">Nome do Locatário</h3>
                    <div className="flex items-center mt-1">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="text-muted-foreground">
                        {property.tenant_name || "Não informado"}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Contato do Locatário</h3>
                    <div className="flex items-center mt-1">
                      <div className="text-muted-foreground">
                        {property.tenant_contact || "Não informado"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Este imóvel não está alugado atualmente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agency">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Imobiliária</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.agency_name || property.agency_responsible || property.agency_contact ? (
                <div className="grid grid-cols-1 gap-6">
                  {property.agency_name && (
                    <div>
                      <h3 className="text-sm font-medium">Nome da Imobiliária</h3>
                      <div className="flex items-center mt-1">
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="text-muted-foreground">
                          {property.agency_name}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {property.agency_responsible && (
                      <div>
                        <h3 className="text-sm font-medium">Responsável na Imobiliária</h3>
                        <div className="flex items-center mt-1">
                          <div className="text-muted-foreground">
                            {property.agency_responsible}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {property.agency_contact && (
                      <div>
                        <h3 className="text-sm font-medium">Contato da Imobiliária</h3>
                        <div className="flex items-center mt-1">
                          <div className="text-muted-foreground">
                            {property.agency_contact}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Não há dados da imobiliária cadastrados para este imóvel.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Atividades do Imóvel</h3>
              <Button onClick={handleCreateActivity}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </div>
            
            {isLoadingPropertyActivities ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-petroleum mr-2" />
                <p>Carregando atividades...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pending Activities */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <CheckSquare className="h-5 w-5 mr-2 text-yellow-500" />
                      Atividades Pendentes
                      {pendingActivities.length > 0 && (
                        <Badge className="ml-2">{pendingActivities.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingActivities.length > 0 ? (
                      <div className="space-y-2">
                        {pendingActivities.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-6">
                        Não há atividades pendentes para este imóvel.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Historical Activities */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <CheckSquare className="h-5 w-5 mr-2 text-green-500" />
                      Histórico de Atividades
                      {historicalActivities.length > 0 && (
                        <Badge className="ml-2">{historicalActivities.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historicalActivities.length > 0 ? (
                      <div className="space-y-2">
                        {historicalActivities.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-6">
                        Não há histórico de atividades para este imóvel.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
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
