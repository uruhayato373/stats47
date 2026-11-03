import { canvas, type Canvas, type RendererOptions } from 'leaflet';

type CanvasRedraw = Canvas & { _redraw: () => void };

/** Keep a queued frame from painting a canvas after its map has been removed. */
export function createGeoCanvasRenderer(options?: RendererOptions): Canvas {
  const renderer = canvas(options) as CanvasRedraw;
  const redraw = renderer._redraw;
  let attached = false;
  renderer.on('add', () => {
    attached = true;
  });
  renderer.on('remove', () => {
    attached = false;
  });
  // Leaflet 1.9 cancels its queued frame on removal, but an already queued
  // callback can still reach _redraw. Restrict this guard to our own instance.
  renderer._redraw = () => {
    if (attached) redraw.call(renderer);
  };
  return renderer;
}
