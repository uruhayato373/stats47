'use client';

import { useLayoutEffect } from 'react';

import { useMap } from 'react-leaflet';

import { settleLeafletAnimation } from '../lib/settle-leaflet-animation';

export function GeoLeafletLifecycle() {
  const map = useMap();
  // Layout cleanup runs before MapContainer's passive cleanup calls remove().
  useLayoutEffect(() => () => settleLeafletAnimation(map), [map]);
  return null;
}
