"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";

import dynamic from "next/dynamic";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components/atoms/ui/table";

import { fetchPrefDetail } from "@/app/gis-cross/depopulation-medical/_actions/fetch-pref-detail";

import type { TopoJSONTopology } from "@stats47/types";

import type {
  DepopulationMedicalPrefDetail,
  DepopulationMedicalSummary,
} from "../lib/types";

const DepopulationChoroplethMap = dynamic(
  () =>
    import("./DepopulationChoroplethMap").then(
      (m) => m.DepopulationChoroplethMap,
    ),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[420px] lg:h-[520px] w-full rounded-md" />
    ),
  },
);

const PrefectureOverlayMap = dynamic(
  () => import("./PrefectureOverlayMap").then((m) => m.PrefectureOverlayMap),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[420px] lg:h-[520px] w-full rounded-md" />
    ),
  },
);

interface Props {
  summary: DepopulationMedicalSummary;
  topology: TopoJSONTopology | null;
}

function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function DepopulationMedicalMapClient({ summary, topology }: Props) {
  const [selectedPrefCode5, setSelectedPrefCode5] = useState<string | null>(
    null,
  );
  const [prefDetail, setPrefDetail] =
    useState<DepopulationMedicalPrefDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const detailCache = useRef<Map<string, DepopulationMedicalPrefDetail>>(
    new Map(),
  );

  // ratio 降順ランキング
  const ranked = useMemo(
    () =>
      [...summary.prefectures].sort((a, b) => b.ratio - a.ratio),
    [summary.prefectures],
  );

  const selectPrefecture = useCallback((code5: string) => {
    const code2 = code5.slice(0, 2);
    setSelectedPrefCode5(code5);

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
      {/* 上段: choropleth + ランキング表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h2 className="text-base font-bold mb-2">
            過疎地域内の医療機関比率（都道府県別）
          </h2>
          <DepopulationChoroplethMap
            topology={topology}
            prefectures={summary.prefectures}
            selectedPrefectureCode={selectedPrefCode5}
            onPrefectureClick={selectPrefecture}
          />
          <p className="text-xs text-muted-foreground mt-1">
            色が濃いほど、県内の医療機関に占める「過疎地域内の医療機関」の比率が高い。
          </p>
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-base font-bold mb-2">ランキング</h2>
          <div className="max-h-[520px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>都道府県</TableHead>
                  <TableHead className="text-right">過疎内</TableHead>
                  <TableHead className="text-right">比率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((p, i) => (
                  <TableRow
                    key={p.prefCode}
                    className={`cursor-pointer ${
                      p.prefCode === selectedPrefCode5
                        ? "bg-slate-100"
                        : ""
                    }`}
                    onClick={() => selectPrefecture(p.prefCode)}
                  >
                    <TableCell className="text-slate-500">{i + 1}</TableCell>
                    <TableCell>{p.prefName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.depopulationFacilities}/{p.totalFacilities}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {pct(p.ratio)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

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
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span>
                <span className="text-slate-400 mr-1">過疎地域内</span>
                <span className="font-bold text-red-600">
                  {selectedSummary.depopulationFacilities}
                </span>{" "}
                施設
              </span>
              <span>
                <span className="text-slate-400 mr-1">県内全体</span>
                {selectedSummary.totalFacilities} 施設
              </span>
              <span>
                <span className="text-slate-400 mr-1">比率</span>
                {pct(selectedSummary.ratio)}
              </span>
            </div>
            {isPending || !prefDetail ? (
              <Skeleton className="h-[420px] lg:h-[520px] w-full rounded-md" />
            ) : (
              <>
                <PrefectureOverlayMap detail={prefDetail} />
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">●</span> 過疎地域内の医療機関 /{" "}
                  <span className="text-slate-400">●</span> 過疎地域外 /{" "}
                  <span className="text-orange-500">■</span> 過疎地域
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
