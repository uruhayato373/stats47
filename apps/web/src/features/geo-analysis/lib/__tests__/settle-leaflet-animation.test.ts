import { latLng, map as createMap, type Map } from 'leaflet';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { settleLeafletAnimation } from '../settle-leaflet-animation';

type ZoomMap = Map & {
  _animateZoom: (
    center: ReturnType<typeof latLng>,
    zoom: number,
    start: boolean
  ) => void;
  _animatingZoom: boolean;
};
function fixture() {
  const container = document.createElement('div');
  document.body.append(container);
  return createMap(container, { center: [35, 139], zoom: 6 }) as ZoomMap;
}
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Leaflet zoom/unmount lifecycle', () => {
  it('未修正Leafletはズーム中remove後の250ms timerが削除paneを参照する', () => {
    vi.useFakeTimers();
    const map = fixture();
    map._animateZoom(latLng(35, 139), 7, true);
    map.remove();
    expect(() => vi.advanceTimersByTime(300)).toThrow(/_leaflet_pos/);
  });
  it('pane削除前にズームを完了させ、遅延timerを無害化する（操作は無効化しない）', () => {
    vi.useFakeTimers();
    const map = fixture();
    map._animateZoom(latLng(35, 139), 7, true);
    expect(map._animatingZoom).toBe(true);
    settleLeafletAnimation(map);
    expect(map._animatingZoom).toBe(false);
    expect(map.getZoom()).toBe(7);
    expect(map.options.zoomAnimation).toBe(true);
    expect(map.dragging.enabled()).toBe(true);
    map.remove();
    expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    expect(() => settleLeafletAnimation(map)).not.toThrow();
  });
});
