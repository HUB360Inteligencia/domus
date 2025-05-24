
import { useState, useRef, useMemo, useEffect } from 'react';
import { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PropertyClusterMapProps {
  properties: Property[];
  onSelect: (id: string) => void;
  showClustering?: boolean;
  showHeatmap?: boolean;
}

export function PropertyClusterMap({ 
  properties, 
  onSelect, 
  showClustering = true,
  showHeatmap = false 
}: PropertyClusterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [clusterStats, setClusterStats] = useState<{
    totalClusters: number;
    totalPoints: number;
    avgClusterSize: number;
  } | null>(null);

  const { getTokenForContext, getStyleForContext, isReady } = useMapbox();
  const { isLoaded: mapboxLoaded, error: mapboxError } = useMapboxLoader();

  const token = isReady ? getTokenForContext('mapbox_token_property_list') : null;
  const mapStyle = getStyleForContext('mapbox_style_property_list');

  // Prepare GeoJSON data for clustering
  const geoJsonData = useMemo(() => {
    const features = properties
      .filter(p => p.latitude && p.longitude)
      .map(property => ({
        type: 'Feature' as const,
        properties: {
          id: property.id,
          title: property.title,
          address: property.address,
          city: property.city,
          value: property.value,
          status: property.status,
          type: property.type,
          image_url: property.image_url
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [property.longitude!, property.latitude!]
        }
      }));

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [properties]);

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
        setupClustering();
        if (showHeatmap) {
          setupHeatmap();
        }
        setIsMapInitialized(true);
      });

    } catch (err) {
      console.error('Error initializing cluster map:', err);
    }
  }, [mapboxLoaded, token, mapStyle, isReady]);

  // Setup clustering
  const setupClustering = () => {
    if (!mapRef.current) return;

    // Add data source
    mapRef.current.addSource('properties', {
      type: 'geojson',
      data: geoJsonData,
      cluster: showClustering,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    if (showClustering) {
      // Cluster circles
      mapRef.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'properties',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            30,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ]
        }
      });

      // Cluster count
      mapRef.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'properties',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Cluster click interaction
      mapRef.current.on('click', 'clusters', (e: any) => {
        const features = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        mapRef.current.getSource('properties').getClusterExpansionZoom(
          clusterId,
          (err: any, zoom: number) => {
            if (err) return;
            mapRef.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          }
        );
      });
    }

    // Individual points
    mapRef.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'properties',
      filter: showClustering ? ['!', ['has', 'point_count']] : null,
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'status'], 'available'], '#10b981',
          ['==', ['get', 'status'], 'rented'], '#3b82f6',
          ['==', ['get', 'status'], 'airbnb'], '#ef4444',
          ['==', ['get', 'status'], 'maintenance'], '#f59e0b',
          ['==', ['get', 'status'], 'sold'], '#8b5cf6',
          '#6b7280'
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Point click interaction
    mapRef.current.on('click', 'unclustered-point', (e: any) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;

      // Create popup
      const popup = new window.mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-3 max-w-xs">
            ${properties.image_url ? `
              <img src="${properties.image_url}" alt="${properties.title}" 
                   class="w-full h-24 object-cover rounded mb-2" />
            ` : ''}
            <h3 class="font-semibold text-sm mb-1">${properties.title}</h3>
            <p class="text-xs text-gray-600 mb-2">${properties.address}, ${properties.city}</p>
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs px-2 py-1 rounded text-white bg-blue-500">
                ${properties.status}
              </span>
              <span class="font-bold text-sm">${formatCurrency(properties.value)}</span>
            </div>
            <button 
              class="w-full bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600"
              onclick="window.selectProperty('${properties.id}')"
            >
              Ver Detalhes
            </button>
          </div>
        `)
        .addTo(mapRef.current);
    });

    // Make selectProperty available globally
    (window as any).selectProperty = onSelect;

    // Update cluster stats
    updateClusterStats();
  };

  // Setup heatmap
  const setupHeatmap = () => {
    if (!mapRef.current) return;

    mapRef.current.addSource('properties-heat', {
      type: 'geojson',
      data: geoJsonData
    });

    mapRef.current.addLayer({
      id: 'properties-heat',
      type: 'heatmap',
      source: 'properties-heat',
      maxzoom: 15,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          0, 0,
          1000000, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 20
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          15, 0.5
        ]
      }
    }, 'waterway-label');
  };

  // Update data when properties change
  useEffect(() => {
    if (mapRef.current && isMapInitialized) {
      const source = mapRef.current.getSource('properties');
      if (source) {
        source.setData(geoJsonData);
        updateClusterStats();
      }

      if (showHeatmap) {
        const heatSource = mapRef.current.getSource('properties-heat');
        if (heatSource) {
          heatSource.setData(geoJsonData);
        }
      }
    }
  }, [geoJsonData, isMapInitialized, showHeatmap]);

  const updateClusterStats = () => {
    if (!mapRef.current || !showClustering) return;

    // This is a simplified stats calculation
    // In a real implementation, you'd query the cluster data
    const totalPoints = geoJsonData.features.length;
    const estimatedClusters = Math.ceil(totalPoints / 5); // Rough estimation
    
    setClusterStats({
      totalClusters: estimatedClusters,
      totalPoints,
      avgClusterSize: totalPoints / estimatedClusters
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
          <p className="text-muted-foreground">Carregando mapa avançado...</p>
        </div>
      </div>
    );
  }

  if (mapboxError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="text-muted-foreground">{mapboxError}</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center p-4">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-2" />
          <p className="text-muted-foreground">Token do Mapbox não configurado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-sm" />
      
      {/* Stats overlay */}
      {showClustering && clusterStats && (
        <Card className="absolute top-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Estatísticas do Clustering
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total de Pontos:</span>
              <Badge variant="outline">{clusterStats.totalPoints}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Clusters:</span>
              <Badge variant="outline">{clusterStats.totalClusters}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Média por Cluster:</span>
              <Badge variant="outline">{clusterStats.avgClusterSize.toFixed(1)}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode indicator */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
        <div className="flex gap-2">
          {showClustering && (
            <Badge variant="default">Clustering</Badge>
          )}
          {showHeatmap && (
            <Badge variant="secondary">Heatmap</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
