import type { Property } from '@/types/property';

export type HeatmapMetric = 'value' | 'density' | 'roi';

export interface PropertyMapFeatureProperties {
  id: string;
  title: string;
  address: string;
  city: string;
  value: number;
  status: string;
  type: string;
  imageUrl: string;
  metricValue?: number;
}

export interface HeatmapStats {
  minValue: number;
  maxValue: number;
  avgValue: number;
  hotspots: number;
}

export interface CityLocationStats {
  city: string;
  count: number;
  avgValue: number;
  totalValue: number;
  statusDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
}

export interface NeighborhoodLocationStats {
  neighborhood: string;
  count: number;
  avgValue: number;
  avgPricePerSqm: number | null;
  avgAnnualReturn: number | null;
}

export interface LocationAnalyticsData {
  totalProperties: number;
  totalValue: number;
  avgValue: number;
  occupiedCount: number;
  availableCount: number;
  occupancyRate: number;
  cityWithMostProperties: CityLocationStats | null;
  highestValueCity: CityLocationStats | null;
  cityStats: CityLocationStats[];
  neighborhoodStats: NeighborhoodLocationStats[];
}

type PointFeature = GeoJSON.Feature<GeoJSON.Point, PropertyMapFeatureProperties>;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toNonNegativeNumber = (value: unknown) =>
  isFiniteNumber(value) && value > 0 ? value : 0;

export function hasValidCoordinates(
  property: Pick<Property, 'latitude' | 'longitude'>,
): property is Property & { latitude: number; longitude: number } {
  return (
    isFiniteNumber(property.latitude) &&
    isFiniteNumber(property.longitude) &&
    property.latitude >= -90 &&
    property.latitude <= 90 &&
    property.longitude >= -180 &&
    property.longitude <= 180
  );
}

export function getAnnualReturnRate(property: Property): number | null {
  if (isFiniteNumber(property.annual_return_rate) && property.annual_return_rate >= 0) {
    return property.annual_return_rate;
  }

  const value = toNonNegativeNumber(property.value);
  const monthlyRent = toNonNegativeNumber(property.rental_value);
  if (!value || !monthlyRent) return null;

  return (monthlyRent * 12 * 100) / value;
}

export function getHeatmapMetricValue(property: Property, metric: HeatmapMetric): number | null {
  if (metric === 'density') return 1;
  if (metric === 'roi') return getAnnualReturnRate(property);

  const value = toNonNegativeNumber(property.value);
  return value || null;
}

function createFeature(property: Property, metric?: HeatmapMetric): PointFeature | null {
  if (!hasValidCoordinates(property)) return null;

  const metricValue = metric ? getHeatmapMetricValue(property, metric) : undefined;
  if (metric && metricValue === null) return null;

  return {
    type: 'Feature',
    properties: {
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      value: toNonNegativeNumber(property.value),
      status: property.status,
      type: property.type,
      imageUrl: property.image_url || '',
      ...(metricValue === undefined ? {} : { metricValue }),
    },
    geometry: {
      type: 'Point',
      coordinates: [property.longitude, property.latitude],
    },
  };
}

export function createPropertyFeatureCollection(
  properties: Property[],
  metric?: HeatmapMetric,
): GeoJSON.FeatureCollection<GeoJSON.Point, PropertyMapFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: properties
      .map((property) => createFeature(property, metric))
      .filter((feature): feature is PointFeature => feature !== null),
  };
}

export function calculateHeatmapStats(
  collection: GeoJSON.FeatureCollection<GeoJSON.Point, PropertyMapFeatureProperties>,
): HeatmapStats | null {
  const values = collection.features
    .map((feature) => feature.properties.metricValue)
    .filter(isFiniteNumber);

  if (!values.length) return null;

  const avgValue = values.reduce((total, value) => total + value, 0) / values.length;
  return {
    minValue: Math.min(...values),
    maxValue: Math.max(...values),
    avgValue,
    hotspots: values.filter((value) => value > avgValue * 1.5).length,
  };
}

