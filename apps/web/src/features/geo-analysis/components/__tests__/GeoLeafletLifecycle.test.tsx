import { useEffect } from 'react';

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ events: [] as string[], map: {} }));
vi.mock('react-leaflet', () => ({ useMap: () => calls.map }));
vi.mock('../../lib/settle-leaflet-animation', () => ({
  settleLeafletAnimation: () => calls.events.push('finish-zoom'),
}));

import { GeoLeafletLifecycle } from '../GeoLeafletLifecycle';

describe('Geo Leaflet cleanup ordering', () => {
  it('MapContainer相当の親passive removeより先にchild layout cleanupを実行する', () => {
    calls.events = [];
    function Container() {
      useEffect(
        () => () => {
          calls.events.push('remove-pane');
        },
        []
      );
      return <GeoLeafletLifecycle />;
    }
    const view = render(<Container />);
    view.unmount();
    expect(calls.events).toEqual(['finish-zoom', 'remove-pane']);
  });
});
