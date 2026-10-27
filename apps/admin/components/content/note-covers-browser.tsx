'use client';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { EmptyRow, PanelCard, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from '@/components/admin-ui';
import { CoverPublicationBadge, CoverReviewBadge, NoteCoverComparison } from '@/components/content/note-cover-comparison';
import { NoteCoverImage } from '@/components/content/note-cover-image';
import { Section, Stack } from '@/components/layout-primitives';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COVER_PRODUCTION_STAGES, COVER_PUBLICATIONS, COVER_REVIEWS, coverSearchText, coverViewUrl, readCoverView } from '@/lib/note-cover-view';
import { CoverPolicyDetails, CoverProductionBadge, NoteCoverProduction } from './note-cover-production';
import type { NoteCoverCategory, NoteCoverRow } from '@/lib/server/note-covers';

type Category = { key: NoteCoverCategory; label: string };
export function NoteCoversBrowser({ rows: initialRows, categories, updatedAt }: { rows: NoteCoverRow[]; categories: readonly Category[]; updatedAt: string }) {
  const params = useSearchParams();
  const query = readCoverView(params, categories);
  const selectedIds = query.ids.join(',');
  const [selected, setSelected] = useState<NoteCoverRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, NoteCoverRow>>({});
  const [dirty, setDirty] = useState(false);
  const rows = useMemo(() => initialRows.map(row => overrides[row.key] ?? row)
    .filter(row => (query.scope === 'all' || row.articleStatus === 'published') && (!selectedIds || selectedIds.split(',').includes(row.production.id ?? ''))), [initialRows, overrides, query.scope, selectedIds]);
  const selectRow = (row: NoteCoverRow | null) => {
    if (dirty && !window.confirm('未保存の入力を破棄して移動しますか？')) return;
    setDirty(false); setSelected(row);
  };
  const update = (patch: Record<string, string | undefined>, resetPage = true) => {
    window.history.replaceState(null, '', coverViewUrl(params.toString(), patch, resetPage));
  };
  const categoryLabel = (key: string) => categories.find(c => c.key === key)?.label ?? key;
  const columns = useMemo<ColumnDef<NoteCoverRow>[]>(() => [
    {
      id: 'title', accessorFn: row => `${row.title} ${row.key} ${row.production.id ?? ''} ${row.production.policy.id}`, header: '記事',
      sortingFn: (a, b) => a.original.title.localeCompare(b.original.title, 'ja'),
      cell: ({ row: { original: row } }) => <div className="flex items-start gap-3">
        <div className="w-24 shrink-0">{row.currentImageUrl && <NoteCoverImage src={row.currentImageUrl} alt={`${row.title} 公開カバー`} />}</div>
        <div className="min-w-48 max-w-sm">
          <button type="button" onClick={() => setSelected(row)} className="text-left font-medium whitespace-normal hover:text-primary hover:underline">{row.title}</button>
          <p className="mt-1 text-xs text-muted-foreground">{row.production.id} · {row.key}</p>
        </div>
      </div>,
    },
    { accessorKey: 'category', header: '分類', enableGlobalFilter: false, filterFn: 'equalsString',
      cell: ({ row }) => categories.find(c => c.key === row.original.category)?.label },
    { id: 'production', accessorFn: row => row.production.stage, header: '制作状況', enableGlobalFilter: false, filterFn: 'equalsString', cell: ({ row }) => <Stack gap="sm"><CoverProductionBadge row={row.original} /><span className="text-xs text-muted-foreground">{row.original.production.policy.id} · v{row.original.production.policy.version}</span></Stack> },
    { accessorKey: 'review', header: '確認状態', enableGlobalFilter: false, filterFn: 'equalsString', cell: ({ row }) => <CoverReviewBadge review={row.original.review} /> },
    { accessorKey: 'publication', header: 'note反映', enableGlobalFilter: false, filterFn: 'equalsString', cell: ({ row }) => <CoverPublicationBadge publication={row.original.publication} /> },
    { accessorKey: 'coverObservedAt', header: '公開確認日', enableGlobalFilter: false,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.coverObservedAt ? new Date(row.original.coverObservedAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '未確認'}</span> },
    { id: 'actions', enableSorting: false, header: '画像', cell: ({ row }) => <Button variant="outline" size="sm" onClick={() => setSelected(row.original)} aria-label={`${row.original.title}のカバーを比較`}>比較</Button> },
  ], [categories]);
  const sorting = [{ id: query.sort, desc: query.desc }];
  const table = useReactTable({
    data: rows, columns, getRowId: row => row.key,
    state: { sorting, globalFilter: query.q, columnVisibility: { category: !query.category }, columnFilters: [
      ...(query.category ? [{ id: 'category', value: query.category }] : []),
      ...(query.review ? [{ id: 'review', value: query.review }] : []),
      ...(query.publication ? [{ id: 'publication', value: query.publication }] : []),
      ...(query.stage ? [{ id: 'production', value: query.stage }] : []),
    ] },
    onSortingChange: updater => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      update({ sort: next[0]?.id, dir: next[0]?.desc ? 'desc' : undefined });
    },
    enableSortingRemoval: false, autoResetPageIndex: false,
    globalFilterFn: (row, column, value: string) => coverSearchText(String(row.getValue(column))).includes(coverSearchText(value)),
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel(),
  });
  const matched = table.getRowModel().rows;
  const pages = Math.max(1, Math.ceil(matched.length / query.size));
  const page = Math.min(query.page, pages);
  const visible = matched.slice((page - 1) * query.size, page * query.size);
  const group = rows.filter(row => !query.category || row.category === query.category);
  const published = group.filter(row => row.publication === 'published').length;
  const reviewed = group.filter(row => row.review === 'pass').length;
  const filters = (prefix: string) => <Stack gap="lg">
            <Stack gap="sm"><Label htmlFor={`${prefix}-scope`}>対象記事</Label><NativeSelect id={`${prefix}-scope`} value={query.scope} onChange={e => update({ scope: e.target.value })}><NativeSelectOption value="published">公開済み</NativeSelectOption><NativeSelectOption value="all">下書きを含むすべて</NativeSelectOption></NativeSelect></Stack>
            <Section title="分類">
              <nav aria-label="カバーの分類" className="flex flex-col gap-1">
                {[{ key: '', label: 'すべて' }, ...categories].map(item => <Button key={item.key} variant={query.category === item.key ? 'default' : 'ghost'} className="w-full justify-between" aria-pressed={query.category === item.key} onClick={() => update({ category: item.key })}>
                  <span>{item.label}</span><span className="tabular-nums">{item.key ? rows.filter(r => r.category === item.key).length : rows.length}</span>
                </Button>)}
              </nav>
            </Section>
            <Separator />
            <Stack gap="sm"><Label htmlFor={`${prefix}-stage`}>制作状況</Label><NativeSelect id={`${prefix}-stage`} value={query.stage} onChange={e => update({ stage: e.target.value })}><NativeSelectOption value="">すべて</NativeSelectOption>{COVER_PRODUCTION_STAGES.map(stage => <NativeSelectOption key={stage.key} value={stage.key}>{stage.label}（{group.filter(r => r.production.stage === stage.key).length}）</NativeSelectOption>)}</NativeSelect></Stack>
            <Stack gap="sm">
              <Label htmlFor={`${prefix}-review`}>確認状態</Label>
              <NativeSelect id={`${prefix}-review`} value={query.review} onChange={e => update({ review: e.target.value })} className="w-full">
                <NativeSelectOption value="">すべて（{group.length}）</NativeSelectOption>
                {COVER_REVIEWS.map(item => <NativeSelectOption key={item.key} value={item.key}>{item.label}（{group.filter(r => r.review === item.key).length}）</NativeSelectOption>)}
              </NativeSelect>
            </Stack>
            <Stack gap="sm">
              <Label htmlFor={`${prefix}-publication`}>noteへの反映</Label>
              <NativeSelect id={`${prefix}-publication`} value={query.publication} onChange={e => update({ publication: e.target.value })} className="w-full">
                <NativeSelectOption value="">すべて</NativeSelectOption>
                {COVER_PUBLICATIONS.map(item => <NativeSelectOption key={item.key} value={item.key}>{item.label}（{group.filter(r => r.publication === item.key).length}）</NativeSelectOption>)}
              </NativeSelect>
            </Stack>
            <Button variant="outline" onClick={() => update({ category: undefined, review: undefined, publication: undefined, stage: undefined, q: undefined, ids: undefined })} disabled={!query.category && !query.review && !query.publication && !query.stage && !query.q && !selectedIds}>絞り込みを解除</Button>
          </Stack>;
  return <>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <aside aria-label="カバーの絞り込み" className="hidden lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:block">
        <PanelCard title="絞り込み">
          {filters('desktop')}
        </PanelCard>
      </aside>
      <Stack gap="lg" className="min-w-0 lg:col-start-1 lg:row-start-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-semibold">{query.category ? categoryLabel(query.category) : selectedIds ? '今回の修正対象' : 'すべての記事'}</h2>
            <p className="text-sm text-muted-foreground">{group.length}件 · 確認済み {reviewed}件 · note反映済み {published}件</p>
          </div>
          <p className="text-xs text-muted-foreground">台帳更新 {new Date(updatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
        </div>
        <Button variant="outline" className="self-start lg:hidden" onClick={() => setFiltersOpen(true)}>分類・絞り込み</Button>
        {query.category && group[0] && <PanelCard title="このカテゴリの制作方針"><CoverPolicyDetails policy={group[0].production.policy} /></PanelCard>}
        <Tabs value={query.view} onValueChange={view => update({ view }, false)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Input aria-label="記事を検索" placeholder="記事名・制作ID・方針IDで検索" value={query.q} onChange={e => update({ q: e.target.value })} className="max-w-sm" />
            <TabsList aria-label="一覧の表示方法">
              <TabsTrigger value="table"><List />一覧</TabsTrigger>
              <TabsTrigger value="gallery"><LayoutGrid />カバー比較</TabsTrigger>
            </TabsList>
          </div>
          <p role="status" className="text-sm text-muted-foreground">{matched.length}件{matched.length ? `中 ${(page - 1) * query.size + 1}–${Math.min(page * query.size, matched.length)}件を表示` : '：条件に合う記事はありません'}</p>
          <TabsContent value="table">
            <TableFrame>
              <TableHeader>{table.getHeaderGroups().map(group => <TableRow key={group.id}>{group.headers.map(header => <TableHead key={header.id} aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : undefined}>
                {header.column.getCanSort() ? <Button variant="ghost" size="sm" onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' ? <ArrowUp /> : header.column.getIsSorted() === 'desc' ? <ArrowDown /> : <ArrowUpDown />}
                </Button> : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>)}</TableRow>)}</TableHeader>
              <TableBody>{visible.length ? visible.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <EmptyRow colSpan={table.getVisibleLeafColumns().length}>条件に合う記事はありません。検索語や絞り込みを変更してください。</EmptyRow>}</TableBody>
            </TableFrame>
          </TabsContent>
          <TabsContent value="gallery">
            <div className={selectedIds ? 'grid gap-4' : 'grid gap-4 xl:grid-cols-2'}>{visible.map(({ original: row }) => <Card key={row.key}>
              <CardHeader><CardTitle>{row.title}</CardTitle><p className="text-xs text-muted-foreground">{row.production.id} · {row.production.policy.id} · {row.key}</p><CoverProductionBadge row={row} /></CardHeader>
              <CardContent><Stack><NoteCoverComparison row={row} /><Button variant="outline" onClick={() => setSelected(row)}>大きく比較</Button></Stack></CardContent>
            </Card>)}</div>
            {!visible.length && <p className="text-sm text-muted-foreground">条件に合う記事はありません。検索語や絞り込みを変更してください。</p>}
          </TabsContent>
        </Tabs>
        <nav aria-label="一覧のページ切り替え" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Label htmlFor="cover-page-size">1ページ</Label><NativeSelect id="cover-page-size" value={query.size} onChange={e => update({ size: e.target.value })}>{[12, 24, 48].map(size => <NativeSelectOption key={size} value={size}>{size}件</NativeSelectOption>)}</NativeSelect></div>
          <div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => update({ page: String(page - 1) }, false)}>前へ</Button><span className="text-sm tabular-nums">{page} / {pages}</span><Button variant="outline" size="sm" disabled={page === pages} onClick={() => update({ page: String(page + 1) }, false)}>次へ</Button></div>
        </nav>
      </Stack>
    </div>
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader><SheetTitle>分類・絞り込み</SheetTitle><SheetDescription>分類と画像の状態で記事を絞り込みます。</SheetDescription></SheetHeader>
        <div className="px-4 pb-6">{filters('mobile')}</div>
      </SheetContent>
    </Sheet>
    <Sheet open={selected !== null} onOpenChange={open => { if (!open) selectRow(null); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader><SheetTitle>カバーを比較</SheetTitle><SheetDescription>{selected?.title}</SheetDescription></SheetHeader>
        {selected && <Stack gap="lg" className="px-4 pb-6"><NoteCoverComparison row={selected} />
          <NoteCoverProduction key={`${selected.key}:${selected.production.revision}`} row={selected} onDirty={setDirty} onSaved={row => { setOverrides(previous => ({ ...previous, [row.key]: row })); setSelected(row); setDirty(false); }} />
          <div className="flex flex-wrap gap-2">{selected.noteUrl && <a href={selected.noteUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>noteで記事を開く</a>}
            <Button variant="outline" disabled={matched.findIndex(r => r.original.key === selected.key) >= matched.length - 1} onClick={() => { const index = matched.findIndex(r => r.original.key === selected.key); const next = matched[index + 1]; if (next) selectRow(next.original); }}>次の記事を確認</Button>
          </div>
        </Stack>}
      </SheetContent>
    </Sheet>
  </>;
}
