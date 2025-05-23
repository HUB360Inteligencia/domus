
import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Contract } from "@/types/contract";

export type FilterOptions = {
  searchTerm: string;
  status: string[];
  city: string;
  neighborhood: string;
  propertyType: string;
  minValue: number | null;
  maxValue: number | null;
  dateRange: DateRange | undefined;
  tags: string[];
};

interface ContractFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  contracts: Contract[];
}

export function ContractFilters({ onFilterChange, contracts }: ContractFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    status: [],
    city: "",
    neighborhood: "",
    propertyType: "",
    minValue: null,
    maxValue: null,
    dateRange: undefined,
    tags: [],
  });

  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  
  // Extract unique cities, neighborhoods, property types from contracts
  const cities = [...new Set(contracts.map(c => c.property?.city).filter(Boolean))];
  const neighborhoods = [...new Set(contracts.map(c => c.property?.neighborhood).filter(Boolean))];
  
  // Extract unique property types
  const propertyTypes = [...new Set(contracts
    .filter(c => c.property)
    .map(c => c.property?.type)
    .filter(Boolean))];
  
  // Extract unique tags from properties
  const allTags = contracts
    .filter(c => c.property && c.property.tags)
    .flatMap(c => c.property?.tags || [])
    .filter(Boolean);
  
  const uniqueTags = [...new Set(allTags)];
  
  // Get min and max values from contracts
  const allValues = contracts.map(c => c.value);
  const minContractValue = Math.min(...allValues);
  const maxContractValue = Math.max(...allValues);
  
  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange("searchTerm", e.target.value);
  };
  
  // Handle status change
  const handleStatusChange = (status: string) => {
    const updatedStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    handleFilterChange("status", updatedStatuses);
  };
  
  // Handle tag selection
  const handleTagChange = (tag: string) => {
    const updatedTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    handleFilterChange("tags", updatedTags);
  };
  
  // Handle reset filters
  const resetFilters = () => {
    const resetFiltersState: FilterOptions = {
      searchTerm: "",
      status: [],
      city: "",
      neighborhood: "",
      propertyType: "",
      minValue: null,
      maxValue: null,
      dateRange: undefined,
      tags: [],
    };
    
    setFilters(resetFiltersState);
    onFilterChange(resetFiltersState);
    setShowFiltersPopover(false);
  };
  
  // Count active filters
  const activeFilterCount = [
    filters.city,
    filters.neighborhood,
    filters.propertyType,
    filters.minValue !== null || filters.maxValue !== null,
    filters.dateRange?.from,
    filters.status.length > 0,
    filters.tags.length > 0,
  ].filter(Boolean).length;
  
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar contratos..."
          className="pl-8 w-full bg-background"
          value={filters.searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      
      <Popover open={showFiltersPopover} onOpenChange={setShowFiltersPopover}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 sm:w-96">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground" 
                onClick={resetFilters}
              >
                Limpar filtros
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Status do contrato</Label>
              <div className="flex flex-wrap gap-2">
                {["active", "pending", "expired", "canceled", "draft"].map((status) => (
                  <Badge
                    key={status}
                    variant={filters.status.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleStatusChange(status)}
                  >
                    {status === "active"
                      ? "Ativo"
                      : status === "pending"
                      ? "Pendente"
                      : status === "expired"
                      ? "Expirado"
                      : status === "canceled"
                      ? "Cancelado"
                      : "Rascunho"}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select
                value={filters.city}
                onValueChange={(value) => handleFilterChange("city", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as cidades</SelectItem>
                  {cities.map((city) => (
                    city && <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Select
                value={filters.neighborhood}
                onValueChange={(value) => handleFilterChange("neighborhood", value)}
                disabled={!filters.city}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os bairros</SelectItem>
                  {neighborhoods
                    .filter(n => !filters.city || contracts.some(c => 
                      c.property?.neighborhood === n && c.property?.city === filters.city))
                    .map((neighborhood) => (
                      neighborhood && <SelectItem key={neighborhood} value={neighborhood}>{neighborhood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de imóvel</Label>
              <Select
                value={filters.propertyType}
                onValueChange={(value) => handleFilterChange("propertyType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {propertyTypes.map((type) => (
                    type && <SelectItem key={type} value={type}>
                      {type === 'apartment' ? 'Apartamento' :
                       type === 'house' ? 'Casa' :
                       type === 'commercial' ? 'Comercial' :
                       type === 'land' ? 'Terreno' :
                       type === 'rural' ? 'Rural' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Valor do contrato</Label>
                <span className="text-sm text-muted-foreground">
                  {filters.minValue ? `R$${filters.minValue}` : 'Min'} - 
                  {filters.maxValue ? `R$${filters.maxValue}` : 'Max'}
                </span>
              </div>
              <div className="pt-4">
                <Slider
                  defaultValue={[minContractValue, maxContractValue]}
                  min={minContractValue}
                  max={maxContractValue}
                  step={(maxContractValue - minContractValue) / 100}
                  onValueChange={(values) => {
                    handleFilterChange("minValue", values[0]);
                    handleFilterChange("maxValue", values[1]);
                  }}
                  className="mb-6"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Período</Label>
              <DateRangePicker
                value={filters.dateRange}
                onChange={(range) => handleFilterChange("dateRange", range)}
                placeholder="Selecionar período"
              />
            </div>
            
            {uniqueTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {uniqueTags.map((tag) => (
                    tag && (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTagChange(tag)}
                      >
                        {tag}
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowFiltersPopover(false)}
              >
                Aplicar filtros
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
