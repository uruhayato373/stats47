import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = (name) => readFileSync(new URL(`../../sns/${name}`, import.meta.url), 'utf8');

describe('generated image source policy (buzz-map)', () => {
  for (const name of ['prepare-buzz-map-batch.ts']) {
    it(`.claude/scripts/sns/${name} uses byte-exact publishing instead of mtime prefix sync`, () => {
      const contents = source(name);
      assert.ok(contents.includes('push-exact-r2-assets.ts'));
      assert.ok(!contents.includes('diff-push-r2.ts'));
    });
  }

  it('buzz-map batch publishes only keys rendered by the current run', () => {
    const contents = source('prepare-buzz-map-batch.ts');
    assert.ok(contents.includes("...keys.flatMap((key) => ['--key', key])"));
    assert.ok(!contents.includes('`sns/buzz-map/${ideaId}`'));
  });
});
