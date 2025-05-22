
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2 mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    size="sm"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(new Date(filters.startDate), "dd/MM/yyyy") : "Start Date"}
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
                    {filters.endDate ? format(new Date(filters.endDate), "dd/MM/yyyy") : "End Date"}
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
            <label className="text-sm font-medium">Transaction Type</label>
            <Select 
              value={filters.type?.length === 1 ? filters.type[0] : "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  onFilterChange({ type: undefined });
                } else {
                  onFilterChange({ type: [value] });
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Category */}
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select 
              value={filters.category?.length === 1 ? filters.category[0] : "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  onFilterChange({ category: undefined });
                } else {
                  onFilterChange({ category: [value] });
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Property */}
          {properties.length > 0 && (
            <div>
              <label className="text-sm font-medium">Property</label>
              <Select 
                value={filters.propertyId || "all"} 
                onValueChange={(value) => onFilterChange({ 
                  propertyId: value === "all" ? undefined : value 
                })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All properties</SelectItem>
                  {properties.map((prop) => (
                    <SelectItem key={prop.value} value={prop.value}>{prop.label}</SelectItem>
                  ))}
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
                From: {format(new Date(filters.startDate), "dd/MM/yyyy")}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ startDate: undefined })}
                />
              </Badge>
            )}
            
            {filters.endDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {format(new Date(filters.endDate), "dd/MM/yyyy")}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ endDate: undefined })}
                />
              </Badge>
            )}
            
            {filters.type?.length === 1 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {filters.type[0] === 'income' ? 'Income' : 'Expense'}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ type: undefined })}
                />
              </Badge>
            )}
            
            {filters.category?.length === 1 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {categories.find(c => c.value === filters.category?.[0])?.label || filters.category[0]}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onFilterChange({ category: undefined })}
                />
              </Badge>
            )}
            
            {filters.propertyId && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Property: {properties.find(p => p.value === filters.propertyId)?.label || filters.propertyId}
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
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
