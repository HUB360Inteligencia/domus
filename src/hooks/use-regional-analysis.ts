
import { useMemo } from 'react';
import { useProperties } from '@/hooks/use-properties';
import { useContracts } from '@/hooks/use-contracts';
import { useFinancialTransactions } from '@/hooks/use-financial-transactions';

export interface RegionalData {
  regiao: string;
  propriedades: number;
  valorMedio: number;
  ocupacao: number;
  receita: number;
  ocupacaoStatus: 'excelente' | 'bom' | 'atencao';
}

export interface PropertyTypeData {
  tipo: string;
  quantidade: number;
  receita: number;
  valorMedio: number;
}

export const useRegionalAnalysis = () => {
  const { properties } = useProperties();
  const { contracts } = useContracts();
  const { transactions } = useFinancialTransactions();

  const regionalAnalysis = useMemo((): RegionalData[] => {
    if (!properties || !contracts || !transactions) return [];

    // Agrupar propriedades por cidade
    const propertiesByRegion = properties.reduce((acc, property) => {
      const region = property.city || 'Outras Regiões';
      if (!acc[region]) acc[region] = [];
      acc[region].push(property);
      return acc;
    }, {} as Record<string, typeof properties>);

    return Object.entries(propertiesByRegion).map(([regiao, regionProperties]) => {
      // Calcular valor médio das propriedades da região
      const valorMedio = regionProperties.reduce((sum, p) => sum + Number(p.value || 0), 0) / regionProperties.length;

      // Calcular ocupação
      const activeContracts = contracts.filter(c => 
        c.status === 'active' && 
        regionProperties.some(p => p.id === c.property_id)
      );
      const ocupacao = regionProperties.length > 0 ? (activeContracts.length / regionProperties.length) * 100 : 0;

      // Calcular receita da região
      const receita = transactions
        .filter(t => 
          t.transaction_type === 'income' && 
          regionProperties.some(p => p.id === t.property_id)
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Determinar status de ocupação
      const ocupacaoStatus: 'excelente' | 'bom' | 'atencao' = 
        ocupacao >= 90 ? 'excelente' : 
        ocupacao >= 80 ? 'bom' : 'atencao';

      return {
        regiao,
        propriedades: regionProperties.length,
        valorMedio,
        ocupacao: Math.round(ocupacao),
        receita,
        ocupacaoStatus
      };
    });
  }, [properties, contracts, transactions]);

  const propertyTypeAnalysis = useMemo((): PropertyTypeData[] => {
    if (!properties || !transactions) return [];

    // Agrupar propriedades por tipo
    const propertiesByType = properties.reduce((acc, property) => {
      const tipo = property.type || 'Outros';
      if (!acc[tipo]) acc[tipo] = [];
      acc[tipo].push(property);
      return acc;
    }, {} as Record<string, typeof properties>);

    return Object.entries(propertiesByType).map(([tipo, typeProperties]) => {
      // Calcular receita do tipo
      const receita = transactions
        .filter(t => 
          t.transaction_type === 'income' && 
          typeProperties.some(p => p.id === t.property_id)
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Calcular valor médio
      const valorMedio = typeProperties.reduce((sum, p) => sum + Number(p.value || 0), 0) / typeProperties.length;

      return {
        tipo,
        quantidade: typeProperties.length,
        receita,
        valorMedio
      };
    });
  }, [properties, transactions]);

  const occupancyData = useMemo(() => {
    if (!properties || !contracts) return [];

    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const occupancyRate = properties.length > 0 ? (activeContracts / properties.length) * 100 : 0;

    return [
      { name: 'Ocupado', value: Math.round(occupancyRate), color: '#10b981' },
      { name: 'Vago', value: Math.round(100 - occupancyRate), color: '#ef4444' }
    ];
  }, [properties, contracts]);

  return {
    regionalAnalysis,
    propertyTypeAnalysis,
    occupancyData
  };
};
