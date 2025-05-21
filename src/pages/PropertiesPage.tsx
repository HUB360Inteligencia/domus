
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Building, Home, MoreHorizontal } from "lucide-react";
import { useProperties } from "@/hooks/use-properties";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/property-card";

export default function PropertiesPage() {
  const navigate = useNavigate();
  const { properties, isLoading } = useProperties();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProperties = properties.filter(
    (property) =>
      (typeFilter === "all" || property.type === typeFilter) &&
      (statusFilter === "all" || property.status === statusFilter) &&
      (property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
       property.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleViewProperty = (id: string) => {
    navigate(`/properties/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Imóveis"
          description="Gerencie seu portfólio de imóveis"
        />
        <Button
          className="flex items-center gap-2"
          onClick={() => navigate("/properties/new")}
        >
          <Plus className="h-4 w-4" /> Novo Imóvel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóveis..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="apartment">Apartamento</SelectItem>
            <SelectItem value="house">Casa</SelectItem>
            <SelectItem value="commercial">Comercial</SelectItem>
            <SelectItem value="land">Terreno</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="rented">Alugado</SelectItem>
            <SelectItem value="sold">Vendido</SelectItem>
            <SelectItem value="maintenance">Em Manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="opacity-70 animate-pulse">
              <div className="h-48 bg-muted"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-5 bg-muted rounded w-1/3 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md border-dashed">
          <Building className="h-10 w-10 text-muted-foreground/60 mb-2" />
          <p className="text-muted-foreground mb-4">Nenhum imóvel encontrado.</p>
          <Button onClick={() => navigate("/properties/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar imóvel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              title={property.title}
              address={property.address}
              city={property.city}
              state={property.state}
              type={property.type}
              status={property.status}
              value={property.value}
              imageUrl={property.image_url}
              onSelect={handleViewProperty}
            />
          ))}
        </div>
      )}
    </div>
  );
}
