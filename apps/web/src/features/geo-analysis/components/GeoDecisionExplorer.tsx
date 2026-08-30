'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';

import { SurfaceCard, SurfaceSection } from '@/components/surface';

import { trackGeoRegionSelect } from '@/lib/analytics/events';

import type { GeoDecisionRow } from '../lib/build-geo-decision-rows';

interface Props {
  rows: readonly GeoDecisionRow[];
  initialAreaCode?: string;
}

function integer(value: number): string {
  return `${Math.round(value).toLocaleString('ja-JP')}人`;
}

function signedPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function GeoDecisionExplorer({
  rows,
  initialAreaCode = '13000',
}: Props) {
  const fallbackCode = rows[0]?.areaCode ?? '';
  const validInitialCode = rows.some((row) => row.areaCode === initialAreaCode)
    ? initialAreaCode
    : fallbackCode;
  const [selectedCode, setSelectedCode] = useState(validInitialCode);
  const selected = useMemo(
    () => rows.find((row) => row.areaCode === selectedCode) ?? rows[0],
    [rows, selectedCode],
  );

  if (!selected) return null;

  const selectArea = (areaCode: string) => {
    setSelectedCode(areaCode);
    trackGeoRegionSelect({
      analysisId: 'm1-geo-decision-compare',
      analysisSlug: 'compare',
      geography: 'prefecture',
      dataVersion: '2020-2050',
      areaCode,
    });
  };

  const cards = [
    {
      label: '将来人口',
      question: '2050年に何人暮らすか',
      value: integer(selected.population2050),
      detail: `2020年比 ${signedPercent(selected.populationChangeRate)}`,
      href: '/geo/2050-population',
    },
    {
      label: '人口 × 地価',
      question: '住宅地価格はどう動いているか',
      value: signedPercent(selected.landPriceChange),
      detail: `住宅地中央値 ${Math.round(selected.medianResidentialLandPrice).toLocaleString('ja-JP')}円/㎡`,
      href: '/geo/population-land-price',
    },
    {
      label: '人口 × 洪水',
      question: '浸水想定区域に何人暮らすか',
      value: integer(selected.floodExposurePopulation),
      detail: `2050年県人口の ${percent(selected.floodExposureShare)}`,
      href: '/geo/population-flood-risk',
    },
    {
      label: '人口 × 駅800m圏',
      question: '駅の近くに何人残るか',
      value: integer(selected.stationAccessPopulation),
      detail: `2050年県人口の ${percent(selected.stationAccessShare)}`,
      href: '/geo/population-station-access',
    },
  ] as const;

  return (
    <SurfaceSection aria-labelledby="geo-decision-title">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-primary">都道府県を1つ選ぶ</p>
          <h2 id="geo-decision-title" className="mt-1 text-lg font-bold">
            {selected.areaName}を4つの問いで読む
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            順位ではなく、人口・住まい・防災・交通を同じ地域コードで横断します。
          </p>
        </div>
        <Select value={selectedCode} onValueChange={selectArea}>
          <SelectTrigger className="w-full sm:w-56" aria-label="都道府県を選択">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rows.map((row) => (
              <SelectItem key={row.areaCode} value={row.areaCode}>
                {row.areaName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <SurfaceCard key={card.href} className="p-5">
            <p className="text-xs font-semibold text-primary">{card.label}</p>
            <h3 className="mt-2 text-sm font-bold">{card.question}</h3>
            <p className="mt-3 text-2xl font-bold tabular-nums">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
            <Link
              className="mt-4 inline-block text-sm font-medium text-primary underline"
              href={card.href}
            >
              地図・47県比較・計算方法を見る →
            </Link>
          </SurfaceCard>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        洪水は1kmメッシュ中心点による近似、駅800mは直線距離です。個別地点の安全や実際の徒歩経路を判定する値ではありません。
      </p>
    </SurfaceSection>
  );
}
