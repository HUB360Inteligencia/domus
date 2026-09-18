import { useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { Property } from '@/types/property';
import { PropertyClusterMap } from './property-cluster-map';
import { PropertyHeatmap } from './property-heatmap';
import { LocationAnalytics } from './location-analytics';
import { AdvancedMapControls, type AdvancedMapViewMode } from './advanced-map-controls';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HeatmapMetric } from '@/lib/property-map-data';
import type { MapLayerVisibility } from '@/lib/mapbox-map';

interface AdvancedMapViewProps {
  properties: Property[];
  onSelect: (id: string) => void;
}

const DEFAULT_LAYERS: MapLayerVisibility = {
  properties: true,
  boundaries: true,
  poi: true,
  transit: true,
};

export function AdvancedMapView({ properties, onSelect }: AdvancedMapViewProps) {
  const [viewMode, setViewMode] = useState<AdvancedMapViewMode>('cluster');
  const [showClustering, setShowClustering] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('value');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [layers, setLayers] = useState<MapLayerVisibility>(DEFAULT_LAYERS);
  const [fitRequestId, setFitRequestId] = useState(0);
  const { isReady, isLoading, error, retryInitialization } = useMapbox();

  const handleLayerToggle = (layer: keyof MapLayerVisibility) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  const controls = (
    <AdvancedMapControls
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showClustering={showClustering}
      onClusteringChange={setShowClustering}
      showHeatmap={showHeatmap}
      onHeatmapChange={setShowHeatmap}
      heatmapMetric={heatmapMetric}
      onHeatmapMetricChange={setHeatmapMetric}
      mapStyle={mapStyle}
      onMapStyleChange={setMapStyle}
      layers={layers}
      onLayerToggle={handleLayerToggle}
      onFitProperties={() => setFitRequestId((requestId) => requestId + 1)}
    />
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-muted p-4">
        <Card className="w-96 max-w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Erro no mapa avançado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={retryInitialization} size="sm" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !isReady) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-muted">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando mapa avançado...</span>
      </div>
    );
  }

  if (viewMode === 'analytics') {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 p-4 pb-2">{controls}</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-2">
          <LocationAnalytics properties={properties} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {viewMode === 'cluster' ? (
        <PropertyClusterMap
          properties={properties}
          onSelect={onSelect}
          showClustering={showClustering}
          showHeatmap={showHeatmap}
          mapStyle={mapStyle}
          layers={layers}
          fitRequestId={fitRequestId}
        />
      ) : (
        <PropertyHeatmap
          properties={properties}
          metric={heatmapMetric}
          mapStyle={mapStyle}
          layers={layers}
          fitRequestId={fitRequestId}
        />
      )}

      <div className="absolute left-4 top-4 z-20">{controls}</div>
    </div>
  );
}
