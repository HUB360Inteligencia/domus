
import { useState, useEffect } from 'react';
import { Building, Search, Plus, Loader2, Filter, AlertCircle, LayoutGrid, LayoutList, Map as MapIcon } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/property-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface PropertyListProps {
  properties: Property[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export function PropertyList({ properties, isLoading, onSelect, onAddNew }: PropertyListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'map'>('card');
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check authentication status
  useEffect(() => {
    console.log('Auth status:', { isAuthenticated: !!user, userId: user?.id });
    
    if (!user) {
      setError('Não autenticado. Por favor, faça login para ver seus imóveis.');
    }
  }, [user]);

  // Filter properties based on search and filters
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = searchTerm
      ? property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesType = filterType ? property.type === filterType : true;
    const matchesStatus = filterStatus ? property.status === filterStatus : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency', 
      currency: 'BRL',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-petroleum mb-4" />
        <p className="text-muted-foreground">Carregando imóveis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
        <h2 className="text-3xl font-bold">Imóveis</h2>
        <Button onClick={onAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Imóvel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar imóveis..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType || "all"} onValueChange={(value) => setFilterType(value === "all" ? null : value)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="apartment">Apartamento</SelectItem>
              <SelectItem value="house">Casa</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="land">Terreno</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filterStatus || "all"} onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="rented">Alugado</SelectItem>
              <SelectItem value="airbnb">Airbnb</SelectItem>
              <SelectItem value="maintenance">Em manutenção</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-center mb-2">
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'card' | 'list' | 'map')}>
          <ToggleGroupItem value="card" aria-label="View as cards">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="View as list">
            <LayoutList className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="map" aria-label="View as map">
            <MapIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {filteredProperties.length > 0 ? (
        <>
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  address={property.address}
                  city={property.city}
                  state={property.state}
                  type={property.type}
                  status={property.status as any}
                  value={property.value}
                  imageUrl={property.image_url}
                  onSelect={() => onSelect(property.id)}
                />
              ))}
            </div>
          )}
          
          {viewMode === 'list' && (
            <div className="space-y-4 mt-6">
              {filteredProperties.map((property) => (
                <PropertyListItem 
                  key={property.id}
                  property={property}
                  onClick={() => onSelect(property.id)}
                />
              ))}
            </div>
          )}
          
          {viewMode === 'map' && (
            <div className="h-[600px] mt-6 bg-muted rounded-xl">
              <PropertyMapView 
                properties={filteredProperties}
                onSelect={onSelect}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg">
          <Building className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-1">Nenhum imóvel encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {properties.length === 0
              ? 'Comece adicionando seu primeiro imóvel!'
              : 'Tente ajustar seus filtros de busca.'}
          </p>
          {properties.length === 0 && (
            <Button onClick={onAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Imóvel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface PropertyListItemProps {
  property: Property;
  onClick: () => void;
}

function PropertyListItem({ property, onClick }: PropertyListItemProps) {
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency', 
      currency: 'BRL',
    });
  };

  const statusConfig = getStatusConfig(property.status);

  return (
    <div 
      onClick={onClick}
      className="flex items-center border rounded-lg p-4 hover:border-primary cursor-pointer transition-all"
    >
      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 mr-4 bg-muted">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{property.title}</h3>
            <p className="text-sm text-muted-foreground">{property.address}, {property.city}, {property.state}</p>
          </div>
          <div className="text-right">
            <div className="font-bold">{formatCurrency(property.value)}</div>
            <span className={`inline-block px-2 py-1 text-xs rounded-full text-white ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PropertyMapViewProps {
  properties: Property[];
  onSelect: (id: string) => void;
}

// Placeholder for the map view component - we'll implement this soon
function PropertyMapView({ properties, onSelect }: PropertyMapViewProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <MapIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p>Mapa carregando...</p>
        <p className="text-sm text-muted-foreground">Visualização em mapa será implementada em breve.</p>
      </div>
    </div>
  );
}
