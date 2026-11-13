/**
 * ブログ記事の背景を選ぶ規則と、背景が無いときの案内文の置き場 (ここ 1 か所)。
 *
 * 背景は次の順で選ぶ。
 *   0. git の全面構図背景 (assets/blog/fullbleed-backgrounds/<slug>.jpg)
 *   1. git の記事固有背景 (assets/blog/article-backgrounds/<slug>.jpg) — prompt は今の記事から計算する
 *   2. 旧 Codex カタログ (BLOG_CODEX_BACKGROUND_BY_SLUG) — prompt はタイトルに依らない
 *   3. R2 に公開済みの AI 背景 — 記録した promptHash が今のタイトルから計算した値と一致するときだけ再利用
 * どれにも当たらない記事は公開時に skip される。記事の書き直しでタイトルを変えると 3 が外れるため、
 * push して公開 run が走るまで気付けなかった (2026-10-07、22 記事中 5 記事)。quality-gate がこの判定を
 * push 前に行い、Codex で記事固有背景を作る手順を示す。
 *
 * 呼び出し側 (公開前の生成 generate-blog-thumbnails.ts・公開済み記事の生成 -cloud.ts・push 前の検査
 * check-blog-background.ts・Codex の待ち行列 manage-blog-codex-backgrounds.ts) は 0〜2 を
 * resolveGitBackgroundSource / hasGitBackground で、3 の照合を classifyPublishedBackground で、案内文を
 * blogBackgroundBlockMessage で得る。選択順や案内文を呼び出し側へ書き戻さない (2026-10-07 は 2 つの生成
 * スクリプトに別々に書かれていて、案内文が Gemini 経路を指したままだった)。
 */

import { BLOG_CODEX_BACKGROUND_BY_SLUG } from '../data/blog-codex-background-catalog';
import { parseBlogArticleImageContext } from './blog-article-background';
import { resolveCodexBackgroundSource } from './blog-codex-background-workflow';
import {
  BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION,
  hasLocalArticleBackground,
  resolvePreferredArticleBackgroundSource,
} from './blog-fullbleed-background';

export type GitBackgroundKind = 'fullbleed-asset' | 'article-asset' | 'codex-catalog';

/** git に置いた背景 1 枚 (画像の形式・寸法は検証済み) */
export interface GitBackgroundSource {
  kind: GitBackgroundKind;
  buffer: Buffer;
  sha256: string;
  prompt: string;
  promptHash: string;
  model: string;
  promptVersion: string;
  motif: string;
}

/**
 * git の背景を 全面構図 > 記事固有 > 旧 Codex カタログ の順で 1 つ選ぶ。どれも無ければ null。
 * 画像が壊れている (jpeg 1200x630 でない) ときは、次の候補へ進まずに例外で止める。
 */
export async function resolveGitBackgroundSource(
  projectRoot: string,
  slug: string,
  markdown: string
): Promise<GitBackgroundSource | null> {
  // 全面構図 > 記事固有 の順は resolvePreferredArticleBackgroundSource が持つ
  const article = await resolvePreferredArticleBackgroundSource(
    projectRoot,
    parseBlogArticleImageContext(slug, markdown)
  );
  if (article) {
    const kind =
      article.promptVersion === BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION
        ? 'fullbleed-asset'
        : 'article-asset';
    return { kind, ...article };
  }
  const catalog = await resolveCodexBackgroundSource(projectRoot, slug);
  return catalog ? { kind: 'codex-catalog', ...catalog } : null;
}

/** git の背景 (resolveGitBackgroundSource が選ぶ 3 種のどれか) が記事にあるか。画像の中身は読まない */
export function hasGitBackground(projectRoot: string, slug: string): boolean {
  return (
    hasLocalArticleBackground(projectRoot, slug) ||
    BLOG_CODEX_BACKGROUND_BY_SLUG[slug] !== undefined
  );
}

export type BlogBackgroundStatus =
  | { kind: 'fullbleed-asset' | 'article-asset' | 'codex-catalog' | 'published-ai'; ok: true }
  | { kind: 'stale-ai' | 'missing'; ok: false; message: string }
  | { kind: 'unavailable'; ok: null; message: string };

