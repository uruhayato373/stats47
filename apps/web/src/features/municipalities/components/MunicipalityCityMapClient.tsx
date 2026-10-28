'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { rankingItemToMapConfig } from '@/features/map-visualization/client';

import { trackNavClick } from '@/lib/analytics/events';

import type { MetricPresentation, TopoJSONTopology } from '@stats47/types';


const CityMapChart = dynamic(
  () =>
    import('@stats47/visualization/d3/CityMapChart').then(
      (m) => m.CityMapChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-full animate-pulse bg-muted/40" aria-hidden />
    ),
  }
);

const MUNICIPALITY_MAP_CLASSES = 5;

/**
 * 県内の市区町村地図は、連続色の指標を分位 5 段階で塗る (2026-10-28)。
 * 指標の設定 (都道府県地図と共有) は等間隔が多く、県内に飛び抜けた自治体があると他がすべて一番薄い段に入る
 * (愛知県の製造品出荷額: 豊田市 20.5 兆円・2 位の名古屋市 3.5 兆円で、等間隔 5 段では 53 市町村が同じ色)。
 * 分位は段の順番で色を付けるので、外れ値があっても下の段の色が薄まらない。発散色 (正負) は設定のまま使う。
 */
export function toMunicipalityMapConfig(
  config: ReturnType<typeof rankingItemToMapConfig>
): ReturnType<typeof rankingItemToMapConfig> {
  if (config.colorSchemeType !== 'sequential') return config;
  return { ...config, classification: { method: 'quantile', classes: MUNICIPALITY_MAP_CLASSES } };
}

export interface MunicipalityMapPoint {
  areaCode: string;
  areaName: string;
  value: number;
  rank: number;
}

interface Props {
  topology: TopoJSONTopology;
  points: MunicipalityMapPoint[];
  unit: string;
  visualization: MetricPresentation;
  /** クリックで遷移できる自治体 (UrlPolicy.city.isIndexable を通ったもの) */
  hrefByCode: Record<string, string>;
  /** 投影フィット計算から外すコード (遠隔離島。描画からは外れない) */
  fitExcludeCodes?: string[];
}

export function MunicipalityCityMapClient({
  topology,
  points,
  unit,
  visualization,
  hrefByCode,
  fitExcludeCodes,
}: Props) {
  const router = useRouter();
  const colorConfig = toMunicipalityMapConfig(rankingItemToMapConfig({ visualization }));

  return (
    <CityMapChart
      data={points}
      colorConfig={colorConfig}
      topology={topology}
      unit={unit}
      fitExcludeCodes={fitExcludeCodes}
      onCityClick={(areaCode) => {
        const href = hrefByCode[areaCode];
        if (!href) return;
        try {
          trackNavClick({
            label:
              points.find((p) => p.areaCode === areaCode)?.areaName ?? areaCode,
            href,
            surface: 'municipalities_map',
          });
        } catch {
          // 計測失敗で遷移を止めない
        }
        router.push(href);
      }}
    />
  );
}
