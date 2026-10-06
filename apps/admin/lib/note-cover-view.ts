import type { NoteCoverReview, NoteCoverRow } from '@/lib/server/note-covers';

export const COVER_REVIEWS: { key: NoteCoverReview; label: string }[] = [
  { key: 'needs-revision', label: '要修正' }, { key: 'pending', label: '未判定' },
  { key: 'pass', label: '確認済み' }, { key: 'missing', label: '候補なし' },
  { key: 'unavailable', label: '旧候補未回収' },
];
export const COVER_PUBLICATIONS: { key: NoteCoverRow['publication']; label: string }[] = [
  { key: 'published', label: 'noteに反映済み' },
  { key: 'unpublished', label: 'noteに未反映' },
  { key: 'unapproved', label: '採用前・候補なし' },
];
const SORT_COLUMNS = ['title', 'category', 'review', 'publication', 'coverObservedAt'];
export function readCoverView(params: Pick<URLSearchParams, 'get'>, categories: readonly { key: string }[]) {
  const category = params.get('category') ?? '';
  const review = params.get('review') ?? '';
  const publication = params.get('publication') ?? '';
  const positive = (key: string) => Math.max(1, Number.parseInt(params.get(key) ?? '1', 10) || 1);
  return {
    category: categories.some(c => c.key === category) ? category : '',
    review: COVER_REVIEWS.some(r => r.key === review) ? review : '',
    publication: COVER_PUBLICATIONS.some(p => p.key === publication) ? publication : '',
    q: params.get('q') ?? '',
    view: params.get('view') === 'gallery' ? 'gallery' : 'table',
    sort: SORT_COLUMNS.includes(params.get('sort') ?? '') ? params.get('sort')! : 'title',
    desc: params.get('dir') === 'desc', page: positive('page'),
    size: [12, 24, 48].includes(Number(params.get('size'))) ? Number(params.get('size')) : 12,
  };
}
/** Keep view/sort while changing filters; reset only the result page. */
export function coverViewUrl(current: string, patch: Record<string, string | undefined>, resetPage = true) {
  const params = new URLSearchParams(current);
  if (resetPage) params.delete('page');
  for (const [key, value] of Object.entries(patch)) {
    if (value) params.set(key, value); else params.delete(key);
  }
  return `/content/note/covers${params.size ? `?${params}` : ''}`;
}
export const coverSearchText = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase('ja');
