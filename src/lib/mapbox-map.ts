import type { Map as MapboxMap } from 'mapbox-gl';
import type { Property } from '@/types/property';
import { getCoordinateBounds, hasValidCoordinates } from '@/lib/property-map-data';

export interface MapLayerVisibility {
  properties: boolean;
  boundaries: boolean;
  poi: boolean;
  transit: boolean;
}

const BASE_LAYER_MATCHERS: Record<Exclude<keyof MapLayerVisibility, 'properties'>, RegExp> = {
  boundaries: /(admin|boundary)/i,
  poi: /(^|[-_])(poi|place-label)([-_]|$)/i,
  transit: /(transit|rail|airport|ferry)/i,
};

export function fitMapToProperties(map: MapboxMap, properties: Property[], padding = 64) {
  const validProperties = properties.filter(hasValidCoordinates);
  const bounds = getCoordinateBounds(validProperties);
  if (!bounds) return;

  if (validProperties.length === 1) {
    map.easeTo({ center: bounds[0], zoom: 15, duration: 500 });
    return;
  }

  map.fitBounds(bounds, { padding, maxZoom: 15, duration: 500 });
}

export function setMapLayerVisibility(map: MapboxMap, layerIds: string[], isVisible: boolean) {
  const visibility = isVisible ? 'visible' : 'none';
  for (const layerId of layerIds) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visibility);
  }
}

export function applyBaseLayerVisibility(
  map: MapboxMap,
  layers: Pick<MapLayerVisibility, 'boundaries' | 'poi' | 'transit'>,
) {
  const styleLayers = map.getStyle().layers || [];

  for (const [category, matcher] of Object.entries(BASE_LAYER_MATCHERS) as Array<
    [keyof typeof BASE_LAYER_MATCHERS, RegExp]
  >) {
    const visibility = layers[category] ? 'visible' : 'none';
    for (const layer of styleLayers) {
      if (matcher.test(layer.id)) map.setLayoutProperty(layer.id, 'visibility', visibility);
    }
  }
}
