import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');

function source(path: string): string {
  return readFileSync(resolve(PROJECT_ROOT, path), 'utf8');
}

describe('generated image source policy', () => {
  it('applies the automatic JSX runtime to the imported OGP components as well as scripts', () => {
    const config = JSON.parse(source('apps/web/scripts/tsconfig.ogp.json'));
    expect(config.compilerOptions.jsx).toBe('react-jsx');
    expect(config.include).toContain('../src/features/ogp/**/*.tsx');
  });
  const buzzMapPublishers = [
    '.claude/scripts/sns/prepare-buzz-map-batch.ts',
  ] as const;

  it.each(buzzMapPublishers)(
    '%s uses byte-exact publishing instead of mtime prefix sync',
    (path) => {
      const contents = source(path);
      expect(contents).toContain('push-exact-r2-assets.ts');
      expect(contents).not.toContain('diff-push-r2.ts');
    }
  );

  it('buzz-map batch publishes only keys rendered by the current run', () => {
    const contents = source(
      '.claude/scripts/sns/prepare-buzz-map-batch.ts'
    );
    expect(contents).toContain(
      "...keys.flatMap((key) => ['--key', key])"
    );
    expect(contents).not.toContain(
      "`sns/buzz-map/${ideaId}`"
    );
  });
});
