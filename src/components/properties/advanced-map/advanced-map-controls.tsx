import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Map, 
  Layers, 
  BarChart3, 
  Settings, 
  Eye, 
  EyeOff,
  Target,
  TrendingUp
} from 'lucide-react';

interface LayersState {
  properties: boolean;
  boundaries: boolean;
  poi: boolean;
  transit: boolean;
}

interface AdvancedMapControlsProps {
  viewMode: 'cluster' | 'heatmap' | 'analytics';
  onViewModeChange: (mode: 'cluster' | 'heatmap' | 'analytics') => void;
  showClustering: boolean;
  onClusteringChange: (enabled: boolean) => void;
  showHeatmap: boolean;
  onHeatmapChange: (enabled: boolean) => void;
  heatmapMetric: 'value' | 'density' | 'roi';
  onHeatmapMetricChange: (metric: 'value' | 'density' | 'roi') => void;
  mapStyle: string;
  onMapStyleChange: (style: string) => void;
  layers: LayersState;
  onLayerToggle: (layer: keyof LayersState) => void;
}

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
  onLayerToggle
}: AdvancedMapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const mapStyles = [
    { value: 'mapbox://styles/mapbox/streets-v12', label: 'Streets' },
    { value: 'mapbox://styles/mapbox/light-v11', label: 'Light' },
    { value: 'mapbox://styles/mapbox/dark-v11', label: 'Dark' },
    { value: 'mapbox://styles/mapbox/satellite-v9', label: 'Satellite' },
    { value: 'mapbox://styles/mapbox/satellite-streets-v12', label: 'Satellite Streets' },
    { value: 'mapbox://styles/mapbox/outdoors-v12', label: 'Outdoors' }
  ];

  const viewModes = [
    { value: 'cluster', label: 'Clustering', icon: Target },
    { value: 'heatmap', label: 'Heatmap', icon: TrendingUp },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <Card className="w-80 bg-white/95 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Controles do Mapa
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* View Mode Selection */}
        <div>
          <label className="text-xs font-medium mb-2 block">Modo de Visualização:</label>
          <div className="grid grid-cols-3 gap-1">
            {viewModes.map(mode => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.value}
                  variant={viewMode === mode.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onViewModeChange(mode.value as any)}
                  className="flex flex-col gap-1 h-auto py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Clustering Controls */}
        {(viewMode === 'cluster' || viewMode === 'analytics') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Clustering:</label>
              <Switch
                checked={showClustering}
                onCheckedChange={onClusteringChange}
              />
            </div>
            {showClustering && (
              <div className="pl-4 space-y-2">
                <Badge variant="outline" className="text-xs">
                  Auto-agrupamento ativo
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Heatmap Controls */}
        {(viewMode === 'heatmap' || viewMode === 'analytics') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Heatmap:</label>
              <Switch
                checked={showHeatmap}
                onCheckedChange={onHeatmapChange}
              />
            </div>
            {showHeatmap && (
              <div className="pl-4 space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Métrica:</label>
                  <Select value={heatmapMetric} onValueChange={onHeatmapMetricChange}>
                    <SelectTrigger className="h-7 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">Valor</SelectItem>
                      <SelectItem value="density">Densidade</SelectItem>
                      <SelectItem value="roi">ROI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Map Style */}
        <div>
          <label className="text-xs font-medium mb-2 block">Estilo do Mapa:</label>
          <Select value={mapStyle} onValueChange={onMapStyleChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mapStyles.map(style => (
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

            {/* Layer Controls */}
            <div>
              <label className="text-xs font-medium mb-2 block flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Camadas:
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Propriedades</span>
                  <Switch
                    checked={layers.properties}
                    onCheckedChange={() => onLayerToggle('properties')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Limites</span>
                  <Switch
                    checked={layers.boundaries}
                    onCheckedChange={() => onLayerToggle('boundaries')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Pontos de Interesse</span>
                  <Switch
                    checked={layers.poi}
                    onCheckedChange={() => onLayerToggle('poi')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Transporte</span>
                  <Switch
                    checked={layers.transit}
                    onCheckedChange={() => onLayerToggle('transit')}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div>
              <label className="text-xs font-medium mb-2 block">Ações Rápidas:</label>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Map className="h-3 w-3 mr-2" />
                  Centralizar no Portfolio
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Target className="h-3 w-3 mr-2" />
                  Localizar Próximos
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
