
import { useState } from 'react';
import { Property } from '@/types/property';
import { PropertyClusterMap } from './property-cluster-map';
import { PropertyHeatmap } from './property-heatmap';
import { LocationAnalytics } from './location-analytics';
import { AdvancedMapControls } from './advanced-map-controls';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface AdvancedMapViewProps {
  properties: Property[];
  onSelect: (id: string) => void;
}

export function AdvancedMapView({ properties, onSelect }: AdvancedMapViewProps) {
  const [viewMode, setViewMode] = useState<'cluster' | 'heatmap' | 'analytics'>('cluster');
  const [showClustering, setShowClustering] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<'value' | 'density' | 'roi'>('value');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [layers, setLayers] = useState({
    properties: true,
    boundaries: false,
    poi: false,
    transit: false
  });

  const { isReady, error: mapboxError, retryInitialization } = useMapbox();
  const { isLoaded: mapboxLoaded, isLoading: mapboxLoading, error: loaderError, retryLoad } = useMapboxLoader();

  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const handleRetry = () => {
    console.log('AdvancedMapView: Retrying initialization');
    retryInitialization();
    retryLoad();
  };

  // Check if we're still loading
  if (!isReady || mapboxLoading || !mapboxLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando Mapa Avançado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Inicializando configurações...</div>
              <div>• Carregando biblioteca Mapbox...</div>
              <div>• Preparando componentes...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for errors
  if (mapboxError || loaderError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Erro no Mapa Avançado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {mapboxError || loaderError}
            </div>
            <div className="space-y-2">
              <Button onClick={handleRetry} size="sm" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Verifique se o token Mapbox está configurado corretamente
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderMapContent = () => {
    try {
      switch (viewMode) {
        case 'cluster':
          return (
            <PropertyClusterMap
              properties={properties}
              onSelect={onSelect}
              showClustering={showClustering}
              showHeatmap={showHeatmap}
            />
          );
        case 'heatmap':
          return (
            <PropertyHeatmap
              properties={properties}
              metric={heatmapMetric}
              onMetricChange={setHeatmapMetric}
            />
          );
        case 'analytics':
          return (
            <LocationAnalytics properties={properties} />
          );
        default:
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Modo de visualização não suportado</div>
            </div>
          );
      }
    } catch (error) {
      console.error('AdvancedMapView: Error rendering content:', error);
      return (
        <div className="flex items-center justify-center h-full bg-muted rounded-lg">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Erro na Renderização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Erro ao renderizar o componente do mapa
              </div>
              <Button onClick={() => window.location.reload()} size="sm" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className="relative h-full">
      {/* Map/Analytics Content */}
      <div className="h-full">
        {renderMapContent()}
      </div>

      {/* Controls Panel */}
      {viewMode !== 'analytics' && (
        <div className="absolute top-4 left-4 z-10">
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
          />
        </div>
      )}

      {/* Debug info in development */}
      {import.meta.env.DEV && (
        <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded">
          <div>Ready: {isReady ? 'Yes' : 'No'}</div>
          <div>Loaded: {mapboxLoaded ? 'Yes' : 'No'}</div>
          <div>Properties: {properties.length}</div>
          <div>Mode: {viewMode}</div>
        </div>
      )}
    </div>
  );
}