/** 公開済み manifest (ogp/generation.json か旧 ogp/ogp.json) から背景の記録を取り出す */
export function backgroundRecord(
  value: unknown
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  const metadata =
    root.metadata &&
    typeof root.metadata === 'object' &&
    !Array.isArray(root.metadata)
      ? (root.metadata as Record<string, unknown>)
      : root;
  return metadata.background &&
    typeof metadata.background === 'object' &&
    !Array.isArray(metadata.background)
    ? (metadata.background as Record<string, unknown>)
    : null;
}

/**
 * 記事固有背景を Codex で作る手順 (/generate-blog-images の Mode A)。
 * articlePath を省くと、request-article は公開済みの記事本文を R2 から読む。
 */
export function codexBackgroundCommand(
  slug: string,
  articlePath?: string
): string {
  return (
    '/generate-blog-images の Mode A (Codex) で記事固有背景を作る: ' +
    `npm run blog-images:codex -- request-article --slug ${slug}` +
    (articlePath ? ` --article ${articlePath}` : '')
  );
}

export type PublishedBackgroundKind = 'published-ai' | 'stale-ai' | 'missing';

/**
 * 公開済みの背景の記録が、今の記事にそのまま使えるかを分ける。
 *   published-ai = AI 製で、記録した promptHash が今の記事の値 (現行版か旧版) と一致する
 *   stale-ai     = AI 製だが promptHash が合わない (タイトルなどを変えた)
 *   missing      = 記録が無いか、AI 製でない
 */
export function classifyPublishedBackground(
  background: Record<string, unknown> | null,
  currentPromptHashes: readonly (string | null)[]
): PublishedBackgroundKind {
  if (!background || background.source !== 'ai') return 'missing';
  return typeof background.promptHash === 'string' &&
    currentPromptHashes.includes(background.promptHash)
    ? 'published-ai'
    : 'stale-ai';
}

const BLOCK_REASON = {
  missing: '記事固有背景がありません',
  'stale-ai': 'タイトルなどの変更で公開済みの AI 背景が使えません',
} as const;

/** 使える背景が無い記事に出す案内文。push 前の検査では、公開時にどうなるかも添える */
export function blogBackgroundBlockMessage(
  kind: keyof typeof BLOCK_REASON,
  slug: string,
  options: { articlePath?: string; beforePublish?: boolean } = {}
): string {
  return (
    BLOCK_REASON[kind] +
    (options.beforePublish ? ' (公開時に skip されます)' : '') +
    `。${codexBackgroundCommand(slug, options.articlePath)}`
  );
}

export function decideBlogBackgroundStatus(input: {
  slug: string;
  articlePath: string;
  hasFullbleedAsset?: boolean;
  hasArticleAsset: boolean;
  hasCodexCatalog: boolean;
  /** 'unavailable' = R2 を読めなかった (通信失敗など) */
  publishedBackground: Record<string, unknown> | null | 'unavailable';
  /** 今の記事から計算した promptHash (現行版と旧版) */
  currentPromptHashes: readonly string[];
}): BlogBackgroundStatus {
  if (input.hasFullbleedAsset) return { kind: 'fullbleed-asset', ok: true };
  if (input.hasArticleAsset) return { kind: 'article-asset', ok: true };
  if (input.hasCodexCatalog) return { kind: 'codex-catalog', ok: true };
  if (input.publishedBackground === 'unavailable') {
    return {
      kind: 'unavailable',
      ok: null,
      message:
        '公開済みの背景を確かめられませんでした。背景が無ければ公開時に skip されます。' +
        codexBackgroundCommand(input.slug, input.articlePath),
    };
  }
  const kind = classifyPublishedBackground(
    input.publishedBackground,
    input.currentPromptHashes
  );
  if (kind === 'published-ai') return { kind, ok: true };
  return {
    kind,
    ok: false,
    message: blogBackgroundBlockMessage(kind, input.slug, {
      articlePath: input.articlePath,
      beforePublish: true,
    }),
  };
}
