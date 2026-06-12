
import { useState, useRef, useMemo, useEffect } from 'react';
import { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { useMapboxLoader } from '@/hooks/use-mapbox-loader';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Settings, RefreshCw } from 'lucide-react';
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [clusterStats, setClusterStats] = useState<{
    totalClusters: number;
    totalPoints: number;
    avgClusterSize: number;
  } | null>(null);

  const { getTokenForContext, getStyleForContext, isReady, error: contextError, retryInitialization } = useMapbox();
  const { isLoaded: mapboxLoaded, error: mapboxError, retryLoad } = useMapboxLoader();

  const token = isReady ? getTokenForContext('mapbox_token_property_list') : null;
  const mapStyle = getStyleForContext('mapbox_style_property_list');

  console.log('PropertyClusterMap: State check', {
    isReady,
    mapboxLoaded,
    token: !!token,
    contextError,
    mapboxError,
    propertiesCount: properties.length,
    isMapInitialized
  });

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
      console.log('PropertyClusterMap: Skipping initialization', {
        mapboxLoaded,
        token: !!token,
        container: !!mapContainer.current,
        mapboxgl: !!window.mapboxgl,
        existingMap: !!mapRef.current,
        isReady
      });
      return;
    }

    try {
      console.log('PropertyClusterMap: Initializing map');
      setMapError(null);
      
      window.mapboxgl.accessToken = token;
      
      mapRef.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-46.633308, -23.550520],
        zoom: 10
      });

      mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      mapRef.current.on('load', () => {
        console.log('PropertyClusterMap: Map loaded, setting up clustering');
        try {
          setupClustering();
          if (showHeatmap) {
            setupHeatmap();
          }
          setIsMapInitialized(true);
          setMapError(null);
        } catch (err) {
          console.error('PropertyClusterMap: Error setting up layers:', err);
          setMapError('Erro ao configurar camadas do mapa');
        }
      });

      mapRef.current.on('error', (e: any) => {
        console.error('PropertyClusterMap: Map error:', e);
        setMapError('Erro no mapa: ' + (e.error?.message || 'Erro desconhecido'));
      });

    } catch (err) {
      console.error('PropertyClusterMap: Error initializing map:', err);
      setMapError('Erro ao inicializar o mapa');
    }
  }, [mapboxLoaded, token, mapStyle, isReady]);

  // Setup clustering
  const setupClustering = () => {
    if (!mapRef.current) return;

    try {
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
            ['==', ['get', 'status'], 'available'], '#4a7c59',
            ['==', ['get', 'status'], 'rented'], '#6f8f74',
            ['==', ['get', 'status'], 'airbnb'], '#c4934f',
            ['==', ['get', 'status'], 'maintenance'], '#f59e0b',
            ['==', ['get', 'status'], 'sold'], '#78716c',
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

    } catch (error) {
      console.error('PropertyClusterMap: Error in setupClustering:', error);
      throw error;
    }
  };

  // Setup heatmap
  const setupHeatmap = () => {
    if (!mapRef.current) return;

    try {
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
    } catch (error) {
      console.error('PropertyClusterMap: Error in setupHeatmap:', error);
      throw error;
    }
  };

  // Update data when properties change
  useEffect(() => {
    if (mapRef.current && isMapInitialized) {
      try {
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
      } catch (error) {
        console.error('PropertyClusterMap: Error updating data:', error);
        setMapError('Erro ao atualizar dados do mapa');
      }
    }
  }, [geoJsonData, isMapInitialized, showHeatmap]);

  const updateClusterStats = () => {
    if (!mapRef.current || !showClustering) return;

    // This is a simplified stats calculation
    const totalPoints = geoJsonData.features.length;
    const estimatedClusters = Math.ceil(totalPoints / 5); // Rough estimation
    
    setClusterStats({
      totalClusters: estimatedClusters,
      totalPoints,
      avgClusterSize: totalPoints / estimatedClusters
    });
  };

  const handleRetry = () => {
    console.log('PropertyClusterMap: Retrying map initialization');
    setMapError(null);
    setIsMapInitialized(false);
    
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    retryInitialization();
    retryLoad();
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
          <p className="text-muted-foreground">Carregando mapa de clustering...</p>
        </div>
      </div>
    );
  }

  if (contextError || mapboxError || mapError) {
    const errorMessage = mapError || contextError || mapboxError;
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Erro no Mapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button onClick={handleRetry} size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Token Necessário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Token do Mapbox não configurado para clustering
            </p>
            <Button onClick={handleRetry} size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </CardContent>
        </Card>
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
