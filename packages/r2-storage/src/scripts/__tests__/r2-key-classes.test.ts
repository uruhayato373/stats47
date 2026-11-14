import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  classifyR2Key,
  R2_KEY_CLASSES,
  R2_PRIVATE_BUCKET,
  R2_PUBLIC_BUCKET,
} from '../r2-key-classes';
import { formatKeyClassTable } from '../list-r2-key-classes';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');

describe('classifyR2Key: R2 が唯一の正本の prefix は authoritative', () => {
  it.each([
    [R2_PUBLIC_BUCKET, 'app/stats/japanese-population/values.json'],
    [R2_PUBLIC_BUCKET, 'app/blog/some-slug/article.md'],
    [R2_PUBLIC_BUCKET, 'app/blog/some-slug/data/chart-a.json'],
    [R2_PUBLIC_BUCKET, 'app/ranking/total-population/ai-content.json'],
    [R2_PRIVATE_BUCKET, 'blog-archive/some-slug/abc.md'],
    [R2_PUBLIC_BUCKET, 'note/vertical/slug/article.md'],
    [R2_PRIVATE_BUCKET, 'note/vertical/slug/article.md'],
    [R2_PRIVATE_BUCKET, 'note-archive/blobs/abc'],
    [R2_PUBLIC_BUCKET, 'media/note-backgrounds/slug/abc/background.jpg'],
    [R2_PUBLIC_BUCKET, 'archive/kindle-encrypted/K-1/v1/rev/manifest.json'],
    [R2_PRIVATE_BUCKET, 'sns-assets/x/1/image-1/abc.png'],
  ])('%s:%s', (bucket, key) => {
    const c = classifyR2Key(bucket, key);
    expect(c.registered).toBe(true);
    expect(c.class).toBe('authoritative');
  });
});

describe('classifyR2Key: 作り直せる生成物は regenerable', () => {
  it.each([
    'app/ranking/total-population/values.json',
    'app/ranking/total-population/item.json',
    'app/page-components/home.json',
    'app/blog/all.json',
    'app/blog/some-slug/thumbnail-light.webp',
    'app/blog/some-slug/ogp/ogp.png',
    'app/blog/some-slug/data/chart-a.svg',
    'incremental-cache/build-1/page.cache',
    'estat-api/stats-data/0003/default.json',
    'robots.txt',
  ])('%s', (key) => {
    const c = classifyR2Key(R2_PUBLIC_BUCKET, key);
    expect(c.registered).toBe(true);
    expect(c.class).toBe('regenerable');
  });
});

describe('classifyR2Key: 未登録と bucket の取り違え', () => {
  it('表に無い key は推測で regenerable にせず authoritative・origin null', () => {
    const c = classifyR2Key(R2_PUBLIC_BUCKET, 'unknown-prefix/a.json');
    expect(c).toMatchObject({ registered: false, class: 'authoritative', origin: null });
  });

  it('同じ prefix でも bucket が違えば別の行 (private の app/ranking は未登録)', () => {
    expect(classifyR2Key(R2_PRIVATE_BUCKET, 'app/ranking/x/values.json').registered).toBe(false);
  });

  it('robots.txt は exact key で、robots.txt.bak には当たらない', () => {
    expect(classifyR2Key(R2_PUBLIC_BUCKET, 'robots.txt.bak').registered).toBe(false);
  });

  it('state/ の日付 snapshot は authoritative、state-publish の latest/index は regenerable', () => {
    expect(classifyR2Key(R2_PUBLIC_BUCKET, 'state/psi/psi-batch-2026.json').class).toBe('authoritative');
    expect(classifyR2Key(R2_PUBLIC_BUCKET, 'state/psi/latest.json').class).toBe('regenerable');
    expect(classifyR2Key(R2_PUBLIC_BUCKET, 'state/ads/ga4-affiliate/index.json').class).toBe('regenerable');
    // page-quality の latest.json は唯一の写し
    expect(classifyR2Key(R2_PUBLIC_BUCKET, 'state/page-quality/latest.json').class).toBe('authoritative');
  });

  it('sns/ は Mac、sns/pref-silhouette/ は CI (長い prefix が勝つ)', () => {
    expect(classifyR2Key(R2_PUBLIC_BUCKET, 'sns/buzz-map/1/a.png').origin).toBe('mac');
    expect(classifyR2Key(R2_PUBLIC_BUCKET, 'sns/pref-silhouette/13/a.png').origin).toBe('ci');
  });

  it('prefix 行は "/" 終端か exact key だけ (途中一致で別 prefix を拾わない)', () => {
    for (const rule of R2_KEY_CLASSES) {
      expect(rule.prefix.endsWith('/') || /\.[a-z]+$/.test(rule.prefix)).toBe(true);
    }
  });
});

/** workflow と sync-snapshots の run.sh から、diff-push-r2 / push-exact-r2-assets が書く prefix を拾う */
function collectWorkflowWritePrefixes(): { source: string; value: string }[] {
  const workflowDir = join(REPO_ROOT, '.github', 'workflows');
  const files = readdirSync(workflowDir)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => join(workflowDir, name));
  files.push(join(REPO_ROOT, '.claude', 'skills', 'db', 'sync-snapshots', 'run.sh'));

  const found: { source: string; value: string }[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8').replace(/\\\n\s*/g, ' ');
    for (const line of text.split('\n')) {
      if (!/(diff-push-r2|push-exact-r2-assets)\.ts/.test(line)) continue;
      for (const m of line.matchAll(/--(prefix|key)[ =]("([^"]*)"|'([^']*)'|([^\s;)]+))/g)) {
        const value = m[3] ?? m[4] ?? m[5] ?? '';
        // キーをファイルから読むもの ($(cat ...)・配列) は静的に拾えない。報告の棚卸しで扱う
        if (value.startsWith('$(') || value === '$KEY' || value === '') continue;
        found.push({ source: file.slice(REPO_ROOT.length + 1), value });
      }
    }
  }
  return found;
}

function sampleKeyFor(value: string): string {
  const concrete = value.replace(/\$\{\{[^}]*\}\}/g, 'sample').replace(/\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/g, 'sample');
  if (concrete.endsWith('/')) return `${concrete}sample.json`;
  const last = concrete.split('/').pop() ?? '';
  return /\.[a-z]+$/.test(last) ? concrete : `${concrete}/sample.json`;
}

describe('workflow が書く prefix は区分表のどれかの行に当たる', () => {
  const prefixes = collectWorkflowWritePrefixes();

  it('拾えた prefix が十分ある (正規表現の劣化を検出する)', () => {
    expect(prefixes.length).toBeGreaterThanOrEqual(20);
  });

  it.each(prefixes.map((p) => [p.source, p.value]))('%s: %s', (_source, value) => {
    const key = sampleKeyFor(value);
    expect(classifyR2Key(R2_PUBLIC_BUCKET, key).registered, key).toBe(true);
  });
});

describe('区分表の各行は「何のデータか」を 1 文で持つ', () => {
  it('what が空の行がない (一覧コマンド npm run r2:classes に出る)', () => {
    const missing = R2_KEY_CLASSES.filter((r) => r.what.trim().length < 5).map((r) => `${r.bucket}:${r.prefix}`);
    expect(missing).toEqual([]);
  });

  it('一覧は全行を出す', () => {
    const table = formatKeyClassTable();
    for (const r of R2_KEY_CLASSES) expect(table).toContain(r.what);
  });
});
