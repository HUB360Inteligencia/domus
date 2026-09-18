import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import type { Property } from '@/types/property';
import { useMapbox } from '@/contexts/MapboxContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  calculateHeatmapStats,
  createPropertyFeatureCollection,
  getHeatmapMetricValue,
  hasValidCoordinates,
  type HeatmapMetric,
  type PropertyMapFeatureProperties,
} from '@/lib/property-map-data';
import {
  applyBaseLayerVisibility,
  fitMapToProperties,
  setMapLayerVisibility,
  type MapLayerVisibility,
} from '@/lib/mapbox-map';

interface PropertyHeatmapProps {
  properties: Property[];
  metric: HeatmapMetric;
  mapStyle: string;
  layers: MapLayerVisibility;
  fitRequestId: number;
}

const HEATMAP_LAYER_IDS = ['properties-heatmap', 'properties-points'];

export function PropertyHeatmap({
  properties,
  metric,
  mapStyle,
  layers,
  fitRequestId,
}: PropertyHeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { token } = useMapbox();
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const geoJsonData = useMemo(
    () => createPropertyFeatureCollection(properties, metric),
    [metric, properties],
  );
  const heatmapStats = useMemo(() => calculateHeatmapStats(geoJsonData), [geoJsonData]);
  const metricProperties = useMemo(
    () => properties.filter((property) => hasValidCoordinates(property) && getHeatmapMetricValue(property, metric) !== null),
    [metric, properties],
  );
  const geoJsonDataRef = useRef(geoJsonData);
  const metricRef = useRef(metric);
  geoJsonDataRef.current = geoJsonData;
  metricRef.current = metric;

  useEffect(() => {
    if (!token || !mapContainer.current) return;

    setIsMapLoaded(false);
    setMapError(null);
    mapboxgl.accessToken = token;
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-46.633308, -23.55052],
      zoom: 10,
    });
    mapRef.current = mapInstance;
    let didLoad = false;
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapInstance.on('load', () => {
      didLoad = true;
      setMapError(null);
      addHeatmapLayers(mapInstance, geoJsonDataRef.current);
      bindHeatmapInteractions(mapInstance, () => metricRef.current);
      setIsMapLoaded(true);
    });
    mapInstance.on('error', (event) => {
      if (didLoad) return;
      setMapError(event.error?.message || 'Erro ao carregar o mapa de calor.');
      setIsMapLoaded(false);
    });

    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
  }, [mapStyle, retryKey, token]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !isMapLoaded) return;

    const source = mapInstance.getSource('properties-heatmap') as mapboxgl.GeoJSONSource | undefined;
    source?.setData(geoJsonData);
    updateHeatmapPaint(mapInstance, getMaxMetricValue(geoJsonData));
    fitMapToProperties(mapInstance, metricProperties);
  }, [geoJsonData, isMapLoaded, metricProperties]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !isMapLoaded) return;

    applyBaseLayerVisibility(mapInstance, layers);
    setMapLayerVisibility(mapInstance, HEATMAP_LAYER_IDS, layers.properties);
  }, [isMapLoaded, layers]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !isMapLoaded) return;
    fitMapToProperties(mapInstance, metricProperties);
  }, [fitRequestId, isMapLoaded, metricProperties]);

  if (!token) return <HeatmapStatus message="Token do Mapbox não configurado." />;

  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      <div ref={mapContainer} className="h-full w-full" />

      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando mapa de calor...</span>
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
          <p className="max-w-md text-sm text-muted-foreground">
            {metric === 'roi'
              ? 'Nenhum imóvel possui valor e aluguel ou taxa anual suficientes para calcular o retorno.'
              : 'Nenhum imóvel com coordenadas e valores válidos para esta métrica.'}
          </p>
        </div>
      )}

      {heatmapStats && layers.properties && (
        <Card className="absolute bottom-4 left-4 z-10 w-64 bg-white/95 backdrop-blur-sm dark:bg-background/95">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Estatísticas reais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-xs">
            <Stat label="Mínimo" value={formatMetricValue(heatmapStats.minValue, metric)} />
            <Stat label="Máximo" value={formatMetricValue(heatmapStats.maxValue, metric)} />
            <Stat label="Média" value={formatMetricValue(heatmapStats.avgValue, metric)} />
            <Stat label="Hotspots" value={String(heatmapStats.hotspots)} />
          </CardContent>
        </Card>
      )}

      {isMapLoaded && layers.properties && geoJsonData.features.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 rounded-lg bg-white/90 p-3 text-xs shadow-sm backdrop-blur-sm dark:bg-background/90">
          <div className="mb-2 font-medium">Intensidade: {getMetricLabel(metric)}</div>
          <div className="flex items-center gap-2">
            <span>Baixa</span>
            <div className="h-3 w-20 rounded bg-gradient-to-r from-blue-200 via-yellow-200 to-red-500" />
            <span>Alta</span>
          </div>
        </div>
      )}
    </div>
  );
}

