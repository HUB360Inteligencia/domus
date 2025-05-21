import { useState } from 'react';
import { 
  Building, ArrowLeft, Edit, Trash2, Home, MapPin, Square, Bed, Bath, 
  Loader2, AlertTriangle, Calendar, Users, Building2, Receipt, Plus
} from 'lucide-react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PropertyMap } from './property-map';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExpenseAnalyticsDisplay } from './expense-analytics';
import { ExpenseForm } from './expense-form';
import { ExpenseList } from './expense-list';
import { ReceiptUpload } from './receipt-upload';
import { usePropertyExpenses } from '@/hooks/use-property-expenses';
import { PropertyExpense, PropertyExpenseFormData } from '@/types/property-expense';

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

  // New state for expense management
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PropertyExpense | null>(null);

  const propertyId = property?.id || null;

  const {
    expenses,
    analytics,
    isLoadingExpenses,
    isCreating,
    isUpdating,
    isDeleting: isDeletingExpense,
    isUploading,
    createExpense,
    updateExpense,
    deleteExpense,
    uploadReceipt
  } = usePropertyExpenses(propertyId);

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', {
      style: 'currency', 
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch (e) {
      return '-';
    }
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

  // Expense form handlers
  const handleAddExpenseClick = () => {
    setSelectedExpense(null);
    setShowExpenseForm(true);
  };

  const handleEditExpenseClick = (expense: PropertyExpense) => {
    setSelectedExpense(expense);
    setShowExpenseForm(true);
  };

  const handleExpenseFormSubmit = (data: PropertyExpenseFormData) => {
    if (selectedExpense) {
      updateExpense({
        id: selectedExpense.id,
        data
      });
    } else {
      createExpense(data);
    }
    setShowExpenseForm(false);
  };

  const handleCancelExpenseForm = () => {
    setShowExpenseForm(false);
    setSelectedExpense(null);
  };

  // Receipt upload handlers
  const handleUploadReceiptClick = (expense: PropertyExpense) => {
    setSelectedExpense(expense);
    setShowReceiptUpload(true);
  };

  const handleCancelReceiptUpload = () => {
    setShowReceiptUpload(false);
    setSelectedExpense(null);
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
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
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

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="space-y-6">
            {/* Expense Analytics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Análise de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseAnalyticsDisplay analytics={analytics} />
              </CardContent>
            </Card>

            {/* Expense List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Histórico de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseList
                  expenses={expenses}
                  isLoading={isLoadingExpenses}
                  onAddClick={handleAddExpenseClick}
                  onEditClick={handleEditExpenseClick}
                  onDeleteClick={handleDeleteExpense}
                  onUploadReceiptClick={handleUploadReceiptClick}
                  isDeleting={isDeletingExpense}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? 'Editar Despesa' : 'Adicionar Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          
          {propertyId && (
            <ExpenseForm
              propertyId={propertyId}
              expense={selectedExpense}
              onSubmit={handleExpenseFormSubmit}
              isSubmitting={isCreating || isUpdating}
              onCancel={handleCancelExpenseForm}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Upload Dialog */}
      <Dialog open={showReceiptUpload} onOpenChange={setShowReceiptUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense?.receipt_url 
                ? 'Visualizar/Alterar Comprovante' 
                : 'Anexar Comprovante'}
            </DialogTitle>
            <DialogDescription>
              Envie uma imagem ou PDF do comprovante de pagamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <ReceiptUpload
              expenseId={selectedExpense.id}
              currentUrl={selectedExpense.receipt_url}
              onUpload={uploadReceipt}
              isUploading={isUploading}
              onCancel={handleCancelReceiptUpload}
            />
          )}
        </DialogContent>
      </Dialog>
      
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
