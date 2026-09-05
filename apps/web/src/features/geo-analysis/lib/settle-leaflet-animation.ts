import type { Map } from 'leaflet';

/**
 * Leaflet 1.x remove() cancels pan/fly frames, but not the 250ms zoom-end
 * fallback. Complete that transition while its panes still exist. The pending
 * fallback then sees _animatingZoom=false and becomes a no-op.
 *
 * This narrow compatibility boundary deliberately keeps interactive zoom and
 * animation enabled. Its private API dependency is covered with real Leaflet
 * zoom/remove regression tests, and must be reviewed on a Leaflet upgrade.
 */
export function settleLeafletAnimation(map: Map): void {
  if (!map.getPane('mapPane')) return;
  const lifecycle = map as Map & {
    _animatingZoom?: boolean;
    _onZoomTransitionEnd?: () => void;
  };
  if (lifecycle._animatingZoom && lifecycle._onZoomTransitionEnd) {
    lifecycle._onZoomTransitionEnd();
  }
  map.stop();
}
