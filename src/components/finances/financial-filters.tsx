
import { useState, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useFinancialCategories } from '@/hooks/use-financial-transactions';
import { useProperties } from '@/hooks/use-properties';
import { FinancialReportFilters, TransactionType } from '@/types/financial';

interface FinancialFiltersProps {
  filters: FinancialReportFilters;
  onFilterChange: (filters: FinancialReportFilters) => void;
}

export const FinancialFilters = ({ 
  filters = {}, 
  onFilterChange 
}: FinancialFiltersProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );
  
  const { properties } = useProperties();
  const { data: incomeCategories } = useFinancialCategories('income');
  const { data: expenseCategories } = useFinancialCategories('expense');
  
  // Combinar categorias para o filtro
  const allCategories = [...(incomeCategories || []), ...(expenseCategories || [])];
  const uniqueCategories = [...new Set(allCategories.map(c => c.name))];

  useEffect(() => {
    const newFilters: FinancialReportFilters = { ...filters };
    
    if (startDate) {
      newFilters.startDate = format(startDate, 'yyyy-MM-dd');
    } else {
      delete newFilters.startDate;
    }
    
    if (endDate) {
      newFilters.endDate = format(endDate, 'yyyy-MM-dd');
    } else {
      delete newFilters.endDate;
    }
    
    onFilterChange(newFilters);
  }, [startDate, endDate]);

  const handlePropertyChange = (value: string) => {
    const newFilters = { ...filters };
    
    if (value === "all") {
      delete newFilters.propertyIds;
    } else {
      newFilters.propertyIds = [value];
    }
    
    onFilterChange(newFilters);
  };

  const handleTransactionTypeChange = (value: string) => {
    const newFilters = { ...filters };
    
    if (value === "all") {
      delete newFilters.transactionTypes;
    } else if (value === "both") {
      newFilters.transactionTypes = ['income', 'expense'];
    } else {
      newFilters.transactionTypes = [value as TransactionType];
    }
    
    onFilterChange(newFilters);
  };

  const handleCategoryChange = (value: string) => {
    const newFilters = { ...filters };
    
    if (value === "all") {
      delete newFilters.categories;
    } else {
      newFilters.categories = [value];
    }
    
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({});
  };

  return (
    <div className="bg-background border rounded-md p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy') : <span>Data Inicial</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : <span>Data Final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Select
              value={filters.propertyIds?.length ? filters.propertyIds[0] : 'all'}
              onValueChange={handlePropertyChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Imóvel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Imóveis</SelectItem>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={
                !filters.transactionTypes ? 'all' : 
                filters.transactionTypes.length === 2 ? 'both' :
                filters.transactionTypes[0]
              }
              onValueChange={handleTransactionTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Transação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="both">Receitas e Despesas</SelectItem>
                <SelectItem value="income">Somente Receitas</SelectItem>
                <SelectItem value="expense">Somente Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4">
          <Select
            value={filters.categories?.length ? filters.categories[0] : 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          className="w-full md:w-1/4"
          onClick={handleClearFilters}
        >
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};
