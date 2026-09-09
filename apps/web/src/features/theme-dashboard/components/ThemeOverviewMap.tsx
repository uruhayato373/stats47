'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

import { Button } from '@stats47/components/atoms/ui/button';

import type { ThemeIndicatorData } from '../types';
import type { TopoJSONTopology } from '@stats47/types';

const ThemeLeafletMap = dynamic(
  () => import('./ThemeLeafletMap').then((module) => module.ThemeLeafletMap),
  {
    ssr: false,
    loading: () => (
      <p className="flex h-[360px] items-center justify-center text-sm text-muted-foreground lg:h-[400px]">
        地図を読み込み中…
      </p>
    ),
  }
);

export function ThemeOverviewMap({
  data,
  selectedCode,
  onSelect,
}: {
  data: ThemeIndicatorData;
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
}) {
  const [topology, setTopology] = useState<TopoJSONTopology | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/prefecture.topojson', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: TopoJSONTopology = await response.json();
        if (result.type !== 'Topology' || !result.objects)
          throw new Error('Invalid topology');
        if (!controller.signal.aborted) setTopology(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

  if (failed)
    return (
      <div
        role="status"
        className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm"
      >
        <p>地図を読み込めませんでした。数値は一覧表で確認できます。</p>
        <Button
          variant="outline"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          再読み込み
        </Button>
      </div>
    );
  return (
    <ThemeLeafletMap
      rankingItem={data.rankingItem}
      rankingValues={data.rankingValues}
      topology={topology}
      selectedPrefectureCode={selectedCode}
      onPrefectureClick={onSelect}
      enableDrilldown={false}
    />
  );
}
