/**
 * ブログ記事の背景が「今の記事の内容」に合っているかを判定する (公開前の検査用)。
 *
 * 公開時のサムネイル生成 (generate-blog-thumbnails.ts) は、背景を次の順で選ぶ。
 *   1. git の記事固有背景 (assets/blog/article-backgrounds/<slug>.jpg) — prompt は今の記事から計算する
 *   2. 旧 Codex カタログ (BLOG_CODEX_BACKGROUND_BY_SLUG) — prompt はタイトルに依らない
 *   3. R2 に公開済みの AI 背景 — 記録した promptHash が今のタイトルから計算した値と一致するときだけ再利用
 * どれにも当たらない記事は公開時に skip される。記事の書き直しでタイトルを変えると 3 が外れるため、
 * push して公開 run が走るまで気付けなかった (2026-10-07、22 記事中 5 記事)。quality-gate がこの判定を
 * push 前に行い、Codex で記事固有背景を作る手順を示す。
 */

export type BlogBackgroundStatus =
  | { kind: 'article-asset' | 'codex-catalog' | 'published-ai'; ok: true }
  | { kind: 'stale-ai' | 'missing'; ok: false; message: string }
  | { kind: 'unavailable'; ok: null; message: string };

/** 公開済み manifest (ogp/generation.json か旧 ogp/ogp.json) から背景の記録を取り出す */
export function backgroundRecord(
  value: unknown
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  const metadata =
    root.metadata && typeof root.metadata === 'object'
      ? (root.metadata as Record<string, unknown>)
      : root;
  return metadata.background &&
    typeof metadata.background === 'object' &&
    !Array.isArray(metadata.background)
    ? (metadata.background as Record<string, unknown>)
    : null;
}

/** 記事固有背景を Codex で作る手順 (/generate-blog-images の Mode A) */
export function codexBackgroundCommand(
  slug: string,
  articlePath: string
): string {
  return (
    '/generate-blog-images の Mode A (Codex) で記事固有背景を作る: ' +
    `npm run blog-images:codex -- request-article --slug ${slug} --article ${articlePath}`
  );
}

export function decideBlogBackgroundStatus(input: {
  slug: string;
  articlePath: string;
  hasArticleAsset: boolean;
  hasCodexCatalog: boolean;
  /** 'unavailable' = R2 を読めなかった (通信失敗など) */
  publishedBackground: Record<string, unknown> | null | 'unavailable';
  /** 今の記事から計算した promptHash (現行版と旧版) */
  currentPromptHashes: readonly string[];
}): BlogBackgroundStatus {
  if (input.hasArticleAsset) return { kind: 'article-asset', ok: true };
  if (input.hasCodexCatalog) return { kind: 'codex-catalog', ok: true };
  const command = codexBackgroundCommand(input.slug, input.articlePath);
  if (input.publishedBackground === 'unavailable') {
    return {
      kind: 'unavailable',
      ok: null,
      message: `公開済みの背景を確かめられませんでした。背景が無ければ公開時に skip されます。${command}`,
    };
  }
  const background = input.publishedBackground;
  if (!background || background.source !== 'ai') {
    return {
      kind: 'missing',
      ok: false,
      message: `記事固有背景がありません (公開時に skip されます)。${command}`,
    };
  }
  if (
    typeof background.promptHash !== 'string' ||
    !input.currentPromptHashes.includes(background.promptHash)
  ) {
    return {
      kind: 'stale-ai',
      ok: false,
      message: `タイトルなどの変更で公開済みの AI 背景が使えません (公開時に skip されます)。${command}`,
    };
  }
  return { kind: 'published-ai', ok: true };
}
