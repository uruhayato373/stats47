import type { MediaCandidateDTO, PostDTO } from './contracts/types';

export type GalleryItem = Partial<PostDTO> & { platform: string };
export const FORMAT_LABELS: Record<string, string> = {
  ranking: 'ランキング',
  theme: 'テーマ',
  area: 'エリア',
  geo: 'GeoAI',
  'buzz-map': 'バズ地図',
  'household-receipt': '家計レシート',
  'area-atlas': '県図鑑',
  'rank-routes': '順位乗換',
  'tile-change': 'タイル地図・長期変化',
  compare: '地域比較',
  'area-carousel': '県別カルーセル',
  'correlation-carousel': '相関カルーセル',
  'ranking-quiz-reel': 'ランキングクイズ動画',
};
export const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  scheduled: '予約済み',
  posted: '投稿済み',
  unregistered: '未登録素材',
  'scheduled-json-only': 'IG予約表のみ',
};
export const PLATFORM_LABELS: Record<string, string> = {
  x: 'X',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  note: 'note',
  tiktok: 'TikTok',
};
export function formatLabel(domain?: string | null) {
  return FORMAT_LABELS[domain ?? ''] ?? domain ?? '型未設定';
}
export function statusLabel(status?: string) {
  return STATUS_LABELS[status ?? ''] ?? status ?? '未登録';
}
export function statusTone(status?: string) {
  return status === 'posted'
    ? 'good'
    : status === 'scheduled'
      ? 'warn'
      : status === 'draft'
        ? 'info'
        : 'neutral';
}
export function matchesPostQuery(
  item: {
    id?: number;
    content_key?: string | null;
    caption?: string | null;
    template?: string | null;
    planning?: { title: string };
  },
  query: string
): boolean {
  const q = query.trim();
  if (!q) return true;
  // #1109 または 1109,1110,1111 は正確な台帳ID。本文中の数字との誤一致を避ける。
  if (/^#?\d+(?:\s*[,、]\s*#?\d+)*$/.test(q)) {
    return q
      .split(/[,、]/)
      .some((id) => Number(id.trim().replace(/^#/, '')) === item.id);
  }
  return [
    item.content_key,
    item.caption,
    item.template,
    item.planning?.title,
  ].some((s) => s?.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
}
export function timestamp(value: unknown): number {
  if (typeof value !== 'string' || !value) return 0;
  // 旧台帳の timezone なし時刻はJST。ISOのZ/offsetはそのまま解釈。
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00+09:00`
    : /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value)
      ? `${value.replace(' ', 'T')}+09:00`
      : value;
  const result = Date.parse(normalized);
  return Number.isFinite(result) ? result : 0;
}
export function formatJst(value: unknown): string {
  const time = timestamp(value);
  if (!time) return '—';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(time);
}
export function sortPosts(items: GalleryItem[], sort: string): GalleryItem[] {
  return [...items].sort((a, b) => {
    if (sort === 'schedule')
      return (
        (timestamp(a.scheduled_at) || Infinity) -
          (timestamp(b.scheduled_at) || Infinity) || (b.id ?? 0) - (a.id ?? 0)
      );
    if (sort === 'recent')
      return (
        timestamp(b.posted_at || b.scheduled_at || b.created_at) -
          timestamp(a.posted_at || a.scheduled_at || a.created_at) ||
        (b.id ?? 0) - (a.id ?? 0)
      );
    return (b.id ?? 0) - (a.id ?? 0);
  });
}
export function candidatesFor(
  item: GalleryItem
): Array<{ url: string; source: string }> {
  return (item.media_candidates ?? []).filter(
    (c: MediaCandidateDTO): c is { url: string; source: string } => !!c.url
  );
}
export function mediaAspect(item: GalleryItem): string {
  if (
    [
      'household-receipt',
      'area-atlas',
      'rank-routes',
      'tile-change',
      'geo',
      'buzz-map',
    ].includes(item.domain ?? '')
  )
    return 'aspect-4/5';
  if (String(item.media_path ?? '').includes('choropleth-map'))
    return 'aspect-square';
  if (String(item.media_path ?? '').includes('/_replacements/') || item.template === 'all47-tile') return 'aspect-4/5';
  if (item.platform === 'instagram') return 'aspect-4/5';
  return 'aspect-video';
}
export function canEditDraft(item: GalleryItem): item is PostDTO {
  return (
    typeof item.id === 'number' &&
    item.status === 'draft' &&
    !item.deleted_at &&
    !item.scheduled_at &&
    !item.posted_at &&
    !item.post_url &&
    !item.external_id
  );
}

export const CANDIDATE_STAGES: Record<string, string> = {
  preview: '確認用プレビュー',
  'needs-media': '画像準備待ち',
  'needs-copy': '本文準備待ち',
  review: '内容確認・承認待ち',
  approved: '承認済み',
};
export function isCandidate(item: GalleryItem): boolean {
  return canEditDraft(item);
}
export function candidateStage(item: GalleryItem): string {
  if (item.planning?.preview_only) return 'preview';
  const hasMedia =
    item.assets?.some((a) => a.state === 'archived') ||
    item.media_candidates?.some(
      (c) => c.url && ['local', 'drive'].includes(c.source)
    );
  if (!hasMedia) return 'needs-media';
  if (!item.caption?.trim() || /\{\{.+?\}\}/.test(item.caption))
    return 'needs-copy';
  return item.approval?.state === 'approved' ? 'approved' : 'review';
}
