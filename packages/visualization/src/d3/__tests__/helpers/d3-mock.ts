// src/d3/__tests__/helpers/d3-mock.ts
import { vi } from 'vitest';

export const createD3Mock = () => ({
  mean: (values: number[]) => {
    if (values.length === 0) return undefined;
    return values.reduce((a, b) => a + b, 0) / values.length;
  },
  median: (values: number[]) => {
    if (values.length === 0) return undefined;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  min: (values: number[]) => values.length === 0 ? undefined : Math.min(...values),
  max: (values: number[]) => values.length === 0 ? undefined : Math.max(...values),
  scaleSequential: vi.fn(),
  scaleDiverging: vi.fn(),
  scaleOrdinal: vi.fn(),
  interpolateBlues: vi.fn((t: number) => `blue-${t}`),
  interpolateRdBu: vi.fn((t: number) => `rdbu-${t}`),
}) as any;
