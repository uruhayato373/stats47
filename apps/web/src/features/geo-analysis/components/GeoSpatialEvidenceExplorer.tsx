'use client';

import { useEffect, useRef, useState } from 'react';

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@stats47/components/atoms/ui/tabs';

import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceSection } from '@/components/surface';

import {
  trackGeoMapInteraction,
  trackGeoRegionSelect,
} from '@/lib/analytics/events';

import { fetchGeoDetailAction } from '../actions';
import { GEO_BASEMAP_SHORELINE_ATTRIBUTION } from '../lib/geo-basemap';
import {
  GEO_CROSS_ANALYSIS_CONFIGS,
  type GeoCrossAnalysisSlug,
} from '../lib/geo-cross-analysis';
import {
  POPULATION_LEGEND,
  spatialAuditRows,
  type SpatialView,
} from '../lib/geo-spatial-evidence';

import type {
  GeoAnalysisEvidenceManifest,
  GeoAnalysisPrefDetail,
} from '@stats47/gis';

const SpatialMap = dynamic(
  () => import('./GeoSpatialLeafletMap').then((m) => m.GeoSpatialLeafletMap),
  { ssr: false }
);
const StationMap = dynamic(
  () =>
    import('./GeoStationAccessLeafletMap').then(
      (m) => m.GeoStationAccessLeafletMap
    ),
  { ssr: false }
);

export function GeoSpatialEvidenceExplorer({
  slug,
  analysisId,
  dataVersion,
  initialPrefCode,
  initialView,
  manifest,
  fixedPrefecture = false,
}: {
  slug: GeoCrossAnalysisSlug;
  analysisId: string;
  dataVersion: string;
  initialPrefCode: string;
  initialView: SpatialView;
  manifest: GeoAnalysisEvidenceManifest;
  fixedPrefecture?: boolean;
}) {
  const [prefCode, setPrefCode] = useState(initialPrefCode);
  const [view, setView] = useState(initialView);
  const [detail, setDetail] = useState<GeoAnalysisPrefDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const cache = useRef(new Map<string, GeoAnalysisPrefDetail>());
  const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
  const common = {
    analysisId,
    analysisSlug: slug,
    geography: 'mesh' as const,
    dataVersion,
  };
  useEffect(() => {
    let active = true;
    const key = `${slug}:${prefCode}`;
    const cached = cache.current.get(key);
      void (cached ? Promise.resolve(cached) : fetchGeoDetailAction(slug, prefCode))
        .then((next) => {
          if (!active) return;
          if (next) cache.current.set(key, next);
          setDetail(next);
        })
        .catch(() => {
          if (active) setDetail(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [slug, prefCode, retry]);
  const updateUrl = (pref: string, stage: SpatialView) => {
    const url = new URL(window.location.href);
    url.pathname = `/geo/${slug}`;
    url.searchParams.set('pref', pref);
    url.searchParams.set('stage', stage);
    url.hash = 'spatial-evidence';
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  };
  const changePref = (value: string) => {
    if (value === prefCode) return;
    setLoading(true);
    setDetail(null);
    setPrefCode(value);
    updateUrl(value, view);
    trackGeoRegionSelect({ ...common, areaCode: `${value}000` });
  };
  const changeView = (value: string) => {
    if (value !== 'population' && value !== 'overlap' && value !== 'audit')
      return;
    setView(value);
    updateUrl(prefCode, value);
    trackGeoMapInteraction({
      ...common,
      areaCode: `${prefCode}000`,
      interactionType: `stage-${value}`,
    });
  };
  return (
    <SurfaceSection
      id="spatial-evidence"
      className="mb-6 scroll-mt-24"
      aria-label="県内の空間分析"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          title="県内のどこで重なるか"
          description={config.spatialReading}
          hideRule
        />
        <Select value={prefCode} onValueChange={changePref} disabled={fixedPrefecture}>
          <SelectTrigger className="w-full sm:w-48" aria-label="地図の都道府県">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREFECTURE_LIST_2DIGIT.map((pref) => (
              <SelectItem key={pref.code} value={pref.code}>
                {pref.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs value={view} onValueChange={changeView} className="mt-4">
        <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="population" className="min-h-11">
            1. 人口の分布と変化
          </TabsTrigger>
          <TabsTrigger value="overlap" className="min-h-11">
            2. {config.overlapLabel}
          </TabsTrigger>
          <TabsTrigger value="audit" className="min-h-11">
            3. 数値の確かめ方
          </TabsTrigger>
        </TabsList>
        {(['population', 'overlap'] as const).map((stage) => (
          <TabsContent key={stage} value={stage} className="mt-4">
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {stage === 'population'
                ? POPULATION_LEGEND
                : config.overlapLegend}
            </p>
            {detail && !loading ? (
              detail.slug === 'population-station-access' ? (
                <StationMap detail={detail} view={stage} />
              ) : (
                <SpatialMap detail={detail} view={stage} />
              )
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {config.mapLimit}{' '}
              地図は拡大・移動できます。地点・メッシュの値はタップでも確認できます。
            </p>
          </TabsContent>
        ))}
        <TabsContent value="audit" className="mt-4">
          {detail && !loading ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {spatialAuditRows(detail).map((row) => (
                <SurfaceCard key={row.label}>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="mt-2 text-base font-semibold tabular-nums">
                    {row.value}
                  </p>
                </SurfaceCard>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">
            全47県の途中データと県別集計を照合（
            {manifest.quality.conservationChecks}
            /47）。表示の人数は丸めているため足し算に1人程度の差が出ることがあります。検算は丸め前の値で行います。
          </p>
        </TabsContent>
      </Tabs>
      {loading ? (
        <p
          role="status"
          className="flex h-64 items-center justify-center bg-muted text-sm"
        >
          県別の地点・人口メッシュを読み込んでいます…
        </p>
      ) : !detail ? (
        <div role="alert" className="mt-4">
          <p className="text-sm">この県の空間データを読み込めませんでした。</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => { setLoading(true); setRetry((v) => v + 1); }}
          >
            再読み込み
          </Button>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link
          href={`/geo/${slug}/${prefCode}/${view}`}
          className="text-primary underline"
        >
          この県・この表示を共有
        </Link>
        <Link
          href={`/geo/data/${slug}/${prefCode}`}
          className="text-primary underline"
        >
          この県の地点・検算データを見る
        </Link>
        <Link href={`/geo/${slug}#methods`} className="text-primary underline">
          一次資料と判定方法
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">背景地図は地理院タイルをその都度読み込んでいます。背景の道路・地形は計算には使いません。{GEO_BASEMAP_SHORELINE_ATTRIBUTION}</p>
    </SurfaceSection>
  );
}
