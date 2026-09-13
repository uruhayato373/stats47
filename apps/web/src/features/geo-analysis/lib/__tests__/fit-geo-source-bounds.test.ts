import L from 'leaflet';
import { afterEach, describe, expect, it } from 'vitest';

import { fitGeoSourceBounds } from '../fit-geo-source-bounds';

const maps: L.Map[] = [];
function createMap(width: number, height: number) {
  const container = document.createElement('div');
  Object.defineProperties(container, {
    clientWidth: { value: width },
    clientHeight: { value: height },
  });
  document.body.append(container);
  const map = L.map(container, { minZoom: 0, zoomAnimation: false }).setView(
    [36, 138],
    5
  );
  maps.push(map);
  return map;
}

afterEach(() => {
  for (const map of maps.splice(0)) {
    const container = map.getContainer();
    map.remove();
    container.remove();
  }
});

describe('source map full-extent fitting', () => {
  const internationalRoutes = L.latLngBounds(
    [-51.700011, -175.220564],
    [64.150024, 179.216647]
  );

  it.each([
    [262, 420],
    [980, 560],
  ])(
    'shows all international route bounds in a %i × %i map, including after reset',
    (width, height) => {
      const map = createMap(width, height);
      fitGeoSourceBounds(map, internationalRoutes);
      expect(map.getBounds().contains(internationalRoutes)).toBe(true);
      map.setView([35, 139], 10);
      fitGeoSourceBounds(map, internationalRoutes);
      expect(map.getBounds().contains(internationalRoutes)).toBe(true);
      expect(map.getZoom()).toBeGreaterThanOrEqual(0);
    }
  );

  it('retains the existing padding and zoom for a prefecture extent', () => {
    const extent = L.latLngBounds([33, 132.5], [34, 134.5]);
    const map = createMap(262, 420);
    map.fitBounds(extent, {
      padding: L.point(18, 18),
      maxZoom: 13,
      animate: false,
    });
    const previous = { center: map.getCenter(), zoom: map.getZoom() };
    fitGeoSourceBounds(map, extent);
    expect(map.getCenter()).toEqual(previous.center);
    expect(map.getZoom()).toBe(previous.zoom);
    expect(map.getBounds().contains(extent)).toBe(true);
  });

  it('keeps a single facility within the existing maximum initial zoom', () => {
    const map = createMap(262, 420);
    const extent = L.latLngBounds([35, 139], [35, 139]);
    fitGeoSourceBounds(map, [
      [35, 139],
      [35, 139],
    ]);
    expect(map.getZoom()).toBe(13);
    expect(map.getBounds().contains(extent)).toBe(true);
  });
});
