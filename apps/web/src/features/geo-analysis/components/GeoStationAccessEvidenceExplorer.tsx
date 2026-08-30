'use client';

import { useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
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

import { fetchStationAccessDetailAction } from '../actions';

import type { GeoStationAccessView } from '../lib/geo-station-access-evidence';
import type {
  GeoAnalysisEvidenceManifest,
  GeoStationAccessPrefDetail,
} from '@stats47/gis';

const GeoStationAccessLeafletMap = dynamic(
  () =>
    import('./GeoStationAccessLeafletMap').then(
      (module) => module.GeoStationAccessLeafletMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] animate-pulse rounded-md bg-muted lg:h-[620px]" />
    ),
  }
);

interface Props {
  analysisId: string;
  dataVersion: string;
  initialPrefCode: string;
  initialView: GeoStationAccessView;
  manifest: GeoAnalysisEvidenceManifest;
}

const VIEW_LABELS: Record<GeoStationAccessView, string> = {
  population: '1. 2020→2050人口',
  overlap: '2. 駅800m圏との重なり',
  audit: '3. 集計の検算',
};

function formatPeople(value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')}人`;
}

export function GeoStationAccessEvidenceExplorer({
  analysisId,
  dataVersion,
  initialPrefCode,
  initialView,
  manifest,
}: Props) {
  const cache = useRef(new Map<string, GeoStationAccessPrefDetail>());
  const requestId = useRef(0);
  const [prefCode, setPrefCode] = useState(initialPrefCode);
  const [view, setView] = useState<GeoStationAccessView>(initialView);
  const [detail, setDetail] = useState<GeoStationAccessPrefDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const common = {
    analysisId,
    analysisSlug: 'population-station-access',
    geography: 'mesh' as const,
    dataVersion,
  };

  useEffect(() => {
    const cached = cache.current.get(prefCode);
    if (cached) {
      setDetail(cached);
      setLoading(false);
      setFailed(false);
      return;
    }
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setFailed(false);
    void fetchStationAccessDetailAction(prefCode).then((nextDetail) => {
      if (requestId.current !== currentRequest) return;
      if (nextDetail) {
        cache.current.set(prefCode, nextDetail);
        setDetail(nextDetail);
        setFailed(false);
      } else {
        setDetail(null);
        setFailed(true);
      }
      setLoading(false);
    });
  }, [prefCode]);

  const updateUrl = (nextPrefCode: string, nextView: GeoStationAccessView) => {
    const url = new URL('/geo/population-station-access', window.location.origin);
    url.searchParams.set('pref', nextPrefCode);
    url.searchParams.set('stage', nextView);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const changePrefecture = (nextPrefCode: string) => {
    setPrefCode(nextPrefCode);
    updateUrl(nextPrefCode, view);
    trackGeoRegionSelect({
      ...common,
      areaCode: `${nextPrefCode}000`,
    });
  };

  const changeView = (value: string) => {
    const nextView = value as GeoStationAccessView;
    setView(nextView);
    updateUrl(prefCode, nextView);
    trackGeoMapInteraction({
      ...common,
      interactionType: `stage-${nextView}`,
      areaCode: `${prefCode}000`,
    });
  };

  return (
    <SurfaceSection className="mb-6" aria-label="結論になる前の地図を確認">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionHeader title="結論になる前の地図を確認" hideRule />
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            最終順位だけでなく、人口メッシュ、駅との空間結合、集計検算を同じ県で順に確認できます。駅別乗降客数は分析結果を理解する補助レイヤーで、800m圏の判定には使っていません。
          </p>
        </div>
        <Select value={prefCode} onValueChange={changePrefecture}>
          <SelectTrigger className="w-full sm:w-48" aria-label="都道府県を選択">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREFECTURE_LIST_2DIGIT.map((prefecture) => (
              <SelectItem key={prefecture.code} value={prefecture.code}>
                {prefecture.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={view} onValueChange={changeView} className="mt-5">
        <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
          {(Object.keys(VIEW_LABELS) as GeoStationAccessView[]).map((key) => (
            <TabsTrigger key={key} value={key} className="min-h-11">
              {VIEW_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="population" className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            青緑は人口維持・増加、青は減少15%未満、橙は15〜30%減、赤は30%以上減を示します。
          </p>
          {detail && !loading ? (
            <GeoStationAccessLeafletMap detail={detail} view="population" />
          ) : null}
        </TabsContent>
        <TabsContent value="overlap" className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            緑が駅代表点から800m以内の1kmメッシュ、灰色が圏外、白い点が駅代表点です。判定はメッシュ中心点との大円距離です。
          </p>
          {detail && !loading ? (
            <GeoStationAccessLeafletMap detail={detail} view="overlap" />
          ) : null}
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          {detail && !loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SurfaceCard>
                <p className="text-xs text-muted-foreground">人口メッシュ</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {detail.summary.meshCount.toLocaleString('ja-JP')}
                </p>
                <p className="text-sm text-muted-foreground">
                  うち駅800m圏 {detail.summary.accessibleMeshCount.toLocaleString('ja-JP')}
                </p>
              </SurfaceCard>
              <SurfaceCard>
                <p className="text-xs text-muted-foreground">県人口 2020</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatPeople(detail.summary.population2020)}
                </p>
                <p className="text-sm text-muted-foreground">
                  2050 {formatPeople(detail.summary.population2050)}
                </p>
              </SurfaceCard>
              <SurfaceCard>
                <p className="text-xs text-muted-foreground">駅圏人口 2020</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatPeople(detail.summary.accessiblePopulation2020)}
                </p>
                <p className="text-sm text-muted-foreground">
                  2050 {formatPeople(detail.summary.accessiblePopulation2050)}
                </p>
              </SurfaceCard>
              <SurfaceCard>
                <p className="text-xs text-muted-foreground">駅圏人口比率</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {detail.summary.stationAccessShare2020}% →{' '}
                  {detail.summary.stationAccessShare2050}%
                </p>
                <p className="text-sm text-muted-foreground">
                  駅代表点 {detail.summary.displayedStationCount.toLocaleString('ja-JP')}
                </p>
              </SurfaceCard>
            </div>
          ) : null}
          <div className="mt-4 border-l-2 border-primary pl-3 text-sm leading-relaxed text-muted-foreground">
            manifestで47県すべての中間artifactと最終集計を照合済みです（保存則チェック {manifest.quality.conservationChecks}/47、最大artifact {(manifest.quality.maxDetailBytes / 1_000_000).toFixed(1)}MB）。
          </div>
        </TabsContent>
      </Tabs>

      {loading ? (
        <div role="status" className="mt-4 h-[480px] animate-pulse rounded-md bg-muted lg:h-[620px]">
          <span className="sr-only">県別メッシュデータを読み込んでいます</span>
        </div>
      ) : null}
      {failed ? (
        <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/5 p-4 text-sm">
          この県の途中データを読み込めませんでした。最終集計は下の全国地図で確認できます。
        </p>
      ) : null}
    </SurfaceSection>
  );
}
