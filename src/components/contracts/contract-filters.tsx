
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import { Contract } from "@/types/contract";
import { formatCurrency } from "@/lib/format";

export interface FilterOptions {
  searchTerm: string;
  status: string[];
  city: string;
  neighborhood: string;
  propertyType: string;
  minValue: number | null;
  maxValue: number | null;
  dateRange: DateRange | undefined;
  tags: string[];
}

interface ContractFiltersProps {
  onFilterChange: (options: FilterOptions) => void;
  contracts: Contract[];
}

export function ContractFilters({ onFilterChange, contracts }: ContractFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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

  // Count of active filters
  const activeFilterCount = Object.values(filters).reduce((count, value) => {
    if (Array.isArray(value) && value.length > 0) return count + 1;
    if (value && typeof value === "object" && (value as DateRange).from) return count + 1;
    if (value && typeof value !== "object" && value !== "") return count + 1;
    return count;
  }, 0);

  // Get unique values for filters from contracts
  const cities = Array.from(new Set(contracts.map(c => c.property?.city).filter(Boolean) as string[])).sort();
  const neighborhoods = Array.from(new Set(contracts.map(c => c.property?.neighborhood).filter(Boolean) as string[])).sort();
  const propertyTypes = Array.from(new Set(contracts.map(c => c.property?.type).filter(Boolean) as string[])).sort();
  const statuses = Array.from(new Set(contracts.map(c => c.status)));
  const allTags = Array.from(new Set(contracts.flatMap(c => c.property?.tags || []).filter(Boolean))).sort();
  
  // Calculate min and max values for slider
  const contractValues = contracts.map(c => c.value).filter(v => v !== null && v !== undefined) as number[];
  const minContractValue = contractValues.length > 0 ? Math.min(...contractValues) : 0;
  const maxContractValue = contractValues.length > 0 ? Math.max(...contractValues) : 5000;
  
  // Find appropriate step size based on value range
  const valueRange = maxContractValue - minContractValue;
  const stepSize = valueRange > 10000 ? 500 : valueRange > 5000 ? 250 : valueRange > 1000 ? 100 : 50;

  // Update range values for slider
  const [valueRange, setValueRange] = useState<[number, number]>([
    filters.minValue !== null ? filters.minValue : minContractValue,
    filters.maxValue !== null ? filters.maxValue : maxContractValue,
  ]);

  // When contracts change, reset value range if needed
  useEffect(() => {
    setValueRange([
      filters.minValue !== null ? filters.minValue : minContractValue,
      filters.maxValue !== null ? filters.maxValue : maxContractValue,
    ]);
  }, [contracts, filters.minValue, filters.maxValue, minContractValue, maxContractValue]);

  // Status options for multiple select
  const statusOptions = statuses.map(status => ({
    label: 
      status === "active" ? "Ativo" : 
      status === "pending" ? "Pendente" : 
      status === "expired" ? "Expirado" : 
      status === "canceled" ? "Cancelado" : 
      status === "draft" ? "Rascunho" : 
      status,
    value: status,
  }));
  
  // Tag options for multiple select
  const tagOptions = allTags.map(tag => ({
    label: tag,
    value: tag,
  }));

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange("searchTerm", e.target.value);
  };

  // Handle value range change from slider
  const handleRangeChange = (newRange: [number, number]) => {
    setValueRange(newRange);
    handleFilterChange("minValue", newRange[0]);
    handleFilterChange("maxValue", newRange[1]);
  };

  // Clear all filters
  const clearFilters = () => {
    const resetFilters = {
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
    setFilters(resetFilters);
    setValueRange([minContractValue, maxContractValue]);
    onFilterChange(resetFilters);
  };

  // Clear individual filter
  const clearFilter = (key: keyof FilterOptions) => {
    const newFilters = { ...filters };
    if (Array.isArray(newFilters[key])) {
      newFilters[key] = [];
    } else if (key === "dateRange") {
      newFilters[key] = undefined;
    } else if (key === "minValue" || key === "maxValue") {
      newFilters[key] = null;
      if (key === "minValue") setValueRange([minContractValue, valueRange[1]]);
      if (key === "maxValue") setValueRange([valueRange[0], maxContractValue]);
    } else {
      newFilters[key] = "";
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar contratos..."
            className="pl-10"
            value={filters.searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="relative"
            onClick={() => setIsFiltersOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <Badge variant="outline" className="flex items-center gap-1">
              Termo: {filters.searchTerm}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("searchTerm")}
              />
            </Badge>
          )}
          {filters.status.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              Status: {filters.status.length} selecionados
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("status")}
              />
            </Badge>
          )}
          {filters.city && (
            <Badge variant="outline" className="flex items-center gap-1">
              Cidade: {filters.city}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("city")}
              />
            </Badge>
          )}
          {filters.neighborhood && (
            <Badge variant="outline" className="flex items-center gap-1">
              Bairro: {filters.neighborhood}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("neighborhood")}
              />
            </Badge>
          )}
          {filters.propertyType && (
            <Badge variant="outline" className="flex items-center gap-1">
              Tipo: {filters.propertyType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("propertyType")}
              />
            </Badge>
          )}
          {(filters.minValue !== null || filters.maxValue !== null) && (
            <Badge variant="outline" className="flex items-center gap-1">
              Valor: {formatCurrency(filters.minValue || 0)} - {formatCurrency(filters.maxValue || maxContractValue)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  clearFilter("minValue");
                  clearFilter("maxValue");
                }}
              />
            </Badge>
          )}
          {filters.dateRange?.from && (
            <Badge variant="outline" className="flex items-center gap-1">
              Período
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("dateRange")}
              />
            </Badge>
          )}
          {filters.tags.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              Tags: {filters.tags.length} selecionadas
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => clearFilter("tags")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Filter sheet for mobile */}
      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtrar Contratos</SheetTitle>
            <SheetDescription>
              Refine sua busca usando os filtros abaixo
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            <Accordion type="multiple" defaultValue={["status", "location", "value", "date"]}>
              <AccordionItem value="status">
                <AccordionTrigger>Status do Contrato</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <MultiSelect
                      options={statusOptions}
                      selected={filters.status}
                      onChange={(values) => handleFilterChange("status", values)}
                      placeholder="Selecionar status"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="location">
                <AccordionTrigger>Localização</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Select
                        value={filters.city}
                        onValueChange={(value) => handleFilterChange("city", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar cidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas as cidades</SelectItem>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Select
                        value={filters.neighborhood}
                        onValueChange={(value) =>
                          handleFilterChange("neighborhood", value)
                        }
                        disabled={!filters.city}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar bairro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os bairros</SelectItem>
                          {neighborhoods
                            .filter(n => {
                              if (!filters.city) return true;
                              return contracts.some(
                                c => c.property?.city === filters.city && c.property?.neighborhood === n
                              );
                            })
                            .map((neighborhood) => (
                              <SelectItem key={neighborhood} value={neighborhood}>
                                {neighborhood}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="property">
                <AccordionTrigger>Tipo de Imóvel</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={filters.propertyType}
                      onValueChange={(value) =>
                        handleFilterChange("propertyType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os tipos</SelectItem>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
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
                  
                  <div className="mt-4 space-y-2">
                    <Label>Tags</Label>
                    <MultiSelect
                      options={tagOptions}
                      selected={filters.tags}
                      onChange={(values) => handleFilterChange("tags", values)}
                      placeholder="Selecionar tags"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="value">
                <AccordionTrigger>Valor</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <div>
                      <div className="mb-4 flex justify-between">
                        <span>{formatCurrency(valueRange[0])}</span>
                        <span>{formatCurrency(valueRange[1])}</span>
                      </div>
                      <Slider
                        min={minContractValue}
                        max={maxContractValue}
                        step={stepSize}
                        value={valueRange}
                        onValueChange={(values) => setValueRange(values as [number, number])}
                        onValueCommit={(values) => handleRangeChange(values as [number, number])}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="date">
                <AccordionTrigger>Período</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <DateRangePicker
                      value={filters.dateRange}
                      onChange={(range) => handleFilterChange("dateRange", range)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => setIsFiltersOpen(false)}>
              Aplicar Filtros ({activeFilterCount})
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
