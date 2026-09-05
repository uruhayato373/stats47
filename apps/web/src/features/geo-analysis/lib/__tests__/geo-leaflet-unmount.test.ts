import { existsSync, readFileSync } from 'node:fs';

import {
  canvas,
  circleMarker,
  latLng,
  map as createMap,
  type Map,
} from 'leaflet';
import { afterEach, describe, expect, it, vi } from 'vitest';

type ZoomMap = Map & {
  _animateZoom: (
    center: ReturnType<typeof latLng>,
    zoom: number,
    start: boolean
  ) => void;
  _onZoomTransitionEnd: () => void;
};

function fixture(zoomAnimation = true) {
  const container = document.createElement('div');
  document.body.append(container);
  const context = new Proxy({}, { get: () => vi.fn() });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as CanvasRenderingContext2D
  );
  const map = createMap(container, {
    center: [35, 139],
    zoom: 6,
    zoomAnimation,
  }) as ZoomMap;
  circleMarker([35, 139], { renderer: canvas() }).addTo(map);
  return map;
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Geo map zoom/unmount safety', () => {
  it('旧cleanupのzoom完了はCanvas再描画を残して破棄後に例外を起こす', () => {
    vi.useFakeTimers();
    const map = fixture();
    const errors: Error[] = [];
    const capture = (event: ErrorEvent) => {
      errors.push(event.error);
      event.preventDefault();
    };
    window.addEventListener('error', capture);
    map._animateZoom(latLng(35, 139), 7, true);
    map._onZoomTransitionEnd();
    map.stop();
    map.remove();
    vi.advanceTimersByTime(300);
    window.removeEventListener('error', capture);
    expect(errors.map((error) => error.message).join('\n')).toMatch(
      /clearRect|save/
    );
  });

  it('公開optionでアニメーションだけ止め、ズーム・ドラッグを維持して安全に破棄する', () => {
    vi.useFakeTimers();
    const map = fixture(false);
    vi.advanceTimersByTime(32);
    map.zoomIn();
    expect(map.getZoom()).toBe(7);
    expect(map.dragging.enabled()).toBe(true);
    map.remove();
    expect(() => vi.advanceTimersByTime(300)).not.toThrow();
  });

  it.each(['GeoSpatialLeafletMap', 'GeoStationAccessLeafletMap'])(
    '%sで両地図に同じ公開optionを適用する',
    (component) => {
      const webRoot = existsSync('apps/web/src') ? 'apps/web/' : '';
      const source = readFileSync(
        `${webRoot}src/features/geo-analysis/components/${component}.tsx`,
        'utf8'
      );
      expect(source).toContain('zoomAnimation={false}');
      expect(source).not.toContain('GeoLeafletLifecycle');
    }
  );
});
