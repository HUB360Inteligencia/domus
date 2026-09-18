# Map Reliability Fixes

## Goal

Make every property map mode deterministic, interactive, safe, and covered by automated regression tests.

## Completed

- [x] Consolidated Mapbox usage and removed duplicate runtime loaders from active code.
- [x] Fixed the standard, detail, and form-preview maps, including explicit invalid-coordinate states and safe DOM popups.
- [x] Rebuilt clustering and heatmap behavior so data, styles, layers, visibility, and viewport controls update the rendered map.
- [x] Replaced simulated geographic analytics with calculations from property data.
- [x] Repaired advanced-map navigation, error states, and controls, including the ability to leave Analytics mode.
- [x] Added deterministic unit and interaction tests for map data, popups, and advanced navigation.
- [x] Passed map-targeted lint, TypeScript, production build, tests, diff checks, and Mapbox API smoke checks.

## Verification

- [x] 32 automated tests pass across 6 test files.
- [x] TypeScript compilation passes with no errors.
- [x] Production build succeeds.
- [x] Map-targeted ESLint passes with no warnings or errors.
- [x] Mapbox style and geocoding endpoints both return HTTP 200 with the configured token.
- [x] No known functional defect, fake metric, or nonfunctional visible control from the map audit remains.
