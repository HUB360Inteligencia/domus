
import React from 'react';
import { CalendarIcon, Search, FilterIcon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { TransactionFilters } from '@/hooks/use-financial-transactions';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFilterChange: (filters: Partial<TransactionFilters>) => void;
  onResetFilters: () => void;
  categories?: { label: string; value: string; type?: string }[];
  properties?: { label: string; value: string }[];
}

export function TransactionFilters({
  filters,
  onFilterChange,
  onResetFilters,
  categories = [],
  properties = []
}: TransactionFiltersProps) {
  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  // More strict filtering to ensure no empty values
  const validCategories = categories.filter(cat => {
    if (!cat || !cat.value || !cat.label) {
      console.log('Filtering out invalid category:', cat);
      return false;
    }
    
    const hasValidValue = cat.value && 
                         typeof cat.value === 'string' && 
                         cat.value.trim() !== '' && 
                         cat.value !== 'undefined' &&
                         cat.value !== 'null' &&
                         cat.value !== 'empty';
                         
    const hasValidLabel = cat.label &&
                         typeof cat.label === 'string' &&
                         cat.label.trim() !== '';
    
    if (!hasValidValue || !hasValidLabel) {
      console.log('Filtering out category with invalid value/label:', cat);
      return false;
    }
    
    return true;
  });

  const validProperties = properties.filter(prop => {
    if (!prop || !prop.value || !prop.label) {
      console.log('Filtering out invalid property:', prop);
      return false;
    }
    
    const hasValidValue = prop.value && 
                         typeof prop.value === 'string' && 
                         prop.value.trim() !== '' && 
                         prop.value !== 'undefined' &&
                         prop.value !== 'null' &&
                         prop.value !== 'empty';
                         
    const hasValidLabel = prop.label &&
                         typeof prop.label === 'string' &&
                         prop.label.trim() !== '';
    
    if (!hasValidValue || !hasValidLabel) {
      console.log('Filtering out property with invalid value/label:', prop);
      return false;
    }
    
    return true;
  });

  console.log('Valid categories for filters:', validCategories);
  console.log('Valid properties for filters:', validProperties);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="text-sm font-medium">Período</label>
            <div className="flex gap-2 mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    size="sm"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(new Date(filters.startDate), "dd/MM/yyyy") : "Data Inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate ? new Date(filters.startDate) : undefined}
                    onSelect={(date) => onFilterChange({ startDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    size="sm"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(new Date(filters.endDate), "dd/MM/yyyy") : "Data Final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate ? new Date(filters.endDate) : undefined}
                    onSelect={(date) => onFilterChange({ endDate: date ? format(date, "yyyy-MM-dd") : undefined })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Transaction Type */}
          <div>
            <label className="text-sm font-medium">Tipo de Transação</label>
            <Select 
              value={filters.type?.length === 1 ? filters.type[0] : "all"} 
              onValueChange={(value) => {
                if (value === "all" || !value || value.trim() === '') {
                  onFilterChange({ type: undefined });
                } else {
                  onFilterChange({ type: [value] });
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Category */}
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <Select 
              value={filters.category?.length === 1 ? filters.category[0] : "all"} 
              onValueChange={(value) => {
                if (value === "all" || !value || value.trim() === '') {
                  onFilterChange({ category: undefined });
                } else {
                  onFilterChange({ category: [value] });
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {validCategories.length > 0 ? (
                  validCategories.map((cat) => {
                    // Additional safety check before rendering
                    if (!cat.value || cat.value.trim() === '') {
                      console.error('Attempting to render SelectItem with empty value:', cat);
                      return null;
                    }
                    return (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="no-categories" disabled>Nenhuma categoria disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Property */}
          {validProperties.length > 0 && (
            <div>
              <label className="text-sm font-medium">Propriedade</label>
              <Select 
                value={filters.propertyId || "all"} 
                onValueChange={(value) => onFilterChange({ 
                  propertyId: value === "all" || !value || value.trim() === '' ? undefined : value 
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas as propriedades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as propriedades</SelectItem>
                  {validProperties.map((prop) => {
                    // Additional safety check before rendering
                    if (!prop.value || prop.value.trim() === '') {
                      console.error('Attempting to render SelectItem with empty value:', prop);
                      return null;
                    }
                    return (
                      <SelectItem key={prop.value} value={prop.value}>{prop.label}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.startDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                De: {format(new Date(filters.startDate), "dd/MM/yyyy")}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ startDate: undefined })}
                />
              </Badge>
            )}
            
            {filters.endDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Até: {format(new Date(filters.endDate), "dd/MM/yyyy")}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ endDate: undefined })}
                />
              </Badge>
            )}
            
            {filters.type?.length === 1 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Tipo: {filters.type[0] === 'income' ? 'Receita' : 'Despesa'}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ type: undefined })}
                />
              </Badge>
            )}
            
            {filters.category?.length === 1 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Categoria: {categories.find(c => c.value === filters.category?.[0])?.label || filters.category[0]}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ category: undefined })}
                />
              </Badge>
            )}
            
            {filters.propertyId && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Propriedade: {properties.find(p => p.value === filters.propertyId)?.label || filters.propertyId}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ propertyId: undefined })}
                />
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onResetFilters}
              className="ml-auto"
            >
              Limpar Tudo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
