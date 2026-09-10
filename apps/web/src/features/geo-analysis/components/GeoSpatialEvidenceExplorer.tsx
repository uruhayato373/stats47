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
  PUBLIC_FACILITY_GROUPS,
  PUBLIC_FACILITY_BAND_LABELS,
  PUBLIC_FACILITY_BAND_COLORS,
  type PublicFacilityGroup,
} from '../lib/geo-public-facility-evidence';
import {
  isGeoSpatialView,
  POPULATION_LEGEND,
  spatialAuditRows,
  type SpatialView,
} from '../lib/geo-spatial-evidence';

import { GeoLandslideAudit } from './GeoLandslideAudit';

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

const PublicFacilityMap = dynamic(
  () =>
    import('./GeoPublicFacilityLeafletMap').then(
      (m) => m.GeoPublicFacilityLeafletMap
    ),
  { ssr: false }
);

const LandslideMap = dynamic(() => import('./GeoLandslideLeafletMap').then(m => m.GeoLandslideLeafletMap), { ssr: false });

const SnowMap = dynamic(() => import('./GeoSnowDesignationLeafletMap').then(m => m.GeoSnowDesignationLeafletMap), { ssr: false });

interface Props {
  slug: GeoCrossAnalysisSlug;
  analysisId: string;
  dataVersion: string;
  initialPrefCode: string;
  initialView: SpatialView;
  initialFacilityGroup?: PublicFacilityGroup;
  manifest: GeoAnalysisEvidenceManifest;
  fixedPrefecture?: boolean;
  /** Embedded views keep the host page's URL and prefecture selection. */
  syncUrl?: boolean;
}

export function GeoSpatialEvidenceExplorer(props: Props) {
  // Next Link query navigation can preserve this client boundary. Reset its local
  // state whenever the server-provided selection or evidence generation changes.
  const key = `${props.slug}:${props.initialPrefCode}:${props.initialView}:${props.initialFacilityGroup ?? 'administrative'}:${props.manifest.generatedAt}:${props.manifest.aggregate.sha256}`;
  return <GeoSpatialEvidenceExplorerState key={key} {...props} />;
}

