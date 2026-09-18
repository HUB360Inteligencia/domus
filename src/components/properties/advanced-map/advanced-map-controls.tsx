import { useState } from 'react';
import { BarChart3, Eye, EyeOff, Layers, Map, Settings, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { HeatmapMetric } from '@/lib/property-map-data';
import type { MapLayerVisibility } from '@/lib/mapbox-map';

export type AdvancedMapViewMode = 'cluster' | 'heatmap' | 'analytics';

interface AdvancedMapControlsProps {
  viewMode: AdvancedMapViewMode;
  onViewModeChange: (mode: AdvancedMapViewMode) => void;
  showClustering: boolean;
  onClusteringChange: (enabled: boolean) => void;
  showHeatmap: boolean;
  onHeatmapChange: (enabled: boolean) => void;
  heatmapMetric: HeatmapMetric;
  onHeatmapMetricChange: (metric: HeatmapMetric) => void;
  mapStyle: string;
  onMapStyleChange: (style: string) => void;
  layers: MapLayerVisibility;
  onLayerToggle: (layer: keyof MapLayerVisibility) => void;
  onFitProperties: () => void;
}

const MAP_STYLES = [
  { value: 'mapbox://styles/mapbox/streets-v12', label: 'Ruas' },
  { value: 'mapbox://styles/mapbox/light-v11', label: 'Claro' },
  { value: 'mapbox://styles/mapbox/dark-v11', label: 'Escuro' },
  { value: 'mapbox://styles/mapbox/satellite-v9', label: 'Satélite' },
  { value: 'mapbox://styles/mapbox/satellite-streets-v12', label: 'Satélite e ruas' },
  { value: 'mapbox://styles/mapbox/outdoors-v12', label: 'Terreno' },
];

const VIEW_MODES: Array<{ value: AdvancedMapViewMode; label: string; icon: typeof Target }> = [
  { value: 'cluster', label: 'Clusters', icon: Target },
  { value: 'heatmap', label: 'Calor', icon: TrendingUp },
  { value: 'analytics', label: 'Análise', icon: BarChart3 },
];

export function AdvancedMapControls({
  viewMode,
  onViewModeChange,
  showClustering,
  onClusteringChange,
  showHeatmap,
  onHeatmapChange,
  heatmapMetric,
  onHeatmapMetricChange,
  mapStyle,
  onMapStyleChange,
  layers,
  onLayerToggle,
  onFitProperties,
}: AdvancedMapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMapMode = viewMode !== 'analytics';

  return (
    <Card className="w-80 max-w-[calc(100vw-3rem)] bg-white/95 shadow-lg backdrop-blur-sm dark:bg-background/95">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            Controles do mapa
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            aria-label={isExpanded ? 'Recolher controles' : 'Expandir controles'}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <span className="mb-2 block text-xs font-medium">Modo de visualização</span>
          <div className="grid grid-cols-3 gap-1">
            {VIEW_MODES.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant={viewMode === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewModeChange(value)}
                className="h-auto flex-col gap-1 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {isMapMode && (
          <>
            <Separator />

            {viewMode === 'cluster' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Agrupar pontos</span>
                  <Switch checked={showClustering} onCheckedChange={onClusteringChange} />
                </div>
                {showClustering && <Badge variant="outline">Agrupamento ativo</Badge>}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Sobrepor calor</span>
                  <Switch checked={showHeatmap} onCheckedChange={onHeatmapChange} />
                </div>
              </div>
            )}

            {viewMode === 'heatmap' && (
              <div>
                <span className="mb-1 block text-xs text-muted-foreground">Métrica</span>
                <Select value={heatmapMetric} onValueChange={onHeatmapMetricChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Valor</SelectItem>
                    <SelectItem value="density">Densidade</SelectItem>
                    <SelectItem value="roi">Retorno anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div>
              <span className="mb-2 block text-xs font-medium">Estilo do mapa</span>
              <Select value={mapStyle} onValueChange={onMapStyleChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAP_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isExpanded && (
              <>
                <Separator />
                <div>
                  <span className="mb-2 flex items-center gap-1 text-xs font-medium">
                    <Layers className="h-3 w-3" />
                    Camadas
                  </span>
                  <div className="space-y-2">
                    <LayerSwitch label="Propriedades" checked={layers.properties} onChange={() => onLayerToggle('properties')} />
                    <LayerSwitch label="Limites" checked={layers.boundaries} onChange={() => onLayerToggle('boundaries')} />
                    <LayerSwitch label="Pontos de interesse" checked={layers.poi} onChange={() => onLayerToggle('poi')} />
                    <LayerSwitch label="Transporte" checked={layers.transit} onChange={() => onLayerToggle('transit')} />
                  </div>
                </div>

                <Separator />
                <Button type="button" variant="outline" size="sm" className="w-full justify-start text-xs" onClick={onFitProperties}>
                  <Map className="mr-2 h-3 w-3" />
                  Centralizar no portfólio
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LayerSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
