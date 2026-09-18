import { describe, expect, it } from 'vitest';
import type { Property } from '@/types/property';
import {
  calculateHeatmapStats,
  calculateLocationAnalytics,
  createPropertyFeatureCollection,
  getAnnualReturnRate,
  getCoordinateBounds,
  hasValidCoordinates,
} from '@/lib/property-map-data';

function createProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'property-1',
    title: 'Apartamento Centro',
    address: 'Rua Principal, 100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    type: 'apartment',
    status: 'available',
    value: 600_000,
    rental_value: 3_000,
    area: 60,
    latitude: -23.55052,
    longitude: -46.633308,
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('property map coordinates', () => {
  it('accepts zero coordinates and rejects missing or out-of-range values', () => {
    expect(hasValidCoordinates(createProperty({ latitude: 0, longitude: 0 }))).toBe(true);
    expect(hasValidCoordinates(createProperty({ latitude: null }))).toBe(false);
    expect(hasValidCoordinates(createProperty({ longitude: 181 }))).toBe(false);
    expect(hasValidCoordinates(createProperty({ latitude: -91 }))).toBe(false);
  });

  it('calculates bounds using only valid coordinates', () => {
    expect(
      getCoordinateBounds([
        createProperty({ latitude: 0, longitude: 0 }),
        createProperty({ id: 'property-2', latitude: -10, longitude: 20 }),
        createProperty({ id: 'property-3', latitude: null, longitude: null }),
      ]),
    ).toEqual([[0, -10], [20, 0]]);
  });
});

describe('property map feature data', () => {
  it('filters invalid coordinates from cluster data', () => {
    const collection = createPropertyFeatureCollection([
      createProperty(),
      createProperty({ id: 'property-2', latitude: undefined, longitude: undefined }),
    ]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties.id).toBe('property-1');
  });

  it('uses stored ROI, falls back to annual rent, and never invents a value', () => {
    expect(getAnnualReturnRate(createProperty({ annual_return_rate: 8.5 }))).toBe(8.5);
    expect(getAnnualReturnRate(createProperty())).toBe(6);
    expect(getAnnualReturnRate(createProperty({ rental_value: 0 }))).toBeNull();
  });

  it('builds deterministic ROI heatmap data and excludes properties without ROI inputs', () => {
    const properties = [
      createProperty(),
      createProperty({ id: 'property-2', value: 500_000, rental_value: 0 }),
    ];

    const first = createPropertyFeatureCollection(properties, 'roi');
    const second = createPropertyFeatureCollection(properties, 'roi');

    expect(first).toEqual(second);
    expect(first.features).toHaveLength(1);
    expect(first.features[0].properties.metricValue).toBe(6);
  });

  it('calculates heatmap statistics without component state', () => {
    const collection = createPropertyFeatureCollection([
      createProperty({ id: 'property-1', value: 100_000 }),
      createProperty({ id: 'property-2', value: 200_000 }),
      createProperty({ id: 'property-3', value: 900_000 }),
    ], 'value');

    expect(calculateHeatmapStats(collection)).toEqual({
      minValue: 100_000,
      maxValue: 900_000,
      avgValue: 400_000,
      hotspots: 1,
    });
  });
});

describe('location analytics', () => {
  it('returns a safe empty result', () => {
    expect(calculateLocationAnalytics([])).toMatchObject({
      totalProperties: 0,
      totalValue: 0,
      avgValue: 0,
      occupancyRate: 0,
      cityWithMostProperties: null,
      highestValueCity: null,
      cityStats: [],
      neighborhoodStats: [],
    });
  });

  it('uses real neighborhood, price-per-square-meter, occupancy, and return data', () => {
    const analytics = calculateLocationAnalytics([
      createProperty({ status: 'rented' }),
      createProperty({
        id: 'property-2',
        title: 'Casa Centro',
        type: 'house',
        status: 'airbnb',
        value: 400_000,
        rental_value: 2_000,
        area: 80,
      }),
      createProperty({
        id: 'property-3',
        city: 'Campinas',
        neighborhood: 'Cambuí',
        status: 'available',
        value: 300_000,
        rental_value: 0,
        square_meter_value: 7_500,
      }),
    ]);

    expect(analytics.totalProperties).toBe(3);
    expect(analytics.occupiedCount).toBe(2);
    expect(analytics.availableCount).toBe(1);
    expect(analytics.occupancyRate).toBeCloseTo(66.67, 2);
    expect(analytics.cityWithMostProperties?.city).toBe('São Paulo');
    expect(analytics.highestValueCity?.city).toBe('São Paulo');
    expect(analytics.neighborhoodStats[0]).toMatchObject({
      neighborhood: 'Centro',
      count: 2,
      avgValue: 500_000,
      avgPricePerSqm: 7_500,
      avgAnnualReturn: 6,
    });
  });
});
