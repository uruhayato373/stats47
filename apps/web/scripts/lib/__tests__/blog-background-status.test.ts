// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import { BLOG_CODEX_BACKGROUND_BY_SLUG } from '../../data/blog-codex-background-catalog';
import { articleBackgroundAssetPath } from '../blog-article-background';
import {
  backgroundRecord,
  blogBackgroundBlockMessage,
  classifyPublishedBackground,
  decideBlogBackgroundStatus,
  hasGitBackground,
  resolveGitBackgroundSource,
} from '../blog-background-status';
import { fullbleedBackgroundAssetPath } from '../blog-fullbleed-background';

// 公開時のサムネイル生成と同じ選択順 (記事固有背景 > 旧カタログ > 公開済み AI 背景の再利用) で、
// 書き直しでタイトルを変えた記事を push 前に止めることを固定する (2026-10-07 に公開 run で初めて止まった)。
const base = {
  slug: 'example',
  articlePath: 'contents/blog/example/article.md',
  hasArticleAsset: false,
  hasCodexCatalog: false,
  publishedBackground: { source: 'ai', promptHash: 'sha256-current' } as Record<string, unknown>,
  currentPromptHashes: ['sha256-current', 'sha256-legacy'],
};

describe('decideBlogBackgroundStatus', () => {
  it('git の記事固有背景か旧カタログがあれば、公開済みの背景を見ずに通す', () => {
    expect(decideBlogBackgroundStatus({ ...base, hasArticleAsset: true, publishedBackground: null }).kind).toBe('article-asset');
    expect(decideBlogBackgroundStatus({ ...base, hasCodexCatalog: true, publishedBackground: null }).kind).toBe('codex-catalog');
  });

  it('公開済み AI 背景の promptHash が今の記事 (現行版か旧版) と一致すれば通す', () => {
    expect(decideBlogBackgroundStatus(base)).toEqual({ kind: 'published-ai', ok: true });
    const legacy = decideBlogBackgroundStatus({ ...base, publishedBackground: { source: 'ai', promptHash: 'sha256-legacy' } });
    expect(legacy.ok).toBe(true);
  });

  it('タイトルを変えて promptHash が外れたら止め、Codex で作る手順を示す', () => {
    const status = decideBlogBackgroundStatus({ ...base, publishedBackground: { source: 'ai', promptHash: 'sha256-old-title' } });
    expect(status.kind).toBe('stale-ai');
    expect(status.ok).toBe(false);
    expect(status.ok === false && status.message).toContain(
      'request-article --slug example --article contents/blog/example/article.md'
    );
    expect(status.ok === false && status.message).not.toContain('--ai-background');
  });

  it('背景が無い・AI 製でない記事は止め、R2 を読めないときは止めずに知らせる', () => {
    expect(decideBlogBackgroundStatus({ ...base, publishedBackground: null }).kind).toBe('missing');
    expect(decideBlogBackgroundStatus({ ...base, publishedBackground: { source: 'brand' } }).kind).toBe('missing');
    expect(decideBlogBackgroundStatus({ ...base, publishedBackground: 'unavailable' })).toMatchObject({ kind: 'unavailable', ok: null });
  });
});

describe('backgroundRecord', () => {
  it('共通 manifest (metadata.background) と旧形式 (background) の両方から背景の記録を取り出す', () => {
    expect(backgroundRecord({ metadata: { background: { source: 'ai' } } })).toEqual({ source: 'ai' });
    expect(backgroundRecord({ background: { source: 'ai' } })).toEqual({ source: 'ai' });
    expect(backgroundRecord({ metadata: {} })).toBeNull();
    expect(backgroundRecord([])).toBeNull();
  });
});

// 背景を選ぶ処理は、公開前の生成 (generate-blog-thumbnails.ts)・公開済み記事の生成 (-cloud.ts)・push 前の検査
// (check-blog-background.ts)・Codex の待ち行列 (manage-blog-codex-backgrounds.ts) に別々に書かれていた。
// 片方だけ直すと、検査は通るのに公開時に止まる (2026-10-07 は案内文が Gemini 経路を指していた)。
const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');
const CATALOG_SLUG = 'tuna-consumption-quantity-vs-national-medical-expense-per';
const markdown = '---\ntitle: "統計の問い"\ndescription: "要約"\n---\n\n導入の段落。\n';
const dirs: string[] = [];
const root = () => {
  const dir = mkdtempSync(join(tmpdir(), 'blog-background-status-'));
  dirs.push(dir);
  return dir;
};
const jpeg = () =>
  sharp({ create: { width: 1200, height: 630, channels: 3, background: '#C8553D' } }).jpeg().toBuffer();
