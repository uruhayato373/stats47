/* eslint-disable @next/next/no-img-element -- 管理画面で元画像とローカル候補の実ファイルを比較するため */
import Link from 'next/link';

import { FilterLink } from '@/components/content/content-ui';
import { PageHeading, Section } from '@/components/ops/primitives';
import { NOTE_COVER_CATEGORIES, noteCoverManagement, type NoteCoverCategory, type NoteCoverReview } from '@/lib/server/note-covers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'noteカバー管理 — stats47 admin' };

type Query = { category?: string; review?: string; q?: string; page?: string };
const REVIEWS: { key: NoteCoverReview; label: string }[] = [
  { key: 'needs-revision', label: '要修正' },
  { key: 'pending', label: '未判定' },
  { key: 'pass', label: '確認済み' },
  { key: 'missing', label: '候補なし' },
];
const PAGE_SIZE = 24;

function href(query: Query, patch: Partial<Query>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...patch })) if (value) params.set(key, value);
  return `/content/note/covers${params.size ? `?${params}` : ''}`;
}

export default async function NoteCoversPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const data = noteCoverManagement();
  const category = NOTE_COVER_CATEGORIES.some((item) => item.key === query.category)
    ? query.category as NoteCoverCategory : undefined;
  const review = REVIEWS.some((item) => item.key === query.review)
    ? query.review as NoteCoverReview : undefined;
  const word = query.q?.trim().toLowerCase() ?? '';
  const filtered = data.rows.filter((row) =>
    (!category || row.category === category) &&
    (!review || row.review === review) &&
    (!word || `${row.key} ${row.title}`.toLowerCase().includes(word)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categoryLabel = (key: NoteCoverCategory) => NOTE_COVER_CATEGORIES.find((item) => item.key === key)?.label ?? key;

  return <div className="space-y-8">
    <PageHeading title="noteカバー管理" source="note catalog + ローカル生成候補・レビュー台帳">
      <p className="text-xs text-console-muted">公開済み記事のカバーを用途別に確認します。左は差し替え前の保存画像、右は生成候補です。現在のnote.com画像をリアルタイム取得した表示ではありません。</p>
      <Link href="/content/note" className="text-xs text-console-accent hover:underline">記事管理へ戻る</Link>
    </PageHeading>

    <Section title="分類" count={data.rows.length}>
      <div className="flex flex-wrap gap-2">
        <FilterLink href={href(query, { category: undefined, page: undefined })} active={!category}>すべて {data.rows.length}</FilterLink>
        {NOTE_COVER_CATEGORIES.map((item) => <FilterLink key={item.key} href={href(query, { category: item.key, page: undefined })} active={category === item.key}>{item.label} {data.counts[item.key]}</FilterLink>)}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs text-console-fg">
          <thead><tr className="border-b border-console-border text-console-muted"><th className="py-2">分類</th><th>記事数</th><th>確認済み</th><th>要修正</th><th>未判定・候補なし</th></tr></thead>
          <tbody>{NOTE_COVER_CATEGORIES.map((item) => {
            const group = data.rows.filter((row) => row.category === item.key);
            const count = (state: NoteCoverReview) => group.filter((row) => row.review === state).length;
            return <tr key={item.key} className="border-b border-console-border/50">
              <td className="py-2"><Link href={href(query, { category: item.key, review: undefined, page: undefined })} className="text-console-accent hover:underline">{item.label}</Link></td>
              <td>{group.length}</td>
              <td>{count('pass')}</td>
              <td><Link href={href(query, { category: item.key, review: 'needs-revision', page: undefined })} className="text-console-accent hover:underline">{count('needs-revision')}</Link></td>
              <td>{count('pending') + count('missing')}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Section>

    <Section title="レビュー状態">
      <div className="flex flex-wrap gap-2">
        <FilterLink href={href(query, { review: undefined, page: undefined })} active={!review}>すべて</FilterLink>
        {REVIEWS.map((item) => <FilterLink key={item.key} href={href(query, { review: item.key, page: undefined })} active={review === item.key}>{item.label} {data.reviewCounts[item.key]}</FilterLink>)}
      </div>
      <form action="/content/note/covers" className="mt-3 flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        {review && <input type="hidden" name="review" value={review} />}
        <input name="q" defaultValue={query.q} aria-label="noteカバーを検索" placeholder="記事名・keyで検索" className="h-9 w-72 max-w-full rounded-md border border-console-border bg-console-card px-3 text-sm text-console-fg" />
        <button className="rounded-md border border-console-border px-3 text-sm text-console-fg">検索</button>
      </form>
      <p className="mt-2 text-xs text-console-muted">生成版 {data.version ?? 'なし'} ／ 最終生成 {data.generatedAt ?? 'なし'}。要修正は差し替え対象外です。</p>
    </Section>

    <Section title="カバー比較" count={filtered.length}>
      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((row) => <article key={row.key} className="rounded-lg border border-console-border bg-console-card p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <a href={row.noteUrl} target="_blank" rel="noreferrer" className="font-medium text-console-fg hover:text-console-accent">{row.title}</a>
              <div className="font-mono text-[10px] text-console-muted">{row.key}</div>
            </div>
            <div className="text-right text-xs text-console-muted"><div>{categoryLabel(row.category)}</div><div>{REVIEWS.find((item) => item.key === row.review)?.label}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <figure><div className="mb-1 text-[11px] text-console-muted">差し替え前</div>{row.currentImageUrl ? <img src={row.currentImageUrl} alt={`${row.title} 差し替え前`} loading="lazy" className="aspect-[1.91] w-full rounded border border-console-border object-contain" /> : <div className="aspect-[1.91] rounded border border-console-border p-2 text-xs text-console-muted">画像なし</div>}</figure>
            <figure><div className="mb-1 text-[11px] text-console-muted">生成候補</div>{row.candidateImageUrl ? <img src={row.candidateImageUrl} alt={`${row.title} 生成候補`} loading="lazy" className="aspect-[1.91] w-full rounded border border-console-border object-contain" /> : <div className="aspect-[1.91] rounded border border-console-border p-2 text-xs text-console-muted">候補なし</div>}</figure>
          </div>
          {row.reviewReason && <p className="mt-2 text-xs text-console-muted">{row.reviewReason}</p>}
        </article>)}
      </div>
      {filtered.length === 0 && <p className="text-sm text-console-muted">該当する記事はありません。</p>}
      {pages > 1 && <nav aria-label="ページ切り替え" className="mt-5 flex items-center gap-3 text-sm text-console-fg">
        {page > 1 && <Link href={href(query, { page: String(page - 1) })} className="text-console-accent hover:underline">前へ</Link>}
        <span>{page} / {pages}</span>
        {page < pages && <Link href={href(query, { page: String(page + 1) })} className="text-console-accent hover:underline">次へ</Link>}
      </nav>}
    </Section>
  </div>;
}