export function getCoordinateBounds(
  properties: Array<Pick<Property, 'latitude' | 'longitude'>>,
): [[number, number], [number, number]] | null {
  const validProperties = properties.filter(hasValidCoordinates);
  if (!validProperties.length) return null;

  const longitudes = validProperties.map((property) => property.longitude);
  const latitudes = validProperties.map((property) => property.latitude);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}

export function calculateLocationAnalytics(properties: Property[]): LocationAnalyticsData {
  const cityMap = new Map<string, CityLocationStats>();
  const neighborhoodMap = new Map<
    string,
    NeighborhoodLocationStats & { pricePerSqmValues: number[]; annualReturnValues: number[] }
  >();

  let totalValue = 0;
  let occupiedCount = 0;
  let availableCount = 0;

  for (const property of properties) {
    const value = toNonNegativeNumber(property.value);
    const city = property.city.trim() || 'Cidade não informada';
    const cityStats = cityMap.get(city) || {
      city,
      count: 0,
      avgValue: 0,
      totalValue: 0,
      statusDistribution: {},
      typeDistribution: {},
    };

    cityStats.count += 1;
    cityStats.totalValue += value;
    cityStats.statusDistribution[property.status] =
      (cityStats.statusDistribution[property.status] || 0) + 1;
    cityStats.typeDistribution[property.type] =
      (cityStats.typeDistribution[property.type] || 0) + 1;
    cityMap.set(city, cityStats);

    totalValue += value;
    if (property.status === 'rented' || property.status === 'airbnb') occupiedCount += 1;
    if (property.status === 'available') availableCount += 1;

    const neighborhood = property.neighborhood?.trim();
    if (!neighborhood) continue;

    const neighborhoodStats = neighborhoodMap.get(neighborhood) || {
      neighborhood,
      count: 0,
      avgValue: 0,
      avgPricePerSqm: null,
      avgAnnualReturn: null,
      pricePerSqmValues: [],
      annualReturnValues: [],
    };

    neighborhoodStats.count += 1;
    neighborhoodStats.avgValue += value;

    const area = toNonNegativeNumber(property.area);
    const storedPricePerSqm = toNonNegativeNumber(property.square_meter_value);
    const pricePerSqm = storedPricePerSqm || (area ? value / area : 0);
    if (pricePerSqm) neighborhoodStats.pricePerSqmValues.push(pricePerSqm);

    const annualReturn = getAnnualReturnRate(property);
    if (annualReturn !== null) neighborhoodStats.annualReturnValues.push(annualReturn);

    neighborhoodMap.set(neighborhood, neighborhoodStats);
  }

  const cityStats = Array.from(cityMap.values())
    .map((stats) => ({ ...stats, avgValue: stats.totalValue / stats.count }))
    .sort((left, right) => right.count - left.count || left.city.localeCompare(right.city));

  const neighborhoodStats = Array.from(neighborhoodMap.values())
    .map(({ pricePerSqmValues, annualReturnValues, ...stats }) => ({
      ...stats,
      avgValue: stats.avgValue / stats.count,
      avgPricePerSqm: pricePerSqmValues.length
        ? pricePerSqmValues.reduce((total, value) => total + value, 0) / pricePerSqmValues.length
        : null,
      avgAnnualReturn: annualReturnValues.length
        ? annualReturnValues.reduce((total, value) => total + value, 0) / annualReturnValues.length
        : null,
    }))
    .sort((left, right) => right.count - left.count || left.neighborhood.localeCompare(right.neighborhood));

  const totalProperties = properties.length;
  return {
    totalProperties,
    totalValue,
    avgValue: totalProperties ? totalValue / totalProperties : 0,
    occupiedCount,
    availableCount,
    occupancyRate: totalProperties ? (occupiedCount / totalProperties) * 100 : 0,
    cityWithMostProperties: cityStats[0] || null,
    highestValueCity:
      cityStats.reduce<CityLocationStats | null>(
        (highest, current) => (!highest || current.avgValue > highest.avgValue ? current : highest),
        null,
      ),
    cityStats,
    neighborhoodStats,
  };
}
