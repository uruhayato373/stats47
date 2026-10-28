"use client";

import { useMemo } from "react";

import { PanelGrid, StatTile } from "@stats47/components";
import { Button } from "@stats47/components/atoms/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@stats47/components/atoms/ui/sheet";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { ChevronDown, ChevronUp } from "lucide-react";

import { RailNavRow } from "@/components/surface";

import { navSurfaceProps } from "@/lib/analytics/events";

import { formatRankingValue, resolveRankingPrecision } from "../../utils/compute-ranking-header-stats";

import type { RankingDataRow } from "../RankingDataTable/ranking-rows";
import type { RankingItem } from "@stats47/ranking";

interface RankingAreaDetailSheetProps {
    rankingItem: RankingItem;
    /** 表と同じ行 (順位と偏差値付き) */
    rows: RankingDataRow[];
    /** 開いている県 (null で閉じる) */
    areaCode: string | null;
    /** 前後送り・閉じる。via は計測用 (前後送りのときだけ "step") */
    onAreaChange: (areaCode: string | null, via?: "step") => void;
}

/**
 * ランキングの地図・表で県を押すと右から開く詳細パネル (参考サイト Flowly の試行。台帳 data/design-references/references.json)。
 * 県の順位・値・偏差値と前後の県への送り、県のページと同じ分野のランキングへのリンクを出す。
 * 検索に拾われる導線 (県のページへのリンク) は表の県名にも残し、このパネルは補助にとどめる。
 */
export function RankingAreaDetailSheet({ rankingItem, rows, areaCode, onAreaChange }: RankingAreaDetailSheetProps) {
    const byRank = useMemo(
        () => [...rows].sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER)),
        [rows],
    );
    const precision = useMemo(
        () => resolveRankingPrecision(rows.map((r) => r.value).filter((v): v is number => v !== null)),
        [rows],
    );

    const index = areaCode ? byRank.findIndex((r) => r.areaCode === areaCode) : -1;
    const row = index >= 0 ? byRank[index] : null;
    const prev = index > 0 ? byRank[index - 1] : null;
    const next = index >= 0 && index < byRank.length - 1 ? byRank[index + 1] : null;
    const unit = formatUnitForDisplay(rankingItem.unit ?? "");

    return (
        <Sheet open={row !== null} onOpenChange={(open) => { if (!open) onAreaChange(null); }}>
            {/* サイトの上端のヘッダー (sticky・z-200) と Cookie 同意 (z-[1100]) より前に出す。Sheet の既定は z-50 */}
            <SheetContent side="right" className="z-[1200]! w-full! overflow-y-auto sm:max-w-md!">
                {row && (
                    <>
                        <SheetHeader className="border-b pr-12!">
                            <SheetTitle className="text-base!">{row.areaName}</SheetTitle>
                            <SheetDescription>
                                {rankingItem.title}（{row.yearName}）
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex items-center justify-between gap-2 px-4">
                            <p className="m-0 text-sm tabular-nums">
                                <span className="font-semibold">{row.rank}位</span>
                                <span className="text-muted-foreground"> / {byRank.length}</span>
                            </p>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    disabled={!prev}
                                    aria-label={prev ? `${prev.rank}位の${prev.areaName}へ` : "前の県はありません"}
                                    onClick={() => prev && onAreaChange(prev.areaCode, "step")}
                                >
                                    <ChevronUp aria-hidden="true" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    disabled={!next}
                                    aria-label={next ? `${next.rank}位の${next.areaName}へ` : "次の県はありません"}
                                    onClick={() => next && onAreaChange(next.areaCode, "step")}
                                >
                                    <ChevronDown aria-hidden="true" />
                                </Button>
                            </div>
                        </div>

                        <PanelGrid className="mx-4 grid-cols-2">
                            <StatTile
                                label="値"
                                value={row.value === null ? null : formatRankingValue(row.value, precision)}
                                unit={unit || undefined}
                                meta={row.yearName}
                            />
                            <StatTile
                                label="偏差値"
                                value={row.deviationValue === null ? null : row.deviationValue.toFixed(1)}
                                meta={`${byRank.length}都道府県の中で`}
                            />
                        </PanelGrid>

                        <nav aria-label={`${row.areaName}の関連ページ`} className="flex flex-col px-4 pb-4" {...navSurfaceProps("ranking_detail_sheet")}>
                            <RailNavRow href={hrefFor("area", { areaCode: row.areaCode })} prefetch={false}>
                                {row.areaName}のデータブック
                            </RailNavRow>
                            {rankingItem.categoryKey && (
                                <RailNavRow href={hrefFor("category", { categoryKey: rankingItem.categoryKey })} prefetch={false}>
                                    同じ分野のランキング
                                </RailNavRow>
                            )}
                        </nav>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
