import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Calendar, Edit, Trash2, Loader2, Plus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { Property, FurnishedStatus, PropertyStatus } from '@/types/property';
import { ExpenseList } from '@/components/properties/expense-list';
import { PropertyActivities } from '@/components/activities/property-activities';

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
  isDeleting
}: PropertyDetailProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [isExpensesDeleting, setIsExpensesDeleting] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);
  const [isUploadReceiptDialogOpen, setIsUploadReceiptDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: PropertyStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'rented':
        return <Badge className="bg-blue-500 text-white">Alugado</Badge>;
      case 'sold':
        return <Badge className="bg-green-500 text-white">Vendido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFurnishedBadge = (furnished: FurnishedStatus) => {
    switch (furnished) {
      case 'furnished':
        return <Badge variant="outline">Mobiliado</Badge>;
      case 'partially_furnished':
        return <Badge variant="secondary">Semi-mobiliado</Badge>;
      case 'not_furnished':
        return <Badge>Não mobiliado</Badge>;
      default:
        return <Badge>{furnished}</Badge>;
    }
  };
  
  // Determine se a aba de despesas está ativa
  const isExpensesTabActive = activeTab === 'expenses';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{property?.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isDeleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : 'Excluir'}
          </Button>
        </div>
      </div>
      
      {isLoading || !property ? (
        <div className="flex items-center justify-center p-8 border rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Carregando detalhes do imóvel...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Detalhes</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                {property.address}, {property.property_number} - {property.neighborhood}, {property.city} - {property.state}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Cadastrado em: {formatDate(property.created_at)}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Informações Adicionais</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tipo</TableCell>
                    <TableCell>{property.type}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Valor</TableCell>
                    <TableCell>{formatCurrency(property.value)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mobiliado</TableCell>
                    <TableCell>{getFurnishedBadge(property.furnished)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <Tabs defaultValue="info" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="location">Localização</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Descrição</h3>
                <p className="text-sm text-muted-foreground">{property.description || 'Nenhuma descrição fornecida.'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium">Detalhes Adicionais</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Quartos</TableCell>
                        <TableCell>{property.bedrooms || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Banheiros</TableCell>
                        <TableCell>{property.bathrooms || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Garagem</TableCell>
                        <TableCell>{property.garage_spots || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Área (m²)</TableCell>
                        <TableCell>{property.area || 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Informações Financeiras</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Valor de Compra</TableCell>
                        <TableCell>{property.purchase_value ? formatCurrency(property.purchase_value) : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Data de Compra</TableCell>
                        <TableCell>{property.purchase_date ? formatDate(property.purchase_date) : 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Taxa de Condomínio</TableCell>
                        <TableCell>{property.condo_fee ? formatCurrency(property.condo_fee) : 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="expenses" className="space-y-6">
              <ExpenseList
                expenses={[]}
                isLoading={false}
                onAddClick={() => {}}
                onEditClick={() => {}}
                onDeleteClick={() => {}}
                onUploadReceiptClick={() => {}}
                isDeleting={false}
              />
            </TabsContent>
            
            <TabsContent value="activities" className="space-y-6">
              {property && <PropertyActivities propertyId={property.id} />}
            </TabsContent>
            
            <TabsContent value="location" className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Localização</h3>
                <p className="text-sm text-muted-foreground">
                  Latitude: {property.latitude || 'N/A'}, Longitude: {property.longitude || 'N/A'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