function GeoSpatialEvidenceExplorerState({
  slug,
  analysisId,
  dataVersion,
  initialPrefCode,
  initialView,
  initialFacilityGroup = 'administrative',
  manifest,
  fixedPrefecture = false,
  syncUrl = true,
}: Props) {
  const [prefCode, setPrefCode] = useState(initialPrefCode);
  const [view, setView] = useState(initialView);
  const [facilityGroup, setFacilityGroup] =
    useState<PublicFacilityGroup>(initialFacilityGroup);
  const publicFacility = slug === 'population-public-facility-access';
  const landslide = slug === 'population-landslide-exposure';
  const hasFacilities = publicFacility || landslide;
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
    const timeout = setTimeout(() => {
      active = false;
      setDetail(null);
      setLoading(false);
    }, 30_000);
    const artifact = manifest.stages
      .find((stage) => stage.id === 'population-mesh')
      ?.outputs.find((output) => output.areaCode === `${prefCode}000`);
    const key = `${slug}:${prefCode}:${manifest.generatedAt}:${artifact?.sha256 ?? 'missing'}`;
    const cached = cache.current.get(key);
    void (
      cached
        ? Promise.resolve(cached)
        : artifact
          ? fetchGeoDetailAction(slug, prefCode, {
              generatedAt: manifest.generatedAt,
              sha256: artifact.sha256,
            })
          : Promise.resolve(null)
    )
      .then((next) => {
        if (!active) return;
        if (next) cache.current.set(key, next);
        setDetail(next);
      })
      .catch(() => {
        if (active) setDetail(null);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [slug, prefCode, retry, manifest]);
  const updateUrl = (
    pref: string,
    stage: SpatialView,
    group = facilityGroup
  ) => {
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    url.pathname = `/geo/${slug}`;
    url.searchParams.set('pref', pref);
    url.searchParams.set('stage', stage);
    if (publicFacility) url.searchParams.set('group', group);
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
    if (!isGeoSpatialView(value, slug)) return;
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
      id={syncUrl ? 'spatial-evidence' : `${slug}-spatial-evidence`}
      className="mb-6 scroll-mt-24"
      aria-label="県内の空間分析"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          title="県内のどこで重なるか"
          description={config.spatialReading}
          hideRule
        />
        {fixedPrefecture ? (
          <p className="text-sm font-medium">
            {
              PREFECTURE_LIST_2DIGIT.find((pref) => pref.code === prefCode)
                ?.name
            }
          </p>
        ) : (
          <Select
            value={prefCode}
            onValueChange={changePref}
            disabled={fixedPrefecture}
          >
            <SelectTrigger
              className="w-full sm:w-48"
              aria-label="地図の都道府県"
            >
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
        )}
      </div>
      {publicFacility ? (
        <Select
          value={facilityGroup}
          onValueChange={(value) => {
            if (value !== 'administrative' && value !== 'meeting') return;
            setFacilityGroup(value);
            updateUrl(prefCode, view, value);
          }}
        >
          <SelectTrigger
            className="mt-4 w-full sm:w-80"
            aria-label="地図の施設群"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PUBLIC_FACILITY_GROUPS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Tabs value={view} onValueChange={changeView} className="mt-4">
        <TabsList
          className={`grid h-auto w-full grid-cols-1 ${hasFacilities ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}
        >
          <TabsTrigger value="population" className="min-h-11">
            {slug === 'population-snow-designation' || landslide ? '1. 2020年基準人口の分布' : '1. 人口の分布と変化'}
          </TabsTrigger>
          {hasFacilities ? (
            <TabsTrigger value="facilities" className="min-h-11">
              2. 県内の原典施設
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="overlap" className="min-h-11">
            {hasFacilities ? '3.' : '2.'} {config.overlapLabel}
          </TabsTrigger>
          <TabsTrigger value="audit" className="min-h-11">
            {hasFacilities ? '4.' : '3.'} 数値の確かめ方
          </TabsTrigger>
        </TabsList>
        {(hasFacilities
          ? (['population', 'facilities', 'overlap'] as const)
          : (['population', 'overlap'] as const)
        ).map((stage) => (
          <TabsContent key={stage} value={stage} className="mt-4">
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {stage === 'population'
                ? landslide ? '2020年基準人口：薄青＝100人未満、青＝100〜999人、濃青＝1,000人以上。' : slug === 'population-snow-designation' ? '2020年基準人口：薄青＝100人未満、青＝100〜999人、濃青＝1,000人以上。灰色の輪郭は指定境界を横切る格子です。' : POPULATION_LEGEND
                : stage === 'facilities'
                  ? landslide ? '行政施設と公的集会施設の原典地点を全件表示します。施設の種類と指定区域への包含をタップして確認できます。' : '選択県の原典施設を全件表示します。施設群を切り替えて確認できます。白い点は2022年4月の施設地点です。'
                  : config.overlapLegend}
            </p>
            {publicFacility && stage === 'overlap' ? (
              <ul
                aria-label="距離帯の凡例"
                className="mb-3 flex flex-wrap gap-3 text-xs"
              >
                {PUBLIC_FACILITY_BAND_LABELS.map((label, band) => (
                  <li key={label} className="flex items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="inline-block h-3 w-3"
                      style={{
                        backgroundColor: PUBLIC_FACILITY_BAND_COLORS[band],
                      }}
                    />
                    {label}
                  </li>
                ))}
              </ul>
            ) : null}
            {detail && !loading ? (
              detail.slug === 'population-landslide-exposure' ? (
                detail.status === 'available' ? <LandslideMap detail={detail} view={stage} manifest={manifest} /> : <p role="status">{detail.reason} 欠測は0として扱いません。</p>
              ) : detail.slug === 'population-public-facility-access' ? (
                <PublicFacilityMap
                  detail={detail}
                  view={stage}
                  group={facilityGroup}
                />
              ) : stage === 'facilities' ? null : detail.slug ===
                'population-station-access' ? (
                <StationMap detail={detail} view={stage} />
              ) : detail.slug === 'population-snow-designation' ? (
                <SnowMap detail={detail} view={stage} manifest={manifest} />
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
          {detail && !loading ? (detail.slug === 'population-landslide-exposure' ? <GeoLandslideAudit detail={detail} /> :
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
            {landslide ? '対象46県（京都府除外）の途中データと県別集計を照合（' : '全47県の途中データと県別集計を照合（'}
            {manifest.quality.conservationChecks}
            /{landslide ? 46 : 47}）。表示の人数は丸めているため足し算に1人程度の差が出ることがあります。検算は丸め前の値で行います。
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
            onClick={() => {
              setLoading(true);
              setRetry((v) => v + 1);
            }}
          >
            再読み込み
          </Button>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link
          href={`/geo/${slug}?pref=${prefCode}&stage=${view}${publicFacility ? `&group=${facilityGroup}` : ''}`}
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
      <p className="mt-3 text-xs text-muted-foreground">
        背景地図は地理院タイルをその都度読み込んでいます。背景の道路・地形は計算には使いません。
        {GEO_BASEMAP_SHORELINE_ATTRIBUTION}
      </p>
    </SurfaceSection>
  );
}
