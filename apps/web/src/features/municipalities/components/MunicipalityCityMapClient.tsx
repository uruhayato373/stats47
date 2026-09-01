'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import type { TopoJSONTopology } from '@stats47/types';

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
  /** resolveColorScheme (配色の正典) が決めた interpolate 名 */
  colorScheme: string;
  colorSchemeType: 'sequential' | 'diverging';
  divergingMidpoint?: 'zero' | 'mean' | 'median' | number;
  /** クリックで遷移できる自治体 (UrlPolicy.city.isIndexable を通ったもの) */
  hrefByCode: Record<string, string>;
  /** 投影フィット計算から外すコード (遠隔離島。描画からは外れない) */
  fitExcludeCodes?: string[];
}

export function MunicipalityCityMapClient({
  topology,
  points,
  unit,
  colorScheme,
  colorSchemeType,
  divergingMidpoint,
  hrefByCode,
  fitExcludeCodes,
}: Props) {
  const router = useRouter();
  const colorConfig =
    colorSchemeType === 'diverging'
      ? {
          colorSchemeType: 'diverging' as const,
          colorScheme,
          divergingMidpoint: divergingMidpoint ?? ('zero' as const),
        }
      : { colorSchemeType: 'sequential' as const, colorScheme };

  return (
    <CityMapChart
      data={points}
      colorConfig={colorConfig}
      topology={topology}
      unit={unit}
      fitExcludeCodes={fitExcludeCodes}
      onCityClick={(areaCode) => {
        const href = hrefByCode[areaCode];
        if (href) router.push(href);
      }}
    />
  );
}
