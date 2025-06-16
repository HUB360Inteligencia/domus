
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Filter } from 'lucide-react';
import { PropertyAnalyticsFilters } from '@/api/property-analytics';

interface FilterOptions {
  cities: string[];
  neighborhoods: string[];
  types: string[];
  statuses: string[];
}

interface PropertyFiltersProps {
  filters: PropertyAnalyticsFilters;
  filterOptions: FilterOptions;
  onFiltersChange: (filters: Partial<PropertyAnalyticsFilters>) => void;
  onClearFilters: () => void;
}

export function PropertyFilters({ 
  filters, 
  filterOptions, 
  onFiltersChange, 
  onClearFilters 
}: PropertyFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h3 className="text-sm font-medium">Filtros de Propriedades</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="ml-auto h-8 px-2 lg:px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Cidade */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-xs">Cidade</Label>
            <Select
              value={filters.city || ''}
              onValueChange={(value) => onFiltersChange({ city: value || undefined })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as cidades</SelectItem>
                {filterOptions.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="neighborhood" className="text-xs">Bairro</Label>
            <Select
              value={filters.neighborhood || ''}
              onValueChange={(value) => onFiltersChange({ neighborhood: value || undefined })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os bairros</SelectItem>
                {filterOptions.neighborhoods.map((neighborhood) => (
                  <SelectItem key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-xs">Tipo</Label>
            <Select
              value={filters.propertyType || ''}
              onValueChange={(value) => onFiltersChange({ propertyType: value || undefined })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {filterOptions.types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs">Status</Label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => onFiltersChange({ status: value || undefined })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {filterOptions.statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ROI Mínimo */}
          <div className="space-y-2">
            <Label htmlFor="minROI" className="text-xs">ROI Mín (%)</Label>
            <Input
              id="minROI"
              type="number"
              step="0.1"
              placeholder="0"
              value={filters.minROI || ''}
              onChange={(e) => onFiltersChange({ 
                minROI: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              className="h-8"
            />
          </div>

          {/* ROI Máximo */}
          <div className="space-y-2">
            <Label htmlFor="maxROI" className="text-xs">ROI Máx (%)</Label>
            <Input
              id="maxROI"
              type="number"
              step="0.1"
              placeholder="100"
              value={filters.maxROI || ''}
              onChange={(e) => onFiltersChange({ 
                maxROI: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              className="h-8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
