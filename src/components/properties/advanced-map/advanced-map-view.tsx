
import { useState } from 'react';
import { Property } from '@/types/property';
import { PropertyClusterMap } from './property-cluster-map';
import { PropertyHeatmap } from './property-heatmap';
import { LocationAnalytics } from './location-analytics';
import { AdvancedMapControls } from './advanced-map-controls';

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

  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const renderMapContent = () => {
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
        return null;
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
    </div>
  );
}
