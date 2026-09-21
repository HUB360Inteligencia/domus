import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { usePropertyQueries } from '@/hooks/use-property-queries';
import { useAllOwnershipStakes } from '@/hooks/use-ownership-stakes';
import { buildShareMap, hasPartners, shareFactor, type OwnershipViewMode } from '@/lib/ownership';

const STORAGE_KEY = 'domus.ownership-view-mode';

interface OwnershipViewContextType {
  mode: OwnershipViewMode;
  setMode: (mode: OwnershipViewMode) => void;
  toggleMode: () => void;
  /** Fração (0–1) de cada imóvel que é do titular, com a herança do loteamento resolvida. */
  shares: Map<string, number>;
  /** Fator a aplicar a um valor do imóvel no modo atual: 1 no modo bruto. */
  factorFor: (propertyId?: string | null) => number;
  /** false quando ninguém cadastrou sócio — aí o alternador não tem o que mostrar. */
  hasAnyPartner: boolean;
  isLoading: boolean;
}

const OwnershipViewContext = createContext<OwnershipViewContextType | undefined>(undefined);

const readStoredMode = (): OwnershipViewMode => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'mine' ? 'mine' : 'gross';
  } catch {
    // Janela privada ou storage bloqueado: o modo bruto é o padrão seguro.
    return 'gross';
  }
};

export function OwnershipViewProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<OwnershipViewMode>(readStoredMode);
  const { session } = useAuth();
  // usePropertyQueries espera a sessão; este provider fica na raiz do app e
  // renderiza antes do login. A chave da consulta é a mesma de useProperties,
  // então o react-query reaproveita o cache em vez de buscar duas vezes.
  const { properties } = usePropertyQueries(null);
  const { data: stakes = [], isLoading } = useAllOwnershipStakes(!!session);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Sem storage a escolha vale só nesta sessão; não é motivo para falhar.
    }
  }, [mode]);

  const shares = useMemo(() => buildShareMap(properties, stakes), [properties, stakes]);
  const hasAnyPartner = useMemo(() => hasPartners(stakes), [stakes]);

  const setMode = useCallback((next: OwnershipViewMode) => setModeState(next), []);
  const toggleMode = useCallback(
    () => setModeState((previous) => (previous === 'gross' ? 'mine' : 'gross')),
    []
  );

  const factorFor = useCallback(
    (propertyId?: string | null) => shareFactor(mode, shares, propertyId),
    [mode, shares]
  );

  const value = useMemo(
    () => ({ mode, setMode, toggleMode, shares, factorFor, hasAnyPartner, isLoading }),
    [mode, setMode, toggleMode, shares, factorFor, hasAnyPartner, isLoading]
  );

  return <OwnershipViewContext.Provider value={value}>{children}</OwnershipViewContext.Provider>;
}

/**
 * Visão societária corrente.
 *
 * Fora do provider devolve o modo bruto, para que qualquer tela renderize os
 * números cheios em vez de quebrar.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useOwnershipView(): OwnershipViewContextType {
  const context = useContext(OwnershipViewContext);

  if (!context) {
    return {
      mode: 'gross',
      setMode: () => undefined,
      toggleMode: () => undefined,
      shares: new Map(),
      factorFor: () => 1,
      hasAnyPartner: false,
      isLoading: false,
    };
  }

  return context;
}
