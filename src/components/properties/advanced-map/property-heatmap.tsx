
import { useState, useRef, useEffect } from 'react';
import { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertyHeatmapProps {
  properties: Property[];
  metric?: 'value' | 'density' | 'roi';
  onMetricChange?: (metric: 'value' | 'density' | 'roi') => void;
}

export function PropertyHeatmap({ 
  properties, 
  metric = 'value',
  onMetricChange 
}: PropertyHeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [heatmapStats, setHeatmapStats] = useState<{
    minValue: number;
    maxValue: number;
    avgValue: number;
    hotspots: number;
  } | null>(null);

  const { getTokenForContext, getStyleForContext, isReady } = useMapbox();
  const { isLoaded: mapboxLoaded, error: mapboxError } = useMapboxLoader();

  const token = isReady ? getTokenForContext('mapbox_token_analytics') : null;
  const mapStyle = getStyleForContext('mapbox_style_analytics');

  // Prepare GeoJSON data with metrics
  const geoJsonData = {
    type: 'FeatureCollection' as const,
    features: properties
      .filter(p => p.latitude && p.longitude)
      .map(property => {
        let metricValue = 0;
        
        switch (metric) {
          case 'value':
            metricValue = property.value;
            break;
          case 'density':
            metricValue = 1; // Each property counts as 1 for density
            break;
          case 'roi':
            // Simulate ROI calculation (you'd replace this with actual ROI data)
            metricValue = Math.random() * 15; // 0-15% ROI
            break;
        }

        return {
          type: 'Feature' as const,
          properties: {
            id: property.id,
            title: property.title,
            address: property.address,
            city: property.city,
            value: property.value,
            status: property.status,
            type: property.type,
            metricValue,
            metricName: metric
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [property.longitude!, property.latitude!]
          }
        };
      })
  };

  // Initialize map
  useEffect(() => {
    if (!mapboxLoaded || !token || !mapContainer.current || !window.mapboxgl || mapRef.current || !isReady) {
      return;
    }

    try {
      window.mapboxgl.accessToken = token;
      
      mapRef.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-46.633308, -23.550520],
        zoom: 10
      });

      mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      mapRef.current.on('load', () => {
        setupHeatmap();
        setIsMapInitialized(true);
        calculateStats();
      });

    } catch (err) {
      console.error('Error initializing heatmap:', err);
    }
  }, [mapboxLoaded, token, mapStyle, isReady]);

  // Setup heatmap layers
  const setupHeatmap = () => {
    if (!mapRef.current) return;

    // Add data source
    mapRef.current.addSource('properties-heatmap', {
      type: 'geojson',
      data: geoJsonData
    });

    // Main heatmap layer
    mapRef.current.addLayer({
      id: 'properties-heatmap',
      type: 'heatmap',
      source: 'properties-heatmap',
      maxzoom: 15,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'metricValue'],
          0, 0,
          getMaxMetricValue(), 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        'heatmap-color': getHeatmapColorExpression(),
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 30
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          15, 0.5
        ]
      }
    });

    // Point layer for high zoom levels
    mapRef.current.addLayer({
      id: 'properties-points',
      type: 'circle',
      source: 'properties-heatmap',
      minzoom: 14,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'metricValue'],
          0, 4,
          getMaxMetricValue(), 20
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'metricValue'],
          0, '#f7fafc',
          getMaxMetricValue() * 0.5, '#fed7d7',
          getMaxMetricValue(), '#c53030'
        ],
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1,
        'circle-opacity': 0.8
      }
    });

    // Click interaction for points
    mapRef.current.on('click', 'properties-points', (e: any) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;

      new window.mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-sm mb-1">${props.title}</h3>
            <p class="text-xs text-gray-600 mb-2">${props.address}, ${props.city}</p>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>Valor:</span>
                <span class="font-medium">${formatCurrency(props.value)}</span>
              </div>
              <div class="flex justify-between">
                <span>${getMetricLabel()}:</span>
                <span class="font-medium">${formatMetricValue(props.metricValue)}</span>
              </div>
            </div>
          </div>
        `)
        .addTo(mapRef.current);
    });
  };

  // Update data when properties or metric changes
  useEffect(() => {
    if (mapRef.current && isMapInitialized) {
      const source = mapRef.current.getSource('properties-heatmap');
      if (source) {
        source.setData(geoJsonData);
        calculateStats();
        
        // Update heatmap weight based on new metric
        mapRef.current.setPaintProperty('properties-heatmap', 'heatmap-weight', [
          'interpolate',
          ['linear'],
          ['get', 'metricValue'],
          0, 0,
          getMaxMetricValue(), 1
        ]);

        mapRef.current.setPaintProperty('properties-points', 'circle-radius', [
          'interpolate',
          ['linear'],
          ['get', 'metricValue'],
          0, 4,
          getMaxMetricValue(), 20
        ]);

        mapRef.current.setPaintProperty('properties-points', 'circle-color', [
          'interpolate',
          ['linear'],
          ['get', 'metricValue'],
          0, '#f7fafc',
          getMaxMetricValue() * 0.5, '#fed7d7',
          getMaxMetricValue(), '#c53030'
        ]);
      }
    }
  }, [geoJsonData, metric, isMapInitialized]);

  const getMaxMetricValue = () => {
    const values = geoJsonData.features.map(f => f.properties.metricValue);
    return Math.max(...values, 1);
  };

  const getHeatmapColorExpression = () => {
    return [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(33,102,172,0)',
      0.2, 'rgb(103,169,207)',
      0.4, 'rgb(209,229,240)',
      0.6, 'rgb(253,219,199)',
      0.8, 'rgb(239,138,98)',
      1, 'rgb(178,24,43)'
    ];
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'value': return 'Valor';
      case 'density': return 'Densidade';
      case 'roi': return 'ROI';
      default: return 'Métrica';
    }
  };

  const formatMetricValue = (value: number) => {
    switch (metric) {
      case 'value': return formatCurrency(value);
      case 'density': return `${value.toFixed(0)} propriedades`;
      case 'roi': return `${value.toFixed(1)}%`;
      default: return value.toString();
    }
  };

  const calculateStats = () => {
    const values = geoJsonData.features.map(f => f.properties.metricValue);
    if (values.length === 0) return;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const hotspots = values.filter(v => v > avgValue * 1.5).length;

    setHeatmapStats({
      minValue,
      maxValue,
      avgValue,
      hotspots
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapInitialized(false);
      }
    };
  }, []);

  if (!isReady || !mapboxLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-2" />
          <p className="text-muted-foreground">Carregando heatmap...</p>
        </div>
      </div>
    );
  }

  if (mapboxError || !token) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="text-muted-foreground">Erro ao carregar heatmap</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-sm" />
      
      {/* Controls */}
      <Card className="absolute top-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Controles do Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <label className="text-xs font-medium">Métrica:</label>
            <Select value={metric} onValueChange={(value: any) => onMetricChange?.(value)}>
              <SelectTrigger className="h-8 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Valor dos Imóveis</SelectItem>
                <SelectItem value="density">Densidade</SelectItem>
                <SelectItem value="roi">ROI Estimado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {heatmapStats && (
        <Card className="absolute bottom-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex justify-between text-xs">
              <span>Mínimo:</span>
              <Badge variant="outline">{formatMetricValue(heatmapStats.minValue)}</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>Máximo:</span>
              <Badge variant="outline">{formatMetricValue(heatmapStats.maxValue)}</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>Média:</span>
              <Badge variant="outline">{formatMetricValue(heatmapStats.avgValue)}</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>Hotspots:</span>
              <Badge variant="default">{heatmapStats.hotspots}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="text-xs font-medium mb-2">Intensidade do {getMetricLabel()}</div>
        <div className="flex items-center space-x-2">
          <span className="text-xs">Baixa</span>
          <div className="w-16 h-3 bg-gradient-to-r from-blue-200 via-yellow-200 to-red-500 rounded"></div>
          <span className="text-xs">Alta</span>
        </div>
      </div>
    </div>
  );
}
