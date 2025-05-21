
import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useProperties } from '@/hooks/use-properties';
import { useFinancialCategories } from '@/hooks/use-financial-transactions';
import { FinancialReportFilters } from '@/types/financial';
import { Label } from '@/components/ui/label';

interface FinancialFiltersProps {
  filters: FinancialReportFilters;
  onFilterChange: (filters: FinancialReportFilters) => void;
}

export const FinancialFilters = ({ 
  filters, 
  onFilterChange 
}: FinancialFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: properties } = useProperties();
  const { data: incomeCategories } = useFinancialCategories('income');
  const { data: expenseCategories } = useFinancialCategories('expense');

  const categories = [
    ...(incomeCategories || []),
    ...(expenseCategories || []),
  ];

  const handleStartDateChange = (date: Date | undefined) => {
    onFilterChange({
      ...filters,
      startDate: date ? format(date, 'yyyy-MM-dd') : undefined
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onFilterChange({
      ...filters,
      endDate: date ? format(date, 'yyyy-MM-dd') : undefined
    });
  };

  const handlePropertyFilterChange = (propertyIds: string[]) => {
    onFilterChange({
      ...filters,
      propertyIds
    });
  };

  const handleTransactionTypeChange = (types: ('income' | 'expense')[]) => {
    onFilterChange({
      ...filters,
      transactionTypes: types
    });
  };

  const handleCategoryChange = (categories: string[]) => {
    onFilterChange({
      ...filters,
      categories
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      startDate: undefined,
      endDate: undefined,
      propertyIds: undefined,
      transactionTypes: undefined,
      categories: undefined,
    });
    setIsOpen(false);
  };

  // Predefined periods
  const setThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    onFilterChange({
      ...filters,
      startDate: format(startOfMonth, 'yyyy-MM-dd'),
      endDate: format(endOfMonth, 'yyyy-MM-dd')
    });
  };
  
  const setLastMonth = () => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    onFilterChange({
      ...filters,
      startDate: format(startOfLastMonth, 'yyyy-MM-dd'),
      endDate: format(endOfLastMonth, 'yyyy-MM-dd')
    });
  };
  
  const setThisYear = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    onFilterChange({
      ...filters,
      startDate: format(startOfYear, 'yyyy-MM-dd'),
      endDate: format(endOfYear, 'yyyy-MM-dd')
    });
  };
  
  const setLastSixMonths = () => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    onFilterChange({
      ...filters,
      startDate: format(sixMonthsAgo, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd')
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Filtro rápido por período */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={setThisMonth}
          className={cn(
            "text-xs",
            filters.startDate && filters.endDate && 
            new Date(filters.startDate).getMonth() === new Date().getMonth() && 
            new Date(filters.startDate).getFullYear() === new Date().getFullYear() && 
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          Este Mês
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={setLastMonth}
          className="text-xs"
        >
          Mês Anterior
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={setLastSixMonths}
          className="text-xs"
        >
          Últimos 6 Meses
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={setThisYear}
          className="text-xs"
        >
          Este Ano
        </Button>
      </div>

      {/* Data inicial */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal text-xs",
              !filters.startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            {filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : "Data Inicial"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.startDate ? new Date(filters.startDate) : undefined}
            onSelect={handleStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Data final */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal text-xs",
              !filters.endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            {filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : "Data Final"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.endDate ? new Date(filters.endDate) : undefined}
            onSelect={handleEndDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Mais filtros em uma gaveta lateral */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            <FilterIcon className="h-3 w-3 mr-2" />
            Mais Filtros
            {(filters.propertyIds?.length || filters.transactionTypes?.length || filters.categories?.length) ? (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {(filters.propertyIds?.length || 0) + 
                 (filters.transactionTypes?.length || 0) + 
                 (filters.categories?.length || 0)}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent className="min-w-[300px] sm:min-w-[400px]">
          <SheetHeader>
            <SheetTitle>Filtros Avançados</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {/* Filtro por tipo de transação */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Tipo de Transação</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="income" 
                    checked={filters.transactionTypes?.includes('income')}
                    onCheckedChange={(checked) => {
                      const currentTypes = filters.transactionTypes || [];
                      const newTypes = checked 
                        ? [...currentTypes, 'income']
                        : currentTypes.filter(t => t !== 'income');
                      handleTransactionTypeChange(newTypes as ('income' | 'expense')[]);
                    }}
                  />
                  <label 
                    htmlFor="income"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Receitas
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="expense" 
                    checked={filters.transactionTypes?.includes('expense')}
                    onCheckedChange={(checked) => {
                      const currentTypes = filters.transactionTypes || [];
                      const newTypes = checked 
                        ? [...currentTypes, 'expense']
                        : currentTypes.filter(t => t !== 'expense');
                      handleTransactionTypeChange(newTypes as ('income' | 'expense')[]);
                    }}
                  />
                  <label 
                    htmlFor="expense"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Despesas
                  </label>
                </div>
              </div>
            </div>
            
            {/* Filtro por imóvel */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Imóveis</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {properties?.map(property => (
                  <div key={property.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`property-${property.id}`} 
                      checked={filters.propertyIds?.includes(property.id)}
                      onCheckedChange={(checked) => {
                        const currentProperties = filters.propertyIds || [];
                        const newProperties = checked 
                          ? [...currentProperties, property.id]
                          : currentProperties.filter(id => id !== property.id);
                        handlePropertyFilterChange(newProperties);
                      }}
                    />
                    <label 
                      htmlFor={`property-${property.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {property.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Filtro por categoria */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Categorias</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {categories?.map(category => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category.id}`} 
                      checked={filters.categories?.includes(category.name)}
                      onCheckedChange={(checked) => {
                        const currentCategories = filters.categories || [];
                        const newCategories = checked 
                          ? [...currentCategories, category.name]
                          : currentCategories.filter(name => name !== category.name);
                        handleCategoryChange(newCategories);
                      }}
                    />
                    <label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <span className={category.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {category.type === 'income' ? '[Receita] ' : '[Despesa] '}
                      </span>
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleClearFilters}>Limpar Filtros</Button>
              <Button onClick={() => setIsOpen(false)}>Aplicar Filtros</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
