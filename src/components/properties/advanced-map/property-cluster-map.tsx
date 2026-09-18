import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import type { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createPropertyFeatureCollection } from '@/lib/property-map-data';
import { createPropertyPopupContent } from '@/lib/property-map-dom';
import {
  applyBaseLayerVisibility,
  fitMapToProperties,
  setMapLayerVisibility,
  type MapLayerVisibility,
} from '@/lib/mapbox-map';

interface PropertyClusterMapProps {
  properties: Property[];
  onSelect: (id: string) => void;
  showClustering: boolean;
  showHeatmap: boolean;
  mapStyle: string;
  layers: MapLayerVisibility;
  fitRequestId: number;
}

interface ClusterStats {
  totalClusters: number;
  totalPoints: number;
  avgClusterSize: number;
}

const PROPERTY_LAYER_IDS = ['clusters', 'cluster-count', 'unclustered-point'];
const HEATMAP_LAYER_IDS = ['properties-heat'];

export function PropertyClusterMap({
  properties,
  onSelect,
  showClustering,
  showHeatmap,
  mapStyle,
  layers,
  fitRequestId,
}: PropertyClusterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { token } = useMapbox();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [clusterStats, setClusterStats] = useState<ClusterStats | null>(null);
  const geoJsonData = useMemo(() => createPropertyFeatureCollection(properties), [properties]);
  const geoJsonDataRef = useRef(geoJsonData);
  const onSelectRef = useRef(onSelect);
  geoJsonDataRef.current = geoJsonData;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!token || !mapContainer.current) return;

    setIsMapLoaded(false);
    setMapError(null);
    setClusterStats(null);
    mapboxgl.accessToken = token;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-46.633308, -23.55052],
      zoom: 10,
    });
    mapRef.current = mapInstance;
    let didLoad = false;
    let statsFrame: number | null = null;
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const updateStats = () => {
      if (!mapInstance.getSource('properties')) return;
      if (!showClustering) {
        setClusterStats(null);
        return;
      }

      const clusterFeatures = mapInstance
        .querySourceFeatures('properties')
        .filter((feature) => feature.properties?.cluster);
      const uniqueClusters = new Map<number, number>();
      for (const feature of clusterFeatures) {
        const clusterId = Number(feature.properties?.cluster_id);
        const pointCount = Number(feature.properties?.point_count);
        if (Number.isFinite(clusterId) && Number.isFinite(pointCount)) {
          uniqueClusters.set(clusterId, pointCount);
        }
      }

      const clusteredPoints = Array.from(uniqueClusters.values()).reduce(
        (total, pointCount) => total + pointCount,
        0,
      );
      const nextStats = {
        totalClusters: uniqueClusters.size,
        totalPoints: geoJsonDataRef.current.features.length,
        avgClusterSize: uniqueClusters.size ? clusteredPoints / uniqueClusters.size : 0,
      };
      setClusterStats((current) =>
        current &&
        current.totalClusters === nextStats.totalClusters &&
        current.totalPoints === nextStats.totalPoints &&
        current.avgClusterSize === nextStats.avgClusterSize
          ? current
          : nextStats,
      );
    };

    mapInstance.on('load', () => {
      didLoad = true;
      setMapError(null);
      addPropertyLayers(mapInstance, geoJsonDataRef.current, showClustering, showHeatmap);
      bindClusterInteractions(mapInstance, (id) => onSelectRef.current(id));
      setIsMapLoaded(true);
      statsFrame = window.requestAnimationFrame(updateStats);
    });
    mapInstance.on('moveend', updateStats);
    mapInstance.on('error', (event) => {
      if (didLoad) return;
      setMapError(event.error?.message || 'Erro ao carregar o mapa de clusters.');
      setIsMapLoaded(false);
    });

    return () => {
      if (statsFrame !== null) window.cancelAnimationFrame(statsFrame);
      mapInstance.remove();
      mapRef.current = null;
    };
  }, [mapStyle, retryKey, showClustering, showHeatmap, token]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !isMapLoaded) return;

    const propertySource = mapInstance.getSource('properties') as mapboxgl.GeoJSONSource | undefined;
    propertySource?.setData(geoJsonData);
    const heatSource = mapInstance.getSource('properties-heat') as mapboxgl.GeoJSONSource | undefined;
    heatSource?.setData(geoJsonData);
    fitMapToProperties(mapInstance, properties);
  }, [geoJsonData, isMapLoaded, properties]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !isMapLoaded) return;

    applyBaseLayerVisibility(mapInstance, layers);
    setMapLayerVisibility(mapInstance, PROPERTY_LAYER_IDS, layers.properties);
    setMapLayerVisibility(mapInstance, HEATMAP_LAYER_IDS, layers.properties && showHeatmap);
  }, [isMapLoaded, layers, showHeatmap]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !isMapLoaded) return;
    fitMapToProperties(mapInstance, properties);
  }, [fitRequestId, isMapLoaded, properties]);

  if (!token) return <ClusterMapStatus message="Token do Mapbox não configurado." />;

  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      <div ref={mapContainer} className="h-full w-full" />

      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando clusters...</span>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 p-4 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{mapError}</p>
          <Button className="mt-4" size="sm" onClick={() => setRetryKey((key) => key + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {isMapLoaded && !geoJsonData.features.length && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75 p-4 text-center backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">Nenhum imóvel com coordenadas válidas.</p>
        </div>
      )}

      {clusterStats && layers.properties && (
        <Card className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm dark:bg-background/95">
          <CardContent className="flex gap-4 p-3 text-xs">
            <span>Pontos: <Badge variant="outline">{clusterStats.totalPoints}</Badge></span>
            <span>Clusters visíveis: <Badge variant="outline">{clusterStats.totalClusters}</Badge></span>
            <span>Média: <Badge variant="outline">{clusterStats.avgClusterSize.toFixed(1)}</Badge></span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function addPropertyLayers(
  map: mapboxgl.Map,
  data: GeoJSON.FeatureCollection<GeoJSON.Point, import('@/lib/property-map-data').PropertyMapFeatureProperties>,
  showClustering: boolean,
  showHeatmap: boolean,
) {
  map.addSource('properties', {
    type: 'geojson',
    data,
    cluster: showClustering,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  if (showHeatmap) {
    map.addSource('properties-heat', { type: 'geojson', data });
    map.addLayer({
      id: 'properties-heat',
      type: 'heatmap',
      source: 'properties-heat',
      maxzoom: 15,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 1_000_000, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 24],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 15, 0.35],
      },
    });
  }

  if (showClustering) {
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'properties',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
      },
    });
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'properties',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12,
      },
    });
  }

  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'properties',
    ...(showClustering ? { filter: ['!', ['has', 'point_count']] } : {}),
    paint: {
      'circle-color': [
        'case',
        ['==', ['get', 'status'], 'available'], '#4a7c59',
        ['==', ['get', 'status'], 'rented'], '#6f8f74',
        ['==', ['get', 'status'], 'airbnb'], '#c4934f',
        ['==', ['get', 'status'], 'maintenance'], '#f59e0b',
        ['==', ['get', 'status'], 'sold'], '#78716c',
        '#6b7280',
      ],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
}

