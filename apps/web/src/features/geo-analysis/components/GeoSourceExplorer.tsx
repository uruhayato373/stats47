'use client';
import { useState, useSyncExternalStore } from 'react';

import dynamic from 'next/dynamic';

import { Button } from '@stats47/components/atoms/ui/button';
import { Input } from '@stats47/components/atoms/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@stats47/components/atoms/ui/select';

import { ContentDisclosure } from '@/components/content';
import { SurfaceCard } from '@/components/surface';

import { findGeoSourceInitialAsset } from '../lib/geo-source-initial-asset';

import type { GeoSourceItem } from '../lib/geo-source-catalog';
import type { GeoSourceField } from '@stats47/data-configs/business-plan';
const SourceMap = dynamic(
  () => import('./GeoSourceMap').then((m) => m.GeoSourceMap),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="p-6">
        地図を準備しています…
      </p>
    ),
  }
);
const subscribe = () => () => {};
export function GeoSourceExplorer({
  item,
  fields = [],
}: {
  item: GeoSourceItem;
  fields?: GeoSourceField[];
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const [initialIndex] = useState(() => {
    const asset = findGeoSourceInitialAsset(item.assets);
    return asset ? item.assets.indexOf(asset) : null;
  });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(String(initialIndex ?? 0));
  const [opened, setOpened] = useState<number | null>(initialIndex);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(Math.floor((initialIndex ?? 0) / 100));
  const filtered = item.assets
    .map((asset, index) => ({ asset, index }))
    .filter(({ asset }) =>
      asset.label.toLowerCase().includes(query.trim().toLowerCase())
    );
  const visible = filtered.slice(page * 100, (page + 1) * 100);
  const selection =
    visible.find(({ index }) => String(index) === selected) ?? visible[0];
  const showSelection = item.assets.length > 1 || initialIndex === null;
  return (
    <SurfaceCard
      className="space-y-2 p-3"
      data-geo-asset={opened === null ? undefined : item.assets[opened].key}
    >
      {showSelection && (
        <ContentDisclosure
          title="配布区画を選ぶ"
          defaultOpen={initialIndex === null}
          bordered={false}
          contentClassName="space-y-3"
        >
          <p className="text-sm leading-relaxed">
            全国一括・都道府県・メッシュなど、原典の配布単位で収録しています。区画は行政区域と一致するとは限りません。
            {initialIndex === null &&
              'このGISはファイルが大きいため、区画を選んで地図を開いてください。'}
          </p>
          <div>
            <label htmlFor="source-search" className="mb-1 block text-sm">
              配布区画を検索
            </label>
            <Input
              id="source-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="都道府県名・区画番号・ファイル名"
            />
          </div>
          <div>
            <label htmlFor="source-asset" className="mb-1 block text-sm">
              地図で見る配布区画（{filtered.length}件）
            </label>
            <Select
              value={selection ? String(selection.index) : ''}
              onValueChange={setSelected}
              disabled={!selection}
            >
              <SelectTrigger
                id="source-asset"
                className="min-h-11 w-full [&>span]:truncate"
              >
                <SelectValue placeholder="一致する配布区画がありません" />
              </SelectTrigger>
              <SelectContent>
                {visible.map(({ asset, index }) => (
                  <SelectItem key={index} value={String(index)}>
                    {asset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtered.length > 100 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  前の100件
                </Button>
                <span className="text-xs">
                  {page * 100 + 1}〜
                  {Math.min((page + 1) * 100, filtered.length)}件
                </span>
                <Button
                  variant="outline"
                  disabled={(page + 1) * 100 >= filtered.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  次の100件
                </Button>
              </div>
            )}
          </div>
          {selection ? (
            <p className="break-words text-xs text-muted-foreground">
              選択中：{selection.asset.label}／約
              {(selection.asset.bytes / 1024 / 1024).toFixed(1)}{' '}
              MB。複数の区画を一度に読み込まず、選んだ区画を表示します。
            </p>
          ) : (
            <p role="status" className="text-sm">
              一致する配布区画がありません。検索語を変えてください。
            </p>
          )}
          <Button
            disabled={!hydrated || !selection}
            className="min-h-11"
            onClick={() => {
              if (!selection) return;
              setOpened(selection.index);
              setAttempt((n) => n + 1);
            }}
          >
            選んだ区画を地図で見る
          </Button>
        </ContentDisclosure>
      )}
      {opened !== null && (
        <SourceMap
          key={`${opened}-${attempt}`}
          url={`/api/geo/source/${item.dataId}/${opened}?file=${encodeURIComponent(item.assets[opened].key)}`}
          label={item.assets[opened].label}
          fields={fields}
        />
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        青い地物をタップすると属性を表示します。青は位置・形状を示し、値や危険度の大小を表しません。空白は安全・施設の不存在を意味しません。
      </p>
    </SurfaceCard>
  );
}
