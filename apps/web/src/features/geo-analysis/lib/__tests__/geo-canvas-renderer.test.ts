import { Canvas } from 'leaflet';
import { describe, expect, it, vi } from 'vitest';

import { createGeoCanvasRenderer } from '../create-geo-canvas-renderer';

type CanvasRedraw = Canvas & { _redraw: () => void };

describe('Geo canvas lifecycle', () => {
  it('ignores an already queued redraw after the renderer is removed', () => {
    const paint = vi
      .spyOn(Canvas.prototype as CanvasRedraw, '_redraw')
      .mockImplementation(() => {});
    try {
      const renderer = createGeoCanvasRenderer() as CanvasRedraw;
      renderer.fire('add');
      const queuedFrame = renderer._redraw;
      renderer.fire('remove');
      queuedFrame();
      expect(paint).not.toHaveBeenCalled();
    } finally {
      paint.mockRestore();
    }
  });

  it('still paints a live renderer and a renderer attached again', () => {
    const paint = vi
      .spyOn(Canvas.prototype as CanvasRedraw, '_redraw')
      .mockImplementation(() => {});
    try {
      const renderer = createGeoCanvasRenderer() as CanvasRedraw;
      renderer.fire('add');
      renderer._redraw();
      renderer.fire('remove');
      renderer._redraw();
      renderer.fire('add');
      renderer._redraw();
      expect(paint).toHaveBeenCalledTimes(2);
    } finally {
      paint.mockRestore();
    }
  });
});
