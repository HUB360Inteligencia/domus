// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Property } from '@/types/property';
import { AdvancedMapView } from './advanced-map-view';

const mapboxState = vi.hoisted(() => ({
  isReady: true,
  isLoading: false,
  error: null as string | null,
  retryInitialization: vi.fn(),
}));

vi.mock('@/contexts/MapboxContext', () => ({
  useMapbox: () => mapboxState,
}));

vi.mock('./property-cluster-map', () => ({
  PropertyClusterMap: ({
    mapStyle,
    showClustering,
    showHeatmap,
    fitRequestId,
  }: {
    mapStyle: string;
    showClustering: boolean;
    showHeatmap: boolean;
    fitRequestId: number;
  }) => (
    <div
      data-testid="cluster-map"
      data-style={mapStyle}
      data-clustering={String(showClustering)}
      data-heatmap={String(showHeatmap)}
      data-fit-request={String(fitRequestId)}
    >
      Cluster map
    </div>
  ),
}));

vi.mock('./property-heatmap', () => ({
  PropertyHeatmap: ({ metric }: { metric: string }) => (
    <div data-testid="heatmap" data-metric={metric}>Heatmap</div>
  ),
}));

const property: Property = {
  id: 'property-1',
  title: 'Apartamento Centro',
  address: 'Rua Principal, 100',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  type: 'apartment',
  status: 'available',
  value: 600_000,
  latitude: -23.55052,
  longitude: -46.633308,
  user_id: 'user-1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('AdvancedMapView', () => {
  afterEach(cleanup);

  beforeEach(() => {
    mapboxState.isReady = true;
    mapboxState.isLoading = false;
    mapboxState.error = null;
    mapboxState.retryInitialization.mockClear();
  });

  it('allows switching to analytics and back to the cluster map', () => {
    render(<AdvancedMapView properties={[property]} onSelect={vi.fn()} />);

    expect(screen.getByTestId('cluster-map')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Análise' }));
    expect(screen.getByText('Análise por cidade')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clusters' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clusters' }));
    expect(screen.getByTestId('cluster-map')).toBeInTheDocument();
  });

  it('switches to the heatmap without losing the shared controls', () => {
    render(<AdvancedMapView properties={[property]} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Calor' }));
    expect(screen.getByTestId('heatmap')).toHaveAttribute('data-metric', 'value');
    expect(screen.getByRole('button', { name: 'Clusters' })).toBeInTheDocument();
  });

  it('connects clustering, heat overlay, and viewport controls to the map', () => {
    render(<AdvancedMapView properties={[property]} onSelect={vi.fn()} />);

    const switches = screen.getAllByRole('switch');
    expect(screen.getByTestId('cluster-map')).toHaveAttribute('data-clustering', 'true');
    expect(screen.getByTestId('cluster-map')).toHaveAttribute('data-heatmap', 'false');

    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);
    expect(screen.getByTestId('cluster-map')).toHaveAttribute('data-clustering', 'false');
    expect(screen.getByTestId('cluster-map')).toHaveAttribute('data-heatmap', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Expandir controles' }));
    fireEvent.click(screen.getByRole('button', { name: 'Centralizar no portfólio' }));
    expect(screen.getByTestId('cluster-map')).toHaveAttribute('data-fit-request', '1');
  });

  it('shows configuration errors before the loading fallback', () => {
    mapboxState.isReady = false;
    mapboxState.isLoading = false;
    mapboxState.error = 'Token inválido';

    render(<AdvancedMapView properties={[property]} onSelect={vi.fn()} />);

    expect(screen.getByText('Token inválido')).toBeInTheDocument();
    expect(screen.queryByText('Carregando mapa avançado...')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(mapboxState.retryInitialization).toHaveBeenCalledOnce();
  });
});
