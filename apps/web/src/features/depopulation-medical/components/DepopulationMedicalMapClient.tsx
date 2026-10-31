"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { to2DigitPrefCode } from "@stats47/area";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { LEAFLET_MAP_COLORS } from "@/features/map-visualization/client";
import { useThemePrefecture } from "@/features/theme-dashboard";

import { fetchPrefDetail } from "../actions";

import type {
  DepopulationMedicalPrefDetail,
  DepopulationMedicalSummary,
} from "../lib/types";

/** 凡例は地図 (PrefectureOverlayMap) と同じ識別配色を参照して色ずれを防ぐ */
const OVERLAY_COLORS = LEAFLET_MAP_COLORS.depopulationMedical;

const PrefectureOverlayMap = dynamic(
  () => import("./PrefectureOverlayMap").then((m) => m.PrefectureOverlayMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] lg:h-[520px] w-full" />,
  },
);

interface Props {
  summary: DepopulationMedicalSummary;
}

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/**
 * 過疎地域と医療機関の重なり。ページの地域 (県のページはその県、全国のページは全国) だけを見せる
 * (2026-10-31 オーナー決定。旧: 47 都道府県の地図と順位表をいつも描き、地図で県を選ばせていた。比較はランキングのページ)。
 * 県のページはその県の重なりの地図、全国のページは施設数を足した全国の比率を出す。
 */
export function DepopulationMedicalMapClient({ summary }: Props) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const [prefDetail, setPrefDetail] =
    useState<DepopulationMedicalPrefDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const detailCache = useRef<Map<string, DepopulationMedicalPrefDetail>>(
    new Map(),
  );

  const selectedSummary = useMemo(
    () =>
      selectedPrefectureCode
        ? summary.prefectures.find((p) => p.prefCode === selectedPrefectureCode)
        : undefined,
    [selectedPrefectureCode, summary.prefectures],
  );
  const national = useMemo(() => {
    const inside = summary.prefectures.reduce((sum, p) => sum + p.depopulationFacilities, 0);
    const total = summary.prefectures.reduce((sum, p) => sum + p.totalFacilities, 0);
    return { inside, total, ratio: total > 0 ? inside / total : 0 };
  }, [summary.prefectures]);

  useEffect(() => {
    if (!selectedPrefectureCode) return;
    const code2 = to2DigitPrefCode(selectedPrefectureCode);
    const cached = detailCache.current.get(code2);
    if (cached) {
      setPrefDetail(cached);
      return;
    }
    setPrefDetail(null);
    startTransition(async () => {
      const detail = await fetchPrefDetail(code2);
      if (detail) {
        detailCache.current.set(code2, detail);
        setPrefDetail(detail);
      }
    });
  }, [selectedPrefectureCode]);

  if (summary.prefectures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        データを読み込めませんでした。スナップショットの生成が必要です。
      </p>
    );
  }

  const shown = selectedSummary
    ? { inside: selectedSummary.depopulationFacilities, total: selectedSummary.totalFacilities, ratio: selectedSummary.ratio }
    : national;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          <span className="mr-1 text-muted-foreground">過疎地域内</span>
          <span className="font-bold" style={{ color: OVERLAY_COLORS.insideArea }}>
            {shown.inside.toLocaleString("ja-JP")}
          </span>{" "}
          施設
        </span>
        <span>
          <span className="mr-1 text-muted-foreground">{selectedSummary ? "県内全体" : "全国"}</span>
          {shown.total.toLocaleString("ja-JP")} 施設
        </span>
        <span>
          <span className="mr-1 text-muted-foreground">比率</span>
          {pct(shown.ratio)}
        </span>
      </div>
      {selectedSummary ? (
        isPending || !prefDetail ? (
          <Skeleton className="h-[420px] lg:h-[520px] w-full" />
        ) : (
          <>
            <PrefectureOverlayMap detail={prefDetail} />
            <p className="text-xs text-muted-foreground">
              <span style={{ color: OVERLAY_COLORS.insideArea }}>●</span>{" "}
              過疎地域内の医療機関 /{" "}
              <span style={{ color: OVERLAY_COLORS.outsideArea }}>●</span>{" "}
              過疎地域外 /{" "}
              <span style={{ color: OVERLAY_COLORS.areaPolygon }}>■</span>{" "}
              過疎地域
            </p>
          </>
        )
      ) : null}
    </div>
  );
}
