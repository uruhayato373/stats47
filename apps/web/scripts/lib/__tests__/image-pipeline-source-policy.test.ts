// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');

function source(path: string): string {
  return readFileSync(resolve(PROJECT_ROOT, path), 'utf8');
}

describe('generated image source policy', () => {
  it('ranking OGP/card generation shares the order-independent latest-year selector', () => {
    const generator = source('apps/web/scripts/generate-ogp-images.ts');
    expect(generator).toContain('selectRankingImagePartition(it, values?.partitions ?? [])');
    expect(generator).not.toContain('availableYears.length - 1');
    expect(generator).not.toContain('values.partitions.length - 1');
  });
  it('applies the automatic JSX runtime to the imported OGP components as well as scripts', () => {
    const config = JSON.parse(source('apps/web/scripts/tsconfig.ogp.json'));
    expect(config.compilerOptions.jsx).toBe('react-jsx');
    expect(config.include).toContain('../src/features/ogp/**/*.tsx');
  });
});
