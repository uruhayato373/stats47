"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { to2DigitPrefCode } from "@stats47/area";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { LEAFLET_MAP_COLORS } from "@/features/map-visualization/client";
import { RankingVisualizationSection } from "@/features/ranking/widgets";

import { fetchPrefDetail } from "../actions";

import type {
  DepopulationMedicalPrefDetail,
  DepopulationMedicalSummary,
} from "../lib/types";
import type { RankingItem, RankingValue } from "@stats47/ranking";

/** 凡例は地図 (PrefectureOverlayMap) と同じ識別配色を参照して色ずれを防ぐ */
const OVERLAY_COLORS = LEAFLET_MAP_COLORS.depopulationMedical;

/**
 * 都道府県の地図と表はランキングと同じ部品で 1 枚に描く (2026-10-30。旧: 過疎×医療専用の地図と手書きの順位表)。
 * 値は比率 (0〜1) を % に直したもの。色は赤の連続色で 0 から塗る
 */
const RATIO_ITEM: RankingItem = {
  rankingKey: "depopulation-medical-ratio",
  areaType: "prefecture",
  rankingName: "過疎地域内の医療機関比率",
  isActive: true,
  dataSourceId: "gis-cross",
  // 指標の記録ではないので、掲載の文言と日付は持たない
  hook: "",
  createdAt: "",
  updatedAt: "",
  title: "過疎地域内の医療機関比率",
  unit: "%",
  // 表と同じ小数 1 桁で凡例の境界値を丸める
  valueDisplay: { decimalPlaces: 1 },
  visualization: {
    colorScheme: "interpolateReds",
    colorSchemeType: "sequential",
    domain: { mode: "zero" },
    classification: { method: "equal-interval", classes: 5 },
    trendDomain: { mode: "extent" },
    comparisonDomain: { mode: "extent" },
  },
};

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

export function DepopulationMedicalMapClient({ summary }: Props) {
  const [selectedPrefCode5, setSelectedPrefCode5] = useState<string | null>(
    null,
  );
  const [prefDetail, setPrefDetail] =
    useState<DepopulationMedicalPrefDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const detailCache = useRef<Map<string, DepopulationMedicalPrefDetail>>(
    new Map(),
  );

  // 比率の高い順の順位 (同じ値は同じ順位)
  const rankingValues = useMemo<RankingValue[]>(
    () =>
      summary.prefectures.map((pref) => ({
        metricKey: RATIO_ITEM.rankingKey,
        areaType: "prefecture",
        areaCode: pref.prefCode,
        areaName: pref.prefName,
        yearCode: "",
        yearName: "",
        value: Math.round(pref.ratio * 1000) / 10,
        unit: RATIO_ITEM.unit,
        rank:
          1 +
          summary.prefectures.filter((other) => other.ratio > pref.ratio)
            .length,
      })),
    [summary.prefectures],
  );

  const selectPrefecture = useCallback((code5: string | null) => {
    setSelectedPrefCode5(code5);
    if (!code5) return;
    const code2 = to2DigitPrefCode(code5);

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
  }, []);

  const selectedSummary = useMemo(
    () =>
      selectedPrefCode5
        ? summary.prefectures.find((p) => p.prefCode === selectedPrefCode5)
        : undefined,
    [selectedPrefCode5, summary.prefectures],
  );

  if (summary.prefectures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        データを読み込めませんでした。スナップショットの生成が必要です。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <RankingVisualizationSection
        rankingItem={RATIO_ITEM}
        activeRankingItem={RATIO_ITEM}
        rankingValues={rankingValues}
        areaType="prefecture"
        title={`${RATIO_ITEM.title}の地図と表`}
        highlightAreaCode={selectedPrefCode5}
        onSelectArea={selectPrefecture}
        cardFooter={
          <p className="text-xs text-muted-foreground">
            色が濃いほど、県内の医療機関に占める「過疎地域内の医療機関」の比率が高い。
          </p>
        }
      />

      {/* 下段: 県別オーバーレイ詳細 */}
      <div>
        <h2 className="text-base font-bold mb-2">
          {selectedSummary
            ? `${selectedSummary.prefName} — 過疎地域と医療機関の重なり`
            : "県別詳細"}
        </h2>
        {!selectedPrefCode5 && (
          <p className="text-sm text-muted-foreground">
            上の地図またはランキング表で都道府県を選ぶと、過疎地域（オレンジの面）と
            医療機関（点）の重なりを表示します。
          </p>
        )}
        {selectedPrefCode5 && selectedSummary && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                <span className="text-muted-foreground mr-1">過疎地域内</span>
                <span
                  className="font-bold"
                  style={{ color: OVERLAY_COLORS.insideArea }}
                >
                  {selectedSummary.depopulationFacilities}
                </span>{" "}
                施設
              </span>
              <span>
                <span className="text-muted-foreground mr-1">県内全体</span>
                {selectedSummary.totalFacilities} 施設
              </span>
              <span>
                <span className="text-muted-foreground mr-1">比率</span>
                {pct(selectedSummary.ratio)}
              </span>
            </div>
            {isPending || !prefDetail ? (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