function addHeatmapLayers(
  map: mapboxgl.Map,
  data: GeoJSON.FeatureCollection<GeoJSON.Point, PropertyMapFeatureProperties>,
) {
  map.addSource('properties-heatmap', { type: 'geojson', data });
  map.addLayer({
    id: 'properties-heatmap',
    type: 'heatmap',
    source: 'properties-heatmap',
    maxzoom: 15,
    paint: {
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
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 30],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 0.5],
    },
  });
  map.addLayer({
    id: 'properties-points',
    type: 'circle',
    source: 'properties-heatmap',
    minzoom: 14,
    paint: {
      'circle-stroke-color': 'white',
      'circle-stroke-width': 1,
      'circle-opacity': 0.8,
    },
  });
  updateHeatmapPaint(map, getMaxMetricValue(data));
}

function updateHeatmapPaint(map: mapboxgl.Map, maxMetricValue: number) {
  if (!map.getLayer('properties-heatmap') || !map.getLayer('properties-points')) return;

  map.setPaintProperty('properties-heatmap', 'heatmap-weight', [
    'interpolate', ['linear'], ['get', 'metricValue'], 0, 0, maxMetricValue, 1,
  ]);
  map.setPaintProperty('properties-points', 'circle-radius', [
    'interpolate', ['linear'], ['get', 'metricValue'], 0, 4, maxMetricValue, 20,
  ]);
  map.setPaintProperty('properties-points', 'circle-color', [
    'interpolate', ['linear'], ['get', 'metricValue'],
    0, '#f7fafc',
    maxMetricValue * 0.5, '#fed7d7',
    maxMetricValue, '#c53030',
  ]);
}

function bindHeatmapInteractions(map: mapboxgl.Map, getMetric: () => HeatmapMetric) {
  map.on('click', 'properties-points', (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point' || !feature.properties) return;

    const properties = feature.properties;
    const metric = getMetric();
    const content = document.createElement('div');
    content.className = 'min-w-[210px] space-y-2 p-2 text-sm';
    content.appendChild(createText('h3', 'font-semibold', String(properties.title)));
    content.appendChild(
      createText('p', 'text-xs text-gray-600', `${String(properties.address)}, ${String(properties.city)}`),
    );
    content.appendChild(createText('p', 'text-xs', `Valor: ${formatCurrency(Number(properties.value) || 0)}`));
    content.appendChild(
      createText(
        'p',
        'text-xs font-medium',
        `${getMetricLabel(metric)}: ${formatMetricValue(Number(properties.metricValue) || 0, metric)}`,
      ),
    );

    new mapboxgl.Popup({ offset: 12 })
      .setLngLat(feature.geometry.coordinates as [number, number])
      .setDOMContent(content)
      .addTo(map);
  });
  map.on('mouseenter', 'properties-points', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'properties-points', () => {
    map.getCanvas().style.cursor = '';
  });
}

function getMaxMetricValue(
  data: GeoJSON.FeatureCollection<GeoJSON.Point, PropertyMapFeatureProperties>,
) {
  return Math.max(
    ...data.features.map((feature) => feature.properties.metricValue || 0),
    1,
  );
}

function getMetricLabel(metric: HeatmapMetric) {
  if (metric === 'density') return 'Densidade';
  if (metric === 'roi') return 'Retorno anual';
  return 'Valor';
}

function formatMetricValue(value: number, metric: HeatmapMetric) {
  if (metric === 'density') return `${value.toFixed(0)} imóvel(eis)`;
  if (metric === 'roi') return `${value.toFixed(1)}% a.a.`;
  return formatCurrency(value);
}

function createText(tag: keyof HTMLElementTagNameMap, className: string, text: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}

function HeatmapStatus({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg bg-muted p-4 text-center">
      <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