const put = (dir: string, file: string, bytes: Buffer) => {
  const dest = join(dir, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, bytes);
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('resolveGitBackgroundSource', () => {
  it('git の背景を 全面構図 > 記事固有 > 旧 Codex カタログ の順で 1 つ選ぶ', async () => {
    const dir = root();
    const bytes = await jpeg();
    expect(await resolveGitBackgroundSource(dir, 'example', markdown)).toBeNull();
    expect(hasGitBackground(dir, 'example')).toBe(false);

    put(dir, articleBackgroundAssetPath('example'), bytes);
    expect(await resolveGitBackgroundSource(dir, 'example', markdown)).toMatchObject({
      kind: 'article-asset',
      motif: 'article:example',
    });
    expect(hasGitBackground(dir, 'example')).toBe(true);

    put(dir, fullbleedBackgroundAssetPath('example'), bytes);
    expect(await resolveGitBackgroundSource(dir, 'example', markdown)).toMatchObject({
      kind: 'fullbleed-asset',
      motif: 'fullbleed:example',
    });
  });

  it('旧 Codex カタログは記事固有背景が無いときだけ使う', async () => {
    // カタログの画像だけを置いた作業ツリー (実リポジトリには同じ slug の全面構図背景もある)
    const dir = root();
    const { assetPath } = BLOG_CODEX_BACKGROUND_BY_SLUG[CATALOG_SLUG];
    put(dir, assetPath, readFileSync(resolve(PROJECT_ROOT, assetPath)));
    expect(await resolveGitBackgroundSource(dir, CATALOG_SLUG, markdown)).toMatchObject({
      kind: 'codex-catalog',
      motif: 'codex:tuna',
    });
    expect(hasGitBackground(dir, CATALOG_SLUG)).toBe(true);

    put(dir, articleBackgroundAssetPath(CATALOG_SLUG), await jpeg());
    expect((await resolveGitBackgroundSource(dir, CATALOG_SLUG, markdown))?.kind).toBe('article-asset');
  });

  it('壊れた背景は無いものとして次の候補へ進まず、例外で止める', async () => {
    const dir = root();
    put(dir, articleBackgroundAssetPath('example'), Buffer.from('bad image'));
    await expect(resolveGitBackgroundSource(dir, 'example', markdown)).rejects.toThrow();
  });
});

describe('classifyPublishedBackground', () => {
  it('公開済みの背景は、AI 製で promptHash が今の記事 (現行版か旧版) と一致するときだけ再利用できる', () => {
    const hashes = ['sha256-current', 'sha256-legacy', null];
    expect(classifyPublishedBackground({ source: 'ai', promptHash: 'sha256-current' }, hashes)).toBe('published-ai');
    expect(classifyPublishedBackground({ source: 'ai', promptHash: 'sha256-legacy' }, hashes)).toBe('published-ai');
    expect(classifyPublishedBackground({ source: 'ai', promptHash: 'sha256-old-title' }, hashes)).toBe('stale-ai');
    expect(classifyPublishedBackground({ source: 'ai' }, hashes)).toBe('stale-ai');
    expect(classifyPublishedBackground({ source: 'brand', promptHash: 'sha256-current' }, hashes)).toBe('missing');
    expect(classifyPublishedBackground(null, hashes)).toBe('missing');
  });
});

describe('blogBackgroundBlockMessage', () => {
  it('どの呼び出し元にも Codex の記事固有背景の手順を示し、Gemini の経路を示さない', () => {
    for (const kind of ['missing', 'stale-ai'] as const) {
      const published = blogBackgroundBlockMessage(kind, 'example');
      expect(published).toContain('npm run blog-images:codex -- request-article --slug example');
      expect(published).not.toContain('--article');
      const draft = blogBackgroundBlockMessage(kind, 'example', {
        articlePath: 'contents/blog/example/article.md',
        beforePublish: true,
      });
      expect(draft).toContain('request-article --slug example --article contents/blog/example/article.md');
      expect(draft).toContain('公開時に skip されます');
      for (const message of [published, draft]) expect(message).not.toMatch(/--ai-background|Gemini/i);
    }
  });

  it('push 前の検査が出す文は、この関数が作る文と同じ', () => {
    const status = decideBlogBackgroundStatus({ ...base, publishedBackground: null });
    expect(status.ok === false && status.message).toBe(
      blogBackgroundBlockMessage('missing', base.slug, { articlePath: base.articlePath, beforePublish: true })
    );
  });
});

// 選択順と案内文を呼び出し側へ書き戻すと、片方だけが古くなる。呼び出し側は lib の関数だけを使う。
describe('背景の選択と案内文の置き場', () => {
  const callers = [
    'apps/web/scripts/generate-blog-thumbnails.ts',
    'apps/web/scripts/generate-blog-thumbnails-cloud.ts',
    'apps/web/scripts/check-blog-background.ts',
    'apps/web/scripts/manage-blog-codex-backgrounds.ts',
  ] as const;

  // 一致した語だけを返す (ソース全文を失敗の出力に出さない)
  const found = (path: string, pattern: RegExp) =>
    readFileSync(resolve(PROJECT_ROOT, path), 'utf8').match(pattern)?.[0] ?? null;

  it.each(callers)('%s は git の背景を自分で選ばない', (path) => {
    expect(found(path, /from '\.\/lib\/blog-background-status'/)).not.toBeNull();
    expect(
      found(
        path,
        /resolvePreferredArticleBackgroundSource|resolveArticleBackgroundSource|resolveFullbleedBackgroundSource|resolveCodexBackgroundSource|hasLocalArticleBackground|BLOG_CODEX_BACKGROUND_BY_SLUG/
      )
    ).toBeNull();
  });

  // manage-blog-codex-backgrounds.ts は request-article の実装そのものなので、使い方の文に名前が出る
  it.each(callers.slice(0, 3))('%s は案内文を自分で持たない', (path) => {
    expect(found(path, /request-article|記事固有背景がありません|AI ?背景が使えません|Mode A/)).toBeNull();
  });

  it('公開済み AI 背景の promptHash の照合は lib の 1 か所だけにある', () => {
    for (const path of [...callers, 'apps/web/scripts/lib/blog-ai-background-cache.ts']) {
      expect(found(path, /\.promptHash\s*[!=]==\s*[.\w]*[pP]romptHash/), path).toBeNull();
    }
  });
});
