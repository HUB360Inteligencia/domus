
import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { ActivityFilters, ActivityStatus, ActivityPriority, ActivityType } from '@/types/activity';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ActivityFiltersProps {
  onFilterChange: (filters: ActivityFilters) => void;
  propertyOptions?: { label: string; value: string }[];
  contractOptions?: { label: string; value: string }[];
}

export function ActivityFiltersBar({ 
  onFilterChange, 
  propertyOptions = [],
  contractOptions = [] 
}: ActivityFiltersProps) {
  const [filters, setFilters] = useState<ActivityFilters>({});
  
  // Status options
  const statusOptions = [
    { label: 'Pendentes', value: 'pending' },
    { label: 'Em Progresso', value: 'in_progress' },
    { label: 'Concluídas', value: 'completed' },
    { label: 'Canceladas', value: 'cancelled' }
  ];
  
  // Priority options
  const priorityOptions = [
    { label: 'Baixa', value: 'low' },
    { label: 'Média', value: 'medium' },
    { label: 'Alta', value: 'high' }
  ];
  
  // Type options
  const typeOptions = [
    { label: 'Manutenção', value: 'maintenance' },
    { label: 'Inspeção', value: 'inspection' },
    { label: 'Legal', value: 'legal' },
    { label: 'Financeira', value: 'financial' },
    { label: 'Outro', value: 'other' }
  ];

  const handleStatusChange = (status: ActivityStatus) => {
    setFilters(prev => {
      const currentStatus = prev.status || [];
      const newStatus = currentStatus.includes(status)
        ? currentStatus.filter(s => s !== status)
        : [...currentStatus, status];
      
      return { ...prev, status: newStatus };
    });
  };

  const handlePriorityChange = (priority: ActivityPriority) => {
    setFilters(prev => {
      const currentPriority = prev.priority || [];
      const newPriority = currentPriority.includes(priority)
        ? currentPriority.filter(p => p !== priority)
        : [...currentPriority, priority];
      
      return { ...prev, priority: newPriority };
    });
  };

  const handleTypeChange = (type: ActivityType) => {
    setFilters(prev => {
      const currentType = prev.type || [];
      const newType = currentType.includes(type)
        ? currentType.filter(t => t !== type)
        : [...currentType, type];
      
      return { ...prev, type: newType };
    });
  };

  const handlePropertyChange = (propertyId: string) => {
    setFilters(prev => ({ ...prev, propertyId: propertyId || undefined }));
  };

  const handleContractChange = (contractId: string) => {
    setFilters(prev => ({ ...prev, contractId: contractId || undefined }));
  };

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null }) => {
    setFilters(prev => ({ ...prev, dueDateRange: range }));
  };
  
  const clearFilters = () => {
    setFilters({});
  };

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Count active filters
  const activeFiltersCount = (
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.type?.length || 0) +
    (filters.propertyId ? 1 : 0) +
    (filters.contractId ? 1 : 0) +
    (filters.dueDateRange?.from || filters.dueDateRange?.to ? 1 : 0)
  );

  return (
    <div className="p-4 space-y-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        {activeFiltersCount > 0 && (
          <Badge variant="outline" className="cursor-pointer" onClick={clearFilters}>
            {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''} <X className="h-3 w-3 ml-1" />
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Property filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Imóvel</label>
          <Select 
            value={filters.propertyId || ''} 
            onValueChange={handlePropertyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar imóvel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os imóveis</SelectItem>
              {propertyOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Contract filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Contrato</label>
          <Select 
            value={filters.contractId || ''} 
            onValueChange={handleContractChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os contratos</SelectItem>
              {contractOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Range filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Prazo</label>
          <DateRangePicker
            value={filters.dueDateRange || { from: null, to: null }}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>
      
      {/* Status, Priority and Type filters */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(status => {
              const isActive = filters.status?.includes(status.value as ActivityStatus);
              return (
                <Badge 
                  key={status.value}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleStatusChange(status.value as ActivityStatus)}
                >
                  {status.label}
                </Badge>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Prioridade</label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map(priority => {
              const isActive = filters.priority?.includes(priority.value as ActivityPriority);
              return (
                <Badge 
                  key={priority.value}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handlePriorityChange(priority.value as ActivityPriority)}
                >
                  {priority.label}
                </Badge>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map(type => {
              const isActive = filters.type?.includes(type.value as ActivityType);
              return (
                <Badge 
                  key={type.value}
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTypeChange(type.value as ActivityType)}
                >
                  {type.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
