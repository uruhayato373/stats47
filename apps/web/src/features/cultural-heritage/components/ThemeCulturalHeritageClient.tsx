'use client';

import { useState } from 'react';

import Link from 'next/link';

import { lookupArea } from '@stats47/area';
import { Button } from '@stats47/components/atoms/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { CULTURAL_HERITAGE_SOURCE as source } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import { selectCulturalHeritageView } from '../lib/cultural-heritage-view';

import type {
  CulturalHeritageKind,
  CulturalHeritageSnapshot,
} from '../lib/cultural-heritage-snapshot';

function LocationsTable({
  rows,
  label,
}: {
  rows: CulturalHeritageSnapshot['records'];
  label: string;
}) {
  return (
    <Table
      aria-label={label}
      containerClassName="min-w-0 max-w-full"
      className="min-w-96"
    >
      <TableCaption>
        文化庁の収録名称・種類・所在地を表示しています。所在地は訪問先の入口・公開可否を示すものではありません。
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">名称・公式詳細</TableHead>
          <TableHead scope="col">種類</TableHead>
          <TableHead scope="col">所在地</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} data-heritage-id={row.id}>
            <TableHead scope="row" className="min-w-40 whitespace-normal">
              <a
                href={row.officialUrl}
                className="text-primary underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                {row.name}
              </a>
            </TableHead>
            <TableCell className="whitespace-normal">
              {source.categories
                .filter((category) => row.kinds.includes(category.key))
                .map((category) => category.label)
                .join('・')}
            </TableCell>
            <TableCell className="min-w-48 whitespace-normal">
              <p>
                {row.geography === 'unspecified'
                  ? '地域を定めない'
                  : row.prefectureCodes
                      .map((code) => lookupArea(code)?.areaName)
                      .join('・')}
              </p>
              <p className="text-sm text-muted-foreground">
                {row.location ?? '原典に所在地の記載なし'}
              </p>
              {row.geography === 'multi-prefecture' && (
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary>県帰属の確認資料</summary>
                  {row.evidence.map((evidence) => (
                    <p key={evidence.url} className="mt-2">
                      <a
                        href={evidence.url}
                        className="underline underline-offset-4"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        一次資料
                        {evidence.pdfPage
                          ? `（PDF ${evidence.pdfPage}ページ）`
                          : ''}
                      </a>{' '}
                      ·{' '}
                      {new Date(evidence.retrievedAt).toLocaleDateString(
                        'ja-JP',
                        { timeZone: 'Asia/Tokyo' }
                      )}
                      取得
                      <br />
                      {evidence.basis}
                    </p>
                  ))}
                </details>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function HeritageView({
  snapshot,
  areaCode,
}: {
  snapshot: CulturalHeritageSnapshot;
  areaCode: string | null;
}) {
  const [kind, setKind] = useState<CulturalHeritageKind | 'all'>('all');
  const [page, setPage] = useState(0);
  const view = selectCulturalHeritageView(snapshot, areaCode, kind);
  if (!view)
    return (
      <ChartPanel title="文化財の種類と所在地">
        <p role="status" className="text-sm text-muted-foreground">
          選択した地域の確認済みデータを取得できません。
        </p>
      </ChartPanel>
    );
  const located = view.records.filter((row) => row.geography !== 'unspecified');
  const unspecified = view.records.filter(
    (row) => row.geography === 'unspecified'
  );
  const pages = Math.max(1, Math.ceil(located.length / 20));
  const currentPage = Math.min(page, pages - 1);
  return (
    <div
      className="min-w-0"
      data-theme-component-key={source.seriesKey}
      data-data-state="ready"
      data-area-code={view.areaCode}
    >
      <ChartPanel
        title="文化財の種類と所在地"
        description={`2026年9月11日のDB収録 · ${view.areaName} · 特別史跡・特別名勝・特別天然記念物`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={`${source.title}を加工して作成`}
            sourceLink={source.url}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          この一覧は国が指定した3種類の文化財を対象としています。県指定文化財の件数・保護費カードとは対象が異なり、国宝や通常の史跡・名勝・天然記念物も含みません。
        </p>
        <p className="text-sm" data-unique-total={view.total}>
          {view.areaName}の収録は{view.total}件。
          {view.categories
            .map((category) => `${category.label}${category.count}件`)
            .join('、')}
          。同じ文化財が複数の種類に含まれる場合があります。
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="文化財の種類で絞り込み"
        >
          {[{ key: 'all' as const, label: 'すべて' }, ...source.categories].map(
            (category) => (
              <Button
                key={category.key}
                size="sm"
                variant={kind === category.key ? 'default' : 'outline'}
                aria-pressed={kind === category.key}
                onClick={() => {
                  setKind(category.key);
                  setPage(0);
                }}
              >
                {category.label}
              </Button>
            )
          )}
        </div>
        {located.length > 0 ? (
          <>
            <LocationsTable
              rows={located.slice(currentPage * 20, (currentPage + 1) * 20)}
              label={`${view.areaName}の所在地が定められた文化財`}
            />
            {pages > 1 && (
              <div
                className="flex items-center justify-end gap-3"
                aria-label="文化財一覧のページ"
              >
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  前へ
                </Button>
                <span className="text-sm" role="status">
                  {currentPage + 1} / {pages}ページ（{located.length}件）
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage + 1 === pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  次へ
                </Button>
              </div>
            )}
          </>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            選択した地域・種類に該当するDB収録はありません。この3種類に限定した結果で、県内の文化財全体が0件という意味ではありません。
          </p>
        )}
        {view.areaCode === '00000' ? (
          <div className="space-y-3">
            <h3 className="font-medium">地域を定めない文化財</h3>
            <p className="text-sm text-muted-foreground">
              全国に{view.unspecifiedCount}
              件あり、県には配分していません。所在地欄に県名が記載されていても、指定地域の県別件数には加えません。
            </p>
            {unspecified.length > 0 ? (
              <LocationsTable rows={unspecified} label="地域を定めない文化財" />
            ) : (
              <p className="text-sm text-muted-foreground">
                選択した種類にはありません。
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            「地域を定めない」全国{view.unspecifiedCount}
            件は、この県の一覧には配分していません。ページ共通の地域選択を全国にすると別表で確認できます。
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          全国の一意件数は167件、種類別の延べ件数は177件です。複数県にまたがる6件を各県に表示するため、県別件数の合計162件は、地域を定めない14件を除いた全国153件より多くなります。DB収録件数は法的な指定総数と一致しない場合があります。
        </p>
        <Link
          href={view.tourismHref}
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          {view.areaName}の観光・旅行データを見る
        </Link>
      </ChartPanel>
    </div>
  );
}

export function ThemeCulturalHeritageClient({
  snapshot,
}: {
  snapshot: CulturalHeritageSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  return (
    <HeritageView
      key={selectedPrefectureCode ?? 'all'}
      snapshot={snapshot}
      areaCode={selectedPrefectureCode}
    />
  );
}
