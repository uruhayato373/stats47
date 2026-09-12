'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { Button } from '@stats47/components/atoms/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';

import { SurfaceCard } from '@/components/surface';

import { fetchGeoLayerAction } from '../actions';
import { GEO_BASEMAP_SHORELINE_ATTRIBUTION } from '../lib/geo-basemap';
import { GEO_CROSS_ANALYSIS_CONFIGS } from '../lib/geo-cross-analysis';
import { populationLayerColor, type GeoLayerData } from '../lib/geo-layer-data';

import type { GeoLayer } from '@stats47/data-configs/business-plan';
import type { GeoAnalysisEvidenceManifest } from '@stats47/gis';

const LayerMap = dynamic(
  () => import('./GeoLayerMap').then((m) => m.GeoLayerMap),
  {
    ssr: false,
    loading: () => (
      <p
        className="flex h-[360px] items-center justify-center text-sm sm:h-[480px] lg:h-[560px]"
        role="status"
      >
        地図を読み込んでいます…
      </p>
    ),
  }
);

export function GeoLayerExplorer({
  layer,
  manifest,
  initialPref,
  initialData,
}: {
  layer: GeoLayer;
  manifest: GeoAnalysisEvidenceManifest;
  initialPref: string;
  initialData: GeoLayerData;
}) {
  const [pref, setPref] = useState(initialPref);
  const [data, setData] = useState<GeoLayerData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [year, setYear] = useState<'2020' | '2050'>('2050');
  const [fullExtent, setFullExtent] = useState(false);
  const [showRows, setShowRows] = useState(false);
  useEffect(() => {
    if (pref === initialPref && retry === 0) {
      return;
    }
    let active = true;
    const artifact = manifest.stages
      .find((stage) => stage.id === 'population-mesh')
      ?.outputs.find((output) => output.areaCode === `${pref}000`);
    void (
      artifact
        ? fetchGeoLayerAction(layer.slug, pref, {
            generatedAt: manifest.generatedAt,
            sha256: artifact.sha256,
          })
        : Promise.resolve(null)
    )
      .then((next) => {
        if (active) setData(next);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pref, retry, initialData, initialPref, layer.slug, manifest]);
  const changePref = (value: string) => {
    if (value === pref) return;
    setLoading(value !== initialPref || retry !== 0);
    setData(value === initialPref && retry === 0 ? initialData : null);
    setPref(value);
    setShowRows(false);
    const url = new URL(window.location.href);
    url.searchParams.set('pref', value);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };
  const count = !data
    ? 0
    : data.kind === 'population'
      ? data.meshes.length
      : data.kind === 'land-price'
        ? data.points.length
        : data.stations.length;
  const rows = !data
    ? []
    : data.kind === 'population'
      ? data.meshes
          .slice(0, 20)
          .map(
            (m) =>
              `${m[0]}：2020年 ${m[5].toLocaleString('ja-JP')}人／2050年 ${m[6].toLocaleString('ja-JP')}人`
          )
      : data.kind === 'land-price'
        ? data.points
            .slice(0, 20)
            .map(
              (p) =>
                `${p[0]}：${p[3].toLocaleString('ja-JP')}円/㎡・前年比 ${p[4] === null ? '不明' : `${p[4]}%`}`
            )
        : data.stations
            .slice(0, 20)
            .map(
              (p) =>
                `${p[1]}（経度 ${(p[2] / 1e6).toFixed(5)}、緯度 ${(p[3] / 1e6).toFixed(5)}）`
            );
  return (
    <SurfaceCard className="p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="geo-layer-pref" className="text-sm font-semibold">
          表示する都道府県
        </label>
        <Select value={pref} onValueChange={changePref}>
          <SelectTrigger id="geo-layer-pref" className="min-h-11 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREFECTURE_LIST_2DIGIT.map((p) => (
              <SelectItem key={p.code} value={p.code}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {layer.kind === 'population' && (
          <div className="flex gap-2" aria-label="表示年">
            {(['2020', '2050'] as const).map((value) => (
              <Button
                key={value}
                variant={year === value ? 'default' : 'outline'}
                aria-pressed={year === value}
                onClick={() => setYear(value)}
                className="min-h-11"
              >
                {value}年
              </Button>
            ))}
          </div>
        )}
      </div>
      <p className="mb-3 text-sm leading-relaxed">
        {layer.kind === 'population'
          ? `${year}年人口（人/1kmメッシュ）。青が濃いほど人口が多く、灰色は0人です。`
          : layer.kind === 'land-price'
            ? '紫の点：住宅地の標準地点。点の色・大きさは価格の高低を表しません。'
            : '白い点：駅代表点。点の数は原典の駅施設数や路線数とは異なります。'}
      </p>
      {layer.kind === 'population' && (
        <ul
          aria-label="人口の凡例"
          className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs"
        >
          {[
            { value: 0, label: '0人' },
            { value: 1, label: '1〜99人' },
            { value: 100, label: '100〜999人' },
            { value: 1000, label: '1,000〜4,999人' },
            { value: 5000, label: '5,000人以上' },
          ].map((item) => (
            <li key={item.value} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-3 w-3 border"
                style={{ backgroundColor: populationLayerColor(item.value) }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          variant={!fullExtent ? 'default' : 'outline'}
          aria-pressed={!fullExtent}
          onClick={() => setFullExtent(false)}
          className="min-h-11"
        >
          分布の中心
        </Button>
        <Button
          variant={fullExtent ? 'default' : 'outline'}
          aria-pressed={fullExtent}
          onClick={() => setFullExtent(true)}
          className="min-h-11"
        >
          離島を含む全体
        </Button>
      </div>
      <div aria-busy={loading} className="relative z-0 overflow-hidden">
        {loading ? (
          <p
            role="status"
            className="flex h-[360px] items-center justify-center text-sm sm:h-[480px] lg:h-[560px]"
          >
            データを読み込んでいます…
          </p>
        ) : !data ? (
          <div role="alert" className="p-6">
            <p>
              データを確認できませんでした。再読み込みすると更新後のデータを取得できます。
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                setRetry((n) => n + 1);
              }}
              className="mt-3 min-h-11"
            >
              再試行
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-3 min-h-11"
            >
              ページを再読み込み
            </Button>
          </div>
        ) : count === 0 ? (
          <p role="status" className="p-6">
            この県の配信データに表示対象がありません。
          </p>
        ) : (
          <LayerMap data={data} year={year} fullExtent={fullExtent} />
        )}
      </div>
      <p className="mt-3 text-sm" aria-live="polite">
        {data
          ? `${data.areaName}・${count.toLocaleString('ja-JP')}件。地点やメッシュをタップして属性を確認できます。`
          : ''}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        背景は地理院タイル。背景の道路・地形はこのデータの属性ではありません。
        {GEO_BASEMAP_SHORELINE_ATTRIBUTION}
      </p>
      {data && (
        <>
          <Button
            variant="outline"
            aria-expanded={showRows}
            onClick={() => setShowRows((value) => !value)}
            className="mt-4 min-h-11"
          >
            属性を文字で確認（先頭20件）
          </Button>
          {showRows && (
            <ul className="mt-3 space-y-2 break-words text-sm">
              {rows.map((row, i) => (
                <li key={i}>{row}</li>
              ))}
            </ul>
          )}
        </>
      )}
      <div className="mt-6 border-t pt-4">
        <h2 className="font-semibold">このデータを重ねて読む</h2>
        <ul className="mt-2">
          {layer.related.map((slug) => (
            <li key={slug}>
              <Link
                className="inline-flex min-h-11 items-center text-sm text-primary underline"
                href={`/geo/${slug}?pref=${pref}&stage=overlap`}
              >
                {GEO_CROSS_ANALYSIS_CONFIGS[slug].eyebrow}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SurfaceCard>
  );
}
