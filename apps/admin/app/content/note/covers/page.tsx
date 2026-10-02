import Link from 'next/link';
import { NoteCoverImage } from '@/components/content/note-cover-image';

import { PanelCard, StatusBadge, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow, numCol, type Tone } from '@/components/admin-ui';
import { FilterLink } from '@/components/content/content-ui';
import { Section, Stack } from '@/components/layout-primitives';
import { PageHeading } from '@/components/ops/primitives';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NOTE_COVER_CATEGORIES, noteCoverManagement, type NoteCoverCategory, type NoteCoverReview } from '@/lib/server/note-covers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'noteカバー管理 — stats47 admin' };

type Query = { category?: string; review?: string; q?: string; page?: string };
const REVIEWS: { key: NoteCoverReview; label: string }[] = [
  { key: 'needs-revision', label: '要修正' },
  { key: 'pending', label: '未判定' },
  { key: 'pass', label: '確認済み' },
  { key: 'missing', label: '候補なし' },
  { key: 'unavailable', label: '旧候補未回収' },
];
// レビュー状態の色: 確認済み=済 / 要修正=要対応 / 未判定=保留 / 候補なし=欠落
const REVIEW_TONE: Record<NoteCoverReview, Tone> = { pass: 'good', 'needs-revision': 'warn', pending: 'neutral', missing: 'neutral', unavailable: 'warn' };
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
  const reviewLabel = (key: NoteCoverReview) => REVIEWS.find((item) => item.key === key)?.label ?? key;

  return <Stack gap="lg">
    <PageHeading title="noteカバー管理" source="記事・画像の共通台帳">
      <p className="text-xs text-console-muted">公開中のカバーと差し替え候補を分類別に比較できます。確認済み・未判定・noteへの反映状況と、公開画像の確認日を表示します。</p>
      <Link href="/content/note" className="text-xs text-console-accent hover:underline">記事管理へ戻る</Link>
    </PageHeading>

    <PanelCard title="分類" description={`${data.rows.length} 件`}>
      <Stack>
        <div className="flex flex-wrap gap-2">
          <FilterLink href={href(query, { category: undefined, page: undefined })} active={!category}>すべて {data.rows.length}</FilterLink>
          {NOTE_COVER_CATEGORIES.map((item) => <FilterLink key={item.key} href={href(query, { category: item.key, page: undefined })} active={category === item.key}>{item.label} {data.counts[item.key]}</FilterLink>)}
        </div>
        <TableFrame>
          <TableHeader>
            <TableRow>
              <TableHead>分類</TableHead>
              <TableHead className={numCol}>記事数</TableHead>
              <TableHead className={numCol}>確認済み</TableHead>
              <TableHead className={numCol}>要修正</TableHead>
              <TableHead className={numCol}>未判定・候補なし</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{NOTE_COVER_CATEGORIES.map((item) => {
            const group = data.rows.filter((row) => row.category === item.key);
            const count = (state: NoteCoverReview) => group.filter((row) => row.review === state).length;
            return <TableRow key={item.key}>
              <TableCell><Link href={href(query, { category: item.key, review: undefined, page: undefined })} className="text-console-accent hover:underline">{item.label}</Link></TableCell>
              <TableCell className={numCol}>{group.length}</TableCell>
              <TableCell className={numCol}>{count('pass')}</TableCell>
              <TableCell className={numCol}><Link href={href(query, { category: item.key, review: 'needs-revision', page: undefined })} className="text-console-accent hover:underline">{count('needs-revision')}</Link></TableCell>
              <TableCell className={numCol}>{count('pending') + count('missing') + count('unavailable')}</TableCell>
            </TableRow>;
          })}</TableBody>
        </TableFrame>
      </Stack>
    </PanelCard>

    <PanelCard title="レビュー状態" description={`台帳更新 ${new Date(data.updatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}。候補は確認後に差し替えます。旧候補未回収は、過去の生成記録に対応する画像を回収できていない記事です。`}>
      <Stack>
        <div className="flex flex-wrap gap-2">
          <FilterLink href={href(query, { review: undefined, page: undefined })} active={!review}>すべて</FilterLink>
          {REVIEWS.map((item) => <FilterLink key={item.key} href={href(query, { review: item.key, page: undefined })} active={review === item.key}>{item.label} {data.reviewCounts[item.key]}</FilterLink>)}
        </div>
        <form action="/content/note/covers" className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {review && <input type="hidden" name="review" value={review} />}
          <Input name="q" defaultValue={query.q} aria-label="noteカバーを検索" placeholder="記事名・keyで検索" className="w-72 max-w-full" />
          <Button type="submit" variant="outline">検索</Button>
        </form>
      </Stack>
    </PanelCard>

    {/* 個々のカバーを Card で並べるので、外側は Card (PanelCard) にしない (Card の入れ子禁止: apps/web の design-system:check) */}
    <Section title={`カバー比較 (${filtered.length} 件)`}>
      <Stack>
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row) => <Card key={row.key}>
            <CardHeader>
              <CardTitle><a href={row.noteUrl} target="_blank" rel="noreferrer" className="hover:text-console-accent">{row.title}</a></CardTitle>
              <div className="font-mono text-[10px] text-console-muted">{row.key}</div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-console-muted">
                <span>{categoryLabel(row.category)}</span>
                <StatusBadge tone={REVIEW_TONE[row.review]}>{reviewLabel(row.review)}</StatusBadge>
                {row.candidateImageUrl && <StatusBadge tone={row.publication === 'published' ? 'good' : 'neutral'}>{row.publication === 'published' ? 'noteに反映済み' : 'noteに未反映'}</StatusBadge>}
                {row.stale && <StatusBadge tone="warn">公開画像の再確認が必要</StatusBadge>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <figure><div className="mb-1 text-[11px] text-console-muted">{row.coverObservedAt ? `公開カバー（${new Date(row.coverObservedAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}確認）` : '差し替え前の保存画像'}</div>{row.currentImageUrl ? <NoteCoverImage key={row.currentImageUrl} src={row.currentImageUrl} alt={`${row.title} 公開カバー`} /> : <div className="aspect-[1.91] rounded border border-console-border p-2 text-xs text-console-muted">画像なし</div>}</figure>
                <figure><div className="mb-1 text-[11px] text-console-muted">生成候補{row.candidateVersion ? `（${row.candidateVersion}）` : ''}</div>{row.candidateImageUrl ? <NoteCoverImage key={row.candidateImageUrl} src={row.candidateImageUrl} alt={`${row.title} 生成候補`} /> : <div className="aspect-[1.91] rounded border border-console-border p-2 text-xs text-console-muted">{row.review === 'unavailable' ? '過去の候補画像は未回収です' : '候補なし'}</div>}</figure>
              </div>
              {row.reviewReason && <p className="text-xs text-console-muted">{row.reviewReason}</p>}
              {row.missingVersions.length > 0 && <p className="text-xs text-console-muted">未回収の旧版: {row.missingVersions.join('、')}。表示中の新しい候補とは別の版です。</p>}
              {row.archivedVersions.length > 0 && <details className="text-xs text-console-muted"><summary className="cursor-pointer">過去の保管版 {row.archivedVersions.length} 件</summary><div className="grid grid-cols-2 gap-2 pt-2">{row.archivedVersions.map((r) => <figure key={r.id}><figcaption>{r.version}</figcaption><NoteCoverImage key={r.imageUrl} src={r.imageUrl} alt={`${row.title} 過去の保管版`} /></figure>)}</div></details>}
            </CardContent>
          </Card>)}
        </div>
        {filtered.length === 0 && <p className="text-sm text-console-muted">該当する記事はありません。</p>}
        {pages > 1 && <nav aria-label="ページ切り替え" className="flex items-center gap-3 text-sm text-console-fg">
          {page > 1 && <Link href={href(query, { page: String(page - 1) })} className="text-console-accent hover:underline">前へ</Link>}
          <span>{page} / {pages}</span>
          {page < pages && <Link href={href(query, { page: String(page + 1) })} className="text-console-accent hover:underline">次へ</Link>}
        </nav>}
      </Stack>
    </Section>
  </Stack>;
}
