/**
 * stats47 の外にある公開物 (note 記事・SNS の投稿) を、ページ ID 台帳と同じ形のページと関係にする純関数。
 *
 * 生成スクリプト (apps/web/scripts/sync-content-catalog.ts → data/content/external.json) と、
 * 管理画面の参考文献の展開状況 (最新の正本から数える) が同じ関数を使い、判定を二重に書かない (2026-10-10)。
 * 外部公開物はサイトのページの台帳 (entities.json) と分ける。SNS の投稿台帳は CI が投稿のたびに書き換えるので、
 * サイトの台帳や指標の逆引き索引に混ぜると、投稿のたびに鮮度の検査が落ちる。
 *
 * - note = note のカタログの記事のうち、公開 URL (https) があるもの。ID は note:<key>
 * - sns = data/sns/posts.json の投稿のうち、URL (https) があるもの。ID は sns:<投稿ID>。
 *   note への投稿の記録 (platform=note) は note の記事として載せるので外す (同じ URL を二重に持たない)
 */
import type { ContentLink, ContentPage } from './index';

export interface ExternalNoteSource {
  key: string;
  title: string;
  status: string;
  noteUrl?: string;
  stats47Targets?: readonly string[];
}

export interface ExternalSnsSource {
  id: number;
  platform: string;
  status: string;
  post_url?: string | null;
  caption?: string | null;
  domain?: string | null;
  content_key?: string | null;
  /** 投稿台帳では配列・JSON 配列の文字列・カンマ区切りの文字列が混在する (posts.schema.json の metric_keys) */
  metric_keys?: readonly string[] | string | null;
}

/**
 * 投稿台帳の metric_keys を key の配列にする。文字列のまま展開すると 1 文字ずつの key になり、
 * 指標の正本に無いとして全部捨てられていた (2026-10-26 まで SNS 投稿の metric_keys 由来の関係が 0 件)。
 * 読み方は check-datasets の refs (parse: "list") と同じ。
 */
export function snsMetricKeys(value: ExternalSnsSource['metric_keys']): string[] {
  if (Array.isArray(value)) return [...value];
  if (typeof value !== 'string' || !value.trim()) return [];
  const text = value.trim();
  if (text.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.filter((k): k is string => typeof k === 'string');
    } catch {
      // JSON として読めない文字列はカンマ区切りとして扱う
    }
  }
  return text.split(',').map((k) => k.trim()).filter(Boolean);
}

export interface ExternalContentInput {
  notes: readonly ExternalNoteSource[];
  posts: readonly ExternalSnsSource[];
  /** 指標の正本にある key か (台帳に未登録の指標を載せない) */
  isKnownMetric: (key: string) => boolean;
  /** サイトの URL からページ ID を引く (contentIdFromHref) */
  idFromHref: (href: string) => string | undefined;
}

export function buildExternalContentPages(input: ExternalContentInput): {
  pages: ContentPage[];
  links: ContentLink[];
  /** 指標の正本に無いため関係を張らなかった key (外部公開物 ID → key)。黙って捨てず呼び出し側が報告する */
  unknownMetricKeys: { id: string; key: string }[];
} {
  const pages: ContentPage[] = [];
  const links: ContentLink[] = [];
  const unknownMetricKeys: { id: string; key: string }[] = [];
  const known = (id: string) => (key: string) => {
    if (input.isKnownMetric(key)) return true;
    unknownMetricKeys.push({ id, key });
    return false;
  };
  for (const note of input.notes) {
    if (!note.noteUrl?.startsWith('https://')) continue;
    const id = `note:${note.key}`;
    const targetIds = [
      ...new Set(
        (note.stats47Targets ?? [])
          .map((target) => input.idFromHref(target))
          .filter((target): target is string => Boolean(target))
      ),
    ];
    pages.push({
      id,
      kind: 'note',
      key: note.key,
      title: note.title,
      href: note.noteUrl,
      published: note.status === 'published',
      rankingKeys: targetIds
        .filter((target) => target.startsWith('ranking:'))
        .map((target) => target.slice('ranking:'.length))
        .filter(known(id)),
    });
    for (const target of targetIds) links.push({ from: id, to: target, relation: 'uses' });
  }
  const hrefs = new Set<string>();
  for (const post of input.posts) {
    if (post.platform === 'note') continue;
    if (!post.post_url?.startsWith('https://') || hrefs.has(post.post_url)) continue;
    hrefs.add(post.post_url);
    const id = `sns:${post.id}`;
    const metricKeys = [
      ...new Set([
        ...snsMetricKeys(post.metric_keys),
        ...(post.domain === 'ranking' && post.content_key ? [post.content_key] : []),
      ]),
    ].filter(known(id));
    const caption = (post.caption ?? '')
      .split('\n')
      .find((line) => line.trim())
      ?.trim()
      .slice(0, 60);
    pages.push({
      id,
      kind: 'sns',
      key: String(post.id),
      title: caption || `${post.platform} ${post.content_key ?? post.id}`,
      href: post.post_url,
      published: post.status === 'posted',
      rankingKeys: metricKeys,
    });
    for (const key of metricKeys) links.push({ from: id, to: `ranking:${key}`, relation: 'uses' });
  }
  return { pages, links, unknownMetricKeys };
}
