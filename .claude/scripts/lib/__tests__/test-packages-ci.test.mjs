import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { packageProjects } from '../test-packages-ci.mjs';

test('CI includes new package projects and rejects coverage scopes without a blocking step', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-package-split-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (p, value) => { const target = path.join(root, p); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, value); };
  write('.claude/config/critical-module-coverage.json', JSON.stringify({ modules: [{ workspace: 'packages/data-configs' }] }));
  write('vitest.config.ts', `["packages/data-configs/vitest.config.ts", "packages/new/vitest.config.ts"]`);
  for (const name of ['data-configs', 'new']) {
    write(`packages/${name}/vitest.config.ts`, 'export default {}');
    write(`packages/${name}/package.json`, JSON.stringify({ name: `@stats47/${name}` }));
  }
  assert.deepEqual(packageProjects(root), ['@stats47/data-configs', '@stats47/new']);
  write('.claude/config/critical-module-coverage.json', JSON.stringify({ modules: [{ workspace: 'packages/new' }] }));
  assert.throws(() => packageProjects(root), /blocking coverage step/);
});
