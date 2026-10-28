'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';

import { Button, Input, NativeSelect, NativeSelectOption } from '@stats47/components';
import { StatusBadge } from '@/components/admin-ui/status-badge';
import { DataGrid } from '@/components/admin-ui/data-grid';
import { Grid } from '@/components/layout-primitives';
import { MediaPreview } from '@/components/media-preview';
import { apiGet, ApiError } from '@/lib/client/api-client';
import { ErrorState, Loading } from '@/components/async-state';
import type {
  IgConsistencyResponse,
  InventoryResponse,
  LimitsResponse,
  PostDTO,
} from '@/lib/contracts/types';
import {
  candidatesFor,
  isCandidate,
  candidateStage,
  CANDIDATE_STAGES,
  formatJst,
  formatLabel,
  matchesPostQuery,
  PLATFORM_LABELS,
  sortPosts,
  statusLabel,
  statusTone,
  type GalleryItem,
} from '@/lib/sns-ledger';
import { PostCard } from './post-card';
import { PostPreview } from './post-preview';

const PAGE_SIZE = 24;

export function SnsView({
  initialPlatform = '',
}: {
  initialPlatform?: string;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <SnsLedger initialPlatform={initialPlatform} />
    </Suspense>
  );
}

function SnsLedger({ initialPlatform }: { initialPlatform: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const platform = params.get('platform') ?? initialPlatform;
  const status = params.get('status') ?? '';
  const domain = params.get('domain') ?? '';
  const query = params.get('q') ?? '';
  const scope = ['extras', 'candidates'].includes(params.get('scope') ?? '')
    ? params.get('scope')!
    : 'posts';
  const origin = params.get('origin') ?? '';
  const stage = params.get('stage') ?? '';
  const sort = params.get('sort') ?? 'id';
  const view = params.get('view') === 'table' ? 'table' : 'gallery';
  const requestedPage = Math.max(1, Number(params.get('page')) || 1);
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<LimitsResponse['limits'] | null>(null);
  const [consistency, setConsistency] = useState<IgConsistencyResponse | null>(
    null
  );
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    next.delete('page');
    for (const [key, value] of Object.entries(changes)) {
      if (value || key === 'platform') next.set(key, value);
      else next.delete(key);
    }
    window.history.replaceState(null, '', `${pathname}?${next}`);
  }
  function loadInventory() {
    setLoading(true);
    setError(null);
    apiGet<InventoryResponse>('/api/inventory')
      .then(setInventory)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : String(e))
      )
      .finally(() => setLoading(false));
  }
  function loadAuxiliary() {
    apiGet<LimitsResponse>('/api/limits')
      .then((r) => setLimits(r.limits))
      .catch(() => {});
    apiGet<IgConsistencyResponse>('/api/ig-consistency')
      .then(setConsistency)
      .catch(() => {});
  }
  useEffect(() => {
    loadInventory();
    loadAuxiliary();
  }, []);

  const allItems = useMemo<GalleryItem[]>(
    () =>
      inventory
        ? [...inventory.posts, ...(inventory.extras as GalleryItem[])]
        : [],
    [inventory]
  );
  const domains = [
    ...new Set(allItems.map((p) => p.domain).filter((d): d is string => !!d)),
  ].sort();
  const platforms = [
    ...new Set([
      ...Object.keys(PLATFORM_LABELS).slice(0, 4),
      ...allItems.map((p) => p.platform),
    ]),
  ];
  const items = useMemo(
    () =>
      sortPosts(
        allItems.filter(
          (p) =>
            (scope === 'candidates'
              ? isCandidate(p)
              : scope === 'posts'
                ? !!p.id
                : !p.id) &&
            (!origin || p.planning?.origin === origin) &&
            (!stage || (isCandidate(p) && candidateStage(p) === stage)) &&
            (!platform || p.platform === platform) &&
            (!status || p.status === status) &&
            (!domain || p.domain === domain) &&
            matchesPostQuery(p, query)
        ),
        sort
      ),
    [allItems, scope, platform, status, domain, query, sort, origin, stage]
  );
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.floor(requestedPage));
  const visible = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const consistencyCount =
    (consistency?.onlyInJson.length ?? 0) +
    (consistency?.onlyInPosts.length ?? 0);
  function saved(post: PostDTO) {
    setInventory((old) =>
      old
        ? { ...old, posts: old.posts.map((p) => (p.id === post.id ? post : p)) }
        : old
    );
    setSelected(post);
  }
  return (
    <>
      <div className="flex flex-col gap-3 border-y py-4">
        <div className="flex flex-wrap gap-2" aria-label="台帳の対象">
          <Button
            variant={scope === 'posts' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              update({ scope: '', status: '', origin: '', stage: '' })
            }
          >
            ID台帳 {inventory?.posts.length ?? 0}
          </Button>
          <Button
            variant={scope === 'extras' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              update({ scope: 'extras', status: '', origin: '', stage: '' })
            }
          >
            未登録素材 {inventory?.extras.length ?? 0}
          </Button>
          <Button
            variant={scope === 'candidates' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              update({
                scope: 'candidates',
                status: '',
                q: '',
                origin: '',
                stage: '',
                sort: 'id',
              })
            }
          >
            展開候補 {allItems.filter(isCandidate).length}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              update({
                scope: '',
                status: 'scheduled',
                sort: 'schedule',
                origin: '',
                stage: '',
              })
            }
          >
            予約順に確認
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              update({
                scope: '',
                status: 'draft',
                sort: 'id',
                origin: '',
                stage: '',
              })
            }
          >
            下書きを編集
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="投稿を検索"
            value={query}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="ID / 本文 / キーを検索（例: #1109）"
            className="w-full sm:max-w-sm"
          />
          <NativeSelect
            aria-label="媒体"
            value={platform}
            onChange={(e) => update({ platform: e.target.value })}
          >
            <NativeSelectOption value="">全媒体</NativeSelectOption>
            {platforms.map((p) => (
              <NativeSelectOption key={p} value={p}>
                {PLATFORM_LABELS[p] ?? p}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="投稿状態"
            value={status}
            onChange={(e) => update({ status: e.target.value })}
          >
            <NativeSelectOption value="">全状態</NativeSelectOption>
            {(scope !== 'extras'
              ? ['draft', 'scheduled', 'posted']
              : ['unregistered', 'scheduled-json-only']
            ).map((s) => (
              <NativeSelectOption key={s} value={s}>
                {statusLabel(s)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="画像の型"
            value={domain}
            onChange={(e) => update({ domain: e.target.value })}
          >
            <NativeSelectOption value="">すべての型</NativeSelectOption>
            {domains.map((d) => (
              <NativeSelectOption key={d} value={d}>
                {formatLabel(d)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              update({
                platform: initialPlatform,
                status: '',
                domain: '',
                q: '',
                scope: '',
                sort: 'id',
                origin: '',
                stage: '',
              })
            }
          >
            絞り込みを解除
          </Button>
        </div>
        {scope === 'candidates' && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              予約前の下書きを画像付きで比較できます。確認用プレビューは投稿用画像一式の準備が必要です。
            </p>
            <div className="flex flex-wrap gap-2">
              <NativeSelect
                aria-label="候補の出どころ"
                value={origin}
                onChange={(e) => update({ origin: e.target.value })}
              >
                <NativeSelectOption value="">すべての候補</NativeSelectOption>
                <NativeSelectOption value="new-format">
                  新しい型の追加企画
                </NativeSelectOption>
                <NativeSelectOption value="material-import">
                  既存素材から整理
                </NativeSelectOption>
              </NativeSelect>
              <NativeSelect
                aria-label="準備状況"
                value={stage}
                onChange={(e) => update({ stage: e.target.value })}
              >
                <NativeSelectOption value="">
                  すべての準備状況
                </NativeSelectOption>
                {Object.entries(CANDIDATE_STAGES).map(([key, label]) => (
                  <NativeSelectOption key={key} value={key}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm" data-testid="sns-count" aria-live="polite">
            {items.length} 件
          </span>
          <NativeSelect
            aria-label="並び順"
            size="sm"
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
          >
            <NativeSelectOption value="id">IDの新しい順</NativeSelectOption>
            <NativeSelectOption value="schedule">
              予約日時の早い順
            </NativeSelectOption>
            <NativeSelectOption value="recent">
              投稿・予約日時の新しい順
            </NativeSelectOption>
          </NativeSelect>
          <div className="flex gap-1" aria-label="表示形式">
            <Button
              variant={view === 'gallery' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={view === 'gallery'}
              onClick={() => update({ view: 'gallery' })}
            >
              <LayoutGrid />
              画像一覧
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={view === 'table'}
              onClick={() => update({ view: 'table' })}
            >
              <List />
              台帳表示
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              loadInventory();
              loadAuxiliary();
            }}
          >
            再読込
          </Button>
          <span className="text-xs text-muted-foreground">
            日時は日本時間 (JST)
          </span>
        </div>
      </div>
      {limits && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(limits).map(([key, info]) => (
            <StatusBadge
              key={key}
              tone={info.used >= info.max ? 'warn' : 'neutral'}
              title={info.window}
            >
              {PLATFORM_LABELS[key] ?? key}: {info.used}/{info.max}
            </StatusBadge>
          ))}
        </div>
      )}
      {consistencyCount > 0 && (
        <p className="text-sm text-warning">
          IG予約の不整合: 予約表のみ {consistency?.onlyInJson.length} 件 /
          台帳のみ {consistency?.onlyInPosts.length} 件
        </p>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={loadInventory} />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          該当する投稿がありません。検索条件を変更してください。
        </p>
      ) : (
        <>
          {view === 'gallery' ? (
            <Grid min="md" lines={false}>
              {visible.map((item, i) => (
                <PostCard
                  key={item.id ?? `${item.platform}-${item.content_key}-${i}`}
                  item={item}
                  onPreview={() => setSelected(item)}
                />
              ))}
            </Grid>
          ) : (
            <DataGrid
              columns={[
                { id: 'id', header: 'ID / 画像', sortable: true },
                { id: 'platform', header: '媒体・型', sortable: true },
                { id: 'caption', header: '本文' },
                { id: 'status', header: '状態', sortable: true },
                { id: 'at', header: '予約 / 投稿日時 (JST)', sortable: true, nowrap: true },
                { id: 'action', header: '操作' },
              ]}
              rows={items.map((item, i) => ({
                id: String(item.id ?? `${item.platform}-${item.content_key}-${i}`),
                cells: [
                  <div key="id" className="flex w-24 flex-col gap-2">
                    {item.id ? (
                      <a
                        className="font-mono font-semibold underline-offset-4 hover:underline"
                        href={`/sns/${item.id}`}
                      >
                        #{item.id}
                      </a>
                    ) : (
                      '未登録'
                    )}
                    <MediaPreview
                      candidates={candidatesFor(item)}
                      aspectClassName="aspect-square"
                      alt={`投稿 #${item.id ?? '未登録'}`}
                    />
                  </div>,
                  <div key="p">
                    {PLATFORM_LABELS[item.platform] ?? item.platform}
                    <br />
                    {formatLabel(item.domain)}
                  </div>,
                  <div key="c">
                    {item.planning && (
                      <p className="mb-2 font-semibold">
                        {item.planning.title}
                      </p>
                    )}
                    <p className="line-clamp-3 min-w-48 max-w-lg whitespace-pre-wrap break-words text-sm">
                      {item.caption || '本文未登録'}
                    </p>
                    <p className="mt-2 break-all text-xs text-muted-foreground">
                      {item.content_key}
                    </p>
                  </div>,
                  <div key="s">
                    <StatusBadge tone={statusTone(item.status)}>
                      {statusLabel(item.status)}
                    </StatusBadge>
                    {isCandidate(item) && (
                      <p className="mt-2 text-xs">
                        {CANDIDATE_STAGES[candidateStage(item)]}
                      </p>
                    )}
                    {item.approval?.state === 'pending' && (
                      <p className="mt-2 text-xs text-warning">承認待ち</p>
                    )}
                  </div>,
                  formatJst(item.scheduled_at || item.posted_at),
                  <Button
                    key="a"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelected(item)}
                    aria-label={`投稿 #${item.id ?? '未登録'} の画像と本文を開く`}
                  >
                    画像・本文
                  </Button>,
                ],
                sort: [
                  item.id ?? null,
                  item.platform ?? null,
                  null,
                  item.status ?? null,
                  item.scheduled_at || item.posted_at || null,
                  null,
                ],
                facet: item.status ?? '',
                tone: item.approval?.state === 'pending' ? 'warn' : undefined,
              }))}
              facets={[
                ...new Set(
                  items
                    .map((item) => item.status)
                    .filter((st): st is string => !!st)
                ),
              ].map((st) => ({ value: st, label: statusLabel(st) }))}
            />
          )}
          {view === 'gallery' && (
          <div className="flex items-center justify-center gap-4">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => update({ page: String(page - 1) })}
            >
              前へ
            </Button>
            <span className="text-sm">
              {page} / {pageCount} ページ
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pageCount}
              onClick={() => update({ page: String(page + 1) })}
            >
              次へ
            </Button>
          </div>
          )}
        </>
      )}
      {selected && (
        <PostPreview
          key={selected.id ?? selected.content_key}
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={saved}
        />
      )}
    </>
  );
}