function bindClusterInteractions(map: mapboxgl.Map, onSelect: (id: string) => void) {
  if (map.getLayer('clusters')) {
    map.on('click', 'clusters', (event) => {
      const feature = event.features?.[0];
      const clusterId = Number(feature?.properties?.cluster_id);
      if (!feature || !Number.isFinite(clusterId) || feature.geometry.type !== 'Point') return;

      const source = map.getSource('properties') as mapboxgl.GeoJSONSource;
      const coordinates = feature.geometry.coordinates as [number, number];
      source.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error || zoom === null || zoom === undefined) return;
        map.easeTo({ center: coordinates, zoom });
      });
    });
  }

  map.on('click', 'unclustered-point', (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point' || !feature.properties) return;

    const properties = feature.properties;
    new mapboxgl.Popup({ offset: 12 })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setDOMContent(
        createPropertyPopupContent(
          {
            id: String(properties.id),
            title: String(properties.title),
            address: String(properties.address),
            city: String(properties.city),
            value: Number(properties.value) || 0,
            status: String(properties.status),
            type: String(properties.type),
            imageUrl: properties.imageUrl ? String(properties.imageUrl) : undefined,
          },
          onSelect,
        ),
      )
      .addTo(map);
  });

  for (const layerId of ['clusters', 'unclustered-point']) {
    if (!map.getLayer(layerId)) continue;
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });
  }
}

function ClusterMapStatus({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg bg-muted p-4 text-center">
      <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
