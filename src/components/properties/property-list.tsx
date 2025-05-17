
import { useState } from 'react';
import { Building, Search, Plus, Loader2, Filter } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/property-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
          <Select value={filterType || ''} onValueChange={(value) => setFilterType(value || null)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              <SelectItem value="apartment">Apartamento</SelectItem>
              <SelectItem value="house">Casa</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="land">Terreno</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filterStatus || ''} onValueChange={(value) => setFilterStatus(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="rented">Alugado</SelectItem>
              <SelectItem value="airbnb">Airbnb</SelectItem>
              <SelectItem value="maintenance">Em manutenção</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProperties.length > 0 ? (
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
