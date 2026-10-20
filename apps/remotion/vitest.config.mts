import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), '@stats47/types': fileURLToPath(new URL('../../packages/types/src/index.ts', import.meta.url)) } },
  test: {
    environment: 'node',
    include: [
      'src/shared/__tests__/**/*.test.ts',
      'src/features/note-household/**/*.test.ts',
      'src/features/geo-x/__tests__/**/*.test.ts',
      'src/features/ig-series/__tests__/**/*.test.ts',
      'src/features/ranking-quiz-instagram/__tests__/**/*.test.ts',
      'src/features/area-instagram/__tests__/**/*.test.ts',
      'src/features/correlation-instagram/__tests__/**/*.test.ts',
      'src/features/compare-carousel-instagram/__tests__/**/*.test.ts',
      'src/features/map-carousel-instagram/__tests__/**/*.test.ts',
    ],
  },
});
