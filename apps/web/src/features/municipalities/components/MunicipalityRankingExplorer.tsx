'use client';

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { Button } from '@stats47/components/atoms/ui/button';
import { Input } from '@stats47/components/atoms/ui/input';
import { LazySelect } from '@stats47/components/molecules/lazy-select';
import { hrefFor } from '@stats47/data-configs/content/href';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';
import { buildMunicipalityListNames } from '@stats47/ranking';
import { formatValueWithPrecision } from '@stats47/utils';

import Link from '@/components/atoms/SiteLink';

import { matchMunicipalityRanking } from '../lib/filter-municipality-ranking';

import type { DataTable as DataTableComponent } from '@stats47/components/molecules/data-table/data-table';
import type { MunicipalityRankingValue } from '@stats47/ranking/types';
import type { ColumnDef } from '@tanstack/react-table';

// 全行の表は操作されて全行を出す段になってから読む (初期表示の HTML と JS に含めない)。総称型は dynamic で消えるので型を戻す
const DataTable = dynamic(
  () => import('@stats47/components/molecules/data-table/data-table').then((mod) => mod.DataTable),
  { ssr: false }
) as unknown as typeof DataTableComponent;

const ALL_PREFECTURES = 'all';
const PAGE_SIZE = 50;

interface Props {
  rankingKey: string;
  /** サーバーが上位の表に使った年。取得した全行の年がこれと違うときは使わない */
  yearCode: string;
  unit: string;
  /** サーバーがデータセット全体から 1 度だけ決めた小数桁 (上位の表と桁をそろえる) */
  precision: number;
  /** 全自治体の件数 */
  total: number;
  /** サーバーが HTML に出した上位の件数 */
  initialCount: number;
  prefectures: readonly { prefCode: string; prefName: string }[];
  /** サーバーが描いた上位の表。操作するまではこれだけを見せる */
  children: ReactNode;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 全国版の市区町村ランキングの 51 位以下と、自治体名・都道府県の絞り込み。
 * 全行は利用者が操作したときに初めて同一オリジンの JSON (指標ごとに 1 URL) から読み、
 * 絞り込みの条件は URL に載せない (?pref= / ?page= をクローラーが総なめにし、そのたびにページを描画していた)。
 */
export function MunicipalityRankingExplorer({
  rankingKey,
  yearCode,
  unit,
  precision,
  total,
  initialCount,
  prefectures,
  children,
}: Props) {
  const [query, setQuery] = useState('');
  const [prefectureCode, setPrefectureCode] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [rows, setRows] = useState<MunicipalityRankingValue[] | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const requested = useRef(false);

  const load = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    setLoadState('loading');
    fetch(`/api/municipalities/ranking/${encodeURIComponent(rankingKey)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = (await response.json()) as { yearCode?: unknown; values?: unknown };
        if (!Array.isArray(body.values)) throw new Error('values が配列ではない');
        // ページ (上位の表) と別の年を混ぜない。年度更新の途中でページと JSON の年が食い違うことがある
        if (body.yearCode !== yearCode) throw new Error('yearCode がページと違う');
        setRows(body.values as MunicipalityRankingValue[]);
        setLoadState('ready');
      })
      .catch(() => {
        // 「再読み込み」と次の操作で読み直せるようにする
        requested.current = false;
        setLoadState('error');
      });
  }, [rankingKey, yearCode]);

  const filtering = query.trim() !== '' || prefectureCode !== '';
  const active = showAll || filtering;
  const failed = active && loadState === 'error';

  const filtered = useMemo(
    () => (rows ? matchMunicipalityRanking(rows, { query, prefectureCode }) : []),
    [rows, query, prefectureCode]
  );

  const columns = useMemo<ColumnDef<MunicipalityRankingValue>[]>(() => {
    // 同じ名前の自治体 (府中市・伊達市など) だけ県名を添える (上位の表と同じ規則)
    const listName = buildMunicipalityListNames((rows ?? []).map((row) => row.areaName));
    const unitLabel = formatUnitForDisplay(unit);
    return [
      {
        accessorKey: 'rank',
        header: '順位',
        meta: { width: '5rem' },
        cell: ({ row }) => `${row.original.rank}位`,
      },
      {
        accessorKey: 'areaName',
        header: '市区町村',
        meta: { wrap: true },
        cell: ({ row }) => (
          <Link
            href={hrefFor('city', {
              areaCode: row.original.prefectureCode,
              cityCode: row.original.areaCode,
            })}
            className="font-medium hover:text-primary hover:underline"
          >
            {listName(row.original.areaName)}
          </Link>
        ),
      },
      {
        accessorKey: 'value',
        header: () => <div className="text-right">値</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {`${formatValueWithPrecision(row.original.value, precision)} ${unitLabel}`}
          </div>
        ),
      },
    ];
  }, [rows, unit, precision]);

  const prefectureItems = useMemo(
    () => [
      { value: ALL_PREFECTURES, label: 'すべて' },
      ...prefectures.map((prefecture) => ({
        value: prefecture.prefCode,
        label: prefecture.prefName,
      })),
    ],
    [prefectures]
  );

  let status: string;
  if (!active) {
    status = `${total.toLocaleString('ja-JP')}件中 上位${Math.min(total, initialCount).toLocaleString('ja-JP')}件`;
  } else if (loadState === 'error') {
    status = '一覧を読み込めませんでした。時間をおいて再度お試しください。';
  } else if (!rows) {
    status = '読み込み中…';
  } else {
    status = `${filtered.length.toLocaleString('ja-JP')}件`;
  }

  return (
    <section aria-label="順位の一覧" className="mt-5">
      <div className="grid gap-3 border-y border-border py-4 sm:grid-cols-[1fr_14rem]">
        <label
          htmlFor="municipality-query"
          className="text-xs font-medium text-muted-foreground"
        >
          自治体名
          <Input
            id="municipality-query"
            type="search"
            value={query}
            placeholder="例：神戸市"
            className="mt-1"
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.trim()) load();
            }}
          />
        </label>
        <div className="text-xs font-medium text-muted-foreground">
          都道府県
          <LazySelect
            value={prefectureCode || ALL_PREFECTURES}
            items={prefectureItems}
            aria-label="都道府県で絞り込む"
            triggerClassName="mt-1 w-full"
            onValueChange={(next) => {
              const code = next === ALL_PREFECTURES ? '' : next;
              setPrefectureCode(code);
              if (code) load();
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
        <div className="flex items-center gap-2">
          {failed && (
            <Button variant="outline" size="sm" onClick={load}>
              再読み込み
            </Button>
          )}
          {active && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setQuery('');
                setPrefectureCode('');
                setShowAll(false);
              }}
            >
              {filtering ? '条件を解除' : '上位だけを表示'}
            </Button>
          )}
        </div>
      </div>

      {active && rows ? (
        filtered.length > 0 ? (
          <DataTable
            // 条件が変わったら 1 ページ目から見せる (DataTable はページ位置を自動で戻さない)
            key={`${query}\u0000${prefectureCode}`}
            className="mt-2"
            columns={columns}
            data={filtered}
            maxRows={PAGE_SIZE}
            enableFiltering={false}
            enableSorting={false}
            showIndex={false}
            showBorder
            showRowCount={false}
            getRowId={(row) => row.areaCode}
            ariaLabel="市区町村の順位"
          />
        ) : (
          <p className="mt-2 border border-border p-6 text-center text-sm text-muted-foreground">
            該当する自治体はありません。
          </p>
        )
      ) : failed && filtering ? null : (
        // 絞り込み中に読めなかったときは、条件と関係ない全国上位を見せない (「すべて表示」の失敗だけ上位の表を残す)
        <div className="mt-2 overflow-x-auto border border-border" aria-busy={active && loadState === 'loading'}>
          {children}
        </div>
      )}

      {!active && total > initialCount && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => {
            setShowAll(true);
            load();
          }}
        >
          {`すべての自治体を表示（${total.toLocaleString('ja-JP')}件）`}
        </Button>
      )}
    </section>
  );
}
