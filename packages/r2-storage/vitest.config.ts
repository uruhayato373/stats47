import { defineConfig } from 'vitest/config';

import criticalCoverage from '../../.claude/config/critical-module-coverage.json';

const criticalThresholds = Object.fromEntries(
  criticalCoverage.modules
    .filter(({ workspace }) => workspace === 'packages/r2-storage')
    .map(({ module, floor }) => [module, floor]),
);

export default defineConfig({
  test: {
    name: '@stats47/r2-storage',
    include: ['src/**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.ts'],
      thresholds: criticalThresholds,
    },
  },
});
