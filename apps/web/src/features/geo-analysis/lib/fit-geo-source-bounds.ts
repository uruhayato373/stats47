import L from 'leaflet';

const FIT_PADDING = 18;
const FIT_MAX_ZOOM = 13;

/** Keep global source bounds visible even when a narrow map barely fits zoom 0. */
export function fitGeoSourceBounds(
  map: L.Map,
  bounds: L.LatLngBoundsExpression
) {
  const extent =
    bounds instanceof L.LatLngBounds ? bounds : L.latLngBounds(bounds);
  const minimumZoom = map.getMinZoom();
  const projectedSize = map
    .project(extent.getNorthEast(), minimumZoom)
    .subtract(map.project(extent.getSouthWest(), minimumZoom));
  const viewport = map.getSize();
  const padding = Math.max(
    0,
    Math.min(
      FIT_PADDING,
      Math.floor((viewport.x - Math.abs(projectedSize.x)) / 2),
      Math.floor((viewport.y - Math.abs(projectedSize.y)) / 2)
    )
  );
  map.fitBounds(extent, {
    padding: L.point(padding, padding),
    maxZoom: FIT_MAX_ZOOM,
    animate: false,
  });
}
