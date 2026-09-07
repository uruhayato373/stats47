import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const fixtures: string[] = [];

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'stats47-blog-noop-'));
  fixtures.push(root);
  const scripts = join(root, 'apps/web/scripts');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(join(root, 'outbox'));
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  copyFileSync(join(repo, 'apps/web/scripts/generate-blog-thumbnails.ts'), join(scripts, 'generate-blog-thumbnails.ts'));
  for (const relative of ['node_modules', 'apps/web/src', 'apps/web/scripts/data', 'apps/web/scripts/lib']) {
    symlinkSync(join(repo, relative), join(root, relative), 'junction');
  }
  return root;
}

function run(root: string, args: string[] = []) {
  return execFileSync(process.execPath, ['--import', 'tsx', 'apps/web/scripts/generate-blog-thumbnails.ts', ...args], {
    cwd: root,
    env: { ...process.env, BLOG_DIR: join(root, 'outbox') },
    encoding: 'utf8',
    timeout: 30000,
  });
}

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('blog image no-op CLI on a fresh checkout', () => {
  it('writes the required empty exact plan even when .local has never existed', () => {
    const root = fixture();
    expect(existsSync(join(root, '.local'))).toBe(false);
    // Zero changed targets takes the same branch as a republish whose images are current.
    expect(run(root)).toContain('fingerprint変更なし');
    const plan = JSON.parse(readFileSync(join(root, '.local/image-generation-publish-plan-blog.json'), 'utf8'));
    expect(plan).toMatchObject({ generator: 'blog-ogp', stageRoot: '.local/image-staging/blog', items: [] });
    expect(existsSync(join(root, '.local/image-staging/blog'))).toBe(false);
  });

  it('replaces a stale plan without deleting unrelated local files or generating images', () => {
    const root = fixture();
    mkdirSync(join(root, '.local/image-staging/blog'), { recursive: true });
    writeFileSync(join(root, '.local/keep.txt'), 'keep');
    writeFileSync(join(root, '.local/image-generation-publish-plan-blog.json'), '{"items":["old"]}');
    run(root);
    expect(JSON.parse(readFileSync(join(root, '.local/image-generation-publish-plan-blog.json'), 'utf8')).items).toEqual([]);
    expect(readFileSync(join(root, '.local/keep.txt'), 'utf8')).toBe('keep');
    expect(existsSync(join(root, '.local/image-staging/blog'))).toBe(false);
  });

  it('keeps audit mode read-only with respect to new output directories', () => {
    const root = fixture();
    expect(run(root, ['--audit'])).toContain('更新必要0件');
    expect(existsSync(join(root, '.local'))).toBe(false);
  });
});
