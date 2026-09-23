import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/features/geo-x/__tests__/**/*.test.ts',
      'src/features/ig-series/__tests__/**/*.test.ts',
      'src/features/ranking-quiz-instagram/__tests__/**/*.test.ts',
      'src/features/area-instagram/__tests__/**/*.test.ts',
      'src/features/correlation-instagram/__tests__/**/*.test.ts',
    ],
  },
});
