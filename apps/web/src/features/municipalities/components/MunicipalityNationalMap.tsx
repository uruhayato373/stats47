'use client';

import { useEffect, useRef, useState } from 'react';

import { SectionHeader } from '@/components/section';

import { RankingMapChartClient } from '@/features/ranking/widgets';

import type { MetricPresentation, TopoJSONTopology } from '@stats47/types';

import { NATIONAL_CITY_TOPOJSON_PATH } from '@/constants/static-assets';
import { TOKYO_ISLAND_EXCLUDE_CODES } from '@/constants/tokyo-islands';


interface Props {
  title: string;
  visualization: MetricPresentation;
  unit: string;
  decimalPlaces: number;
  /** 名前は形データが持つので渡さない (HTML を軽くする) */
  values: ReadonlyArray<{ areaCode: string; value: number }>;
}

/** 画面に入る少し前から読み始める */
const LOAD_MARGIN = '300px';
/** ブラウザが忙しくても、この時間で読み始める */
const IDLE_TIMEOUT_MS = 2000;

/**
 * 全国の市区町村コロプレス。形データ (圧縮後 約 180KB) と地図の部品は、地図が画面に入るまで読まない。
 * ページの初期表示を遅くしないため。読めなければ地図を出さずに黙って閉じる。
 */
export function MunicipalityNationalMap({ title, visualization, unit, decimalPlaces, values }: Props) {
  const anchor = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [topology, setTopology] = useState<TopoJSONTopology | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = anchor.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: LOAD_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const load = () => {
      fetch(NATIONAL_CITY_TOPOJSON_PATH)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<TopoJSONTopology>;
        })
        .then((data) => {
          if (!cancelled) setTopology(data);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    };
    // デスクトップでは最初の画面に地図の頭が入るので、ブラウザが空いてから読む
    const idle = window.requestIdleCallback?.(load, { timeout: IDLE_TIMEOUT_MS });
    const timer = idle === undefined ? window.setTimeout(load, IDLE_TIMEOUT_MS) : undefined;
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [visible]);

  if (failed) return null;

  return (
    <section aria-label="全国の分布地図" className="mt-5">
      <SectionHeader title="全国の分布地図" hideRule className="mb-0" />
      <div ref={anchor} className="mt-2 min-h-[436px] border border-border p-2">
        {topology ? (
          <RankingMapChartClient
            rankingItem={{ title, unit, visualization, valueDisplay: { decimalPlaces } }}
            rankingValues={values}
            areaType="city"
            topology={topology}
            fitExcludeCodes={TOKYO_ISLAND_EXCLUDE_CODES}
            fitNationwide
            bare
            colorViewSwitch
            mapClassName="h-[420px]"
          />
        ) : (
          <div className="h-[420px] animate-pulse bg-muted/40" aria-hidden />
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        全国は形を簡略化しています。都道府県で絞り込むと、県内の詳しい地図を表示します。灰色は比較対象外 (データなし) の地域です。
      </p>
    </section>
  );
}
