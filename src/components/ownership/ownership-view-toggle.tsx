import React from 'react';
import { PieChart } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOwnershipView } from '@/contexts/OwnershipViewContext';
import type { OwnershipViewMode } from '@/lib/ownership';

interface OwnershipViewToggleProps {
  className?: string;
}

/**
 * Alterna entre o valor cheio do ativo e a fatia do titular.
 *
 * Só aparece quando existe alguma participação de terceiro cadastrada: sem
 * sócios as duas visões dão o mesmo número, e o controle seria ruído.
 */
export const OwnershipViewToggle: React.FC<OwnershipViewToggleProps> = ({ className }) => {
  const { mode, setMode, hasAnyPartner } = useOwnershipView();

  if (!hasAnyPartner) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value === 'gross' || value === 'mine') setMode(value as OwnershipViewMode);
            }}
            className={className}
          >
            <ToggleGroupItem value="gross" aria-label="Ver valor bruto">
              Valor bruto
            </ToggleGroupItem>
            <ToggleGroupItem value="mine" aria-label="Ver apenas minha cota">
              <PieChart className="h-4 w-4" />
              Minha cota
            </ToggleGroupItem>
          </ToggleGroup>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">
            "Minha cota" aplica o percentual de sociedade de cada imóvel — e o do loteamento, nos
            lotes que não têm percentual próprio.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
