"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { PREFECTURE_CODE_2DIGIT_RE, to5DigitPrefCode, to2DigitPrefCode } from "@stats47/area/area-code";
import { ChartPanel } from "@stats47/components";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { Map as MapIcon } from "lucide-react";

import { MapTableSplit } from "@/components/charts/MapTableSplit";


import type { AreaType } from "@/features/area";

import { trackUiInteraction } from "@/lib/analytics/events";

import { RankingDataTable } from "../RankingDataTable";
import { buildRankingRows } from "../RankingDataTable/ranking-rows";
import { RankingMapChartClient } from "../RankingMapChart/RankingMapChartClient";

import { RankingAreaDetailSheet } from "./RankingAreaDetailSheet";


import type { RankingItem, RankingValue, RankingValueDisplay } from "@stats47/ranking";


/** 開いている県を URL に残す名前 (?pref=13)。canonical はクエリを含まないページのパスなので、検索の評価は分かれない */
const PREF_PARAM = "pref";

function areaCodeFromPrefParam(value: string | null): string | null {
    return value && PREFECTURE_CODE_2DIGIT_RE.test(value) ? to5DigitPrefCode(value) : null;
}

/** ページを移動させずに URL のクエリだけを書き換える (戻るボタンの履歴を増やさない) */
function writePrefParam(areaCode: string | null) {
    const url = new URL(window.location.href);
    if (areaCode) url.searchParams.set(PREF_PARAM, to2DigitPrefCode(areaCode));
    else url.searchParams.delete(PREF_PARAM);
    window.history.replaceState(window.history.state, "", url);
}

interface RankingVisualizationSectionProps {
    rankingItem: RankingItem;
    activeRankingItem: RankingItem;
    rankingValues: RankingValue[];
    areaType: AreaType;
    headerActions?: ReactNode;
    cardFooter?: ReactNode;
    isPending?: boolean;
    /** パネルの題名。既定は地域種別に応じた「都道府県別ランキング」等 (テーマの分布の節は指標名を入れる) */
    title?: string;
    /**
     * 県の詳細を開いていないときに地図と表で強調する県 (テーマの県のページの県)。
     * ランキングのページは渡さない。地図と表の部品はランキングとテーマで 1 つにする (2026-10-30 オーナー決定)
     */
    highlightAreaCode?: string | null;
    /**
     * 押した県を呼び出し側へ渡す (選択中の県は highlightAreaCode で返してもらう)。渡したときは県の詳細の Sheet と
     * URL の ?pref を使わない (テーマの過疎×医療は、押した県の重なりの地図をパネルの下に開く)
     */
    onSelectArea?: (areaCode: string | null) => void;
    /** ページが決めた表示単位。地図・表・県の詳細が同じ単位・倍率・小数桁で値を書く */
    valueDisplay?: RankingValueDisplay | null;
}

/**
 * 地図と表を 1 枚の枠に描く。見出し・年の選択・出典は 1 回だけ置く (2026-10-28 までは地図と表が別々の
 * カードで、見出しと年の選択が 2 つずつ並んでいた)。
 *
 * 並べ方 (部品の幅 640px 以上は「地図 | 表」の横並び、未満はタブ) は共用の MapTableSplit が決める。
 */
export function RankingVisualizationSection({
    rankingItem,
    activeRankingItem,
    rankingValues,
    areaType,
    headerActions,
    cardFooter,
    isPending = false,
    title,
    highlightAreaCode = null,
    onSelectArea,
    valueDisplay,
}: RankingVisualizationSectionProps) {
    const unitLabel = areaType === "city" ? "市区町村" : "都道府県";

    // 県の詳細パネル (都道府県のときだけ)。表と同じ行の計算を使う
    const detailRows = useMemo(
        () => (areaType === "prefecture" ? buildRankingRows(rankingValues) : []),
        [areaType, rankingValues],
    );
    const [detailAreaCode, setDetailAreaCode] = useState<string | null>(null);

    // URL の ?pref=NN から開く (共有されたリンク・再読み込み)。SSR の HTML は常に同じにするため、読むのは描画の後
    useEffect(() => {
        if (areaType !== "prefecture" || onSelectArea) return;
        const fromUrl = areaCodeFromPrefParam(new URLSearchParams(window.location.search).get(PREF_PARAM));
        // 描画の後に 1 度だけ URL を読む (テーマの県選択 ThemePrefectureContext と同じ形)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (fromUrl) setDetailAreaCode(fromUrl);
    }, [areaType, onSelectArea]);

    const openDetail = useCallback((areaCode: string | null, source: "map" | "table" | "detail_sheet") => {
        if (onSelectArea) {
            onSelectArea(areaCode);
            return;
        }
        setDetailAreaCode(areaCode);
        writePrefParam(areaCode);
        if (areaCode) {
            trackUiInteraction({
                action: source === "detail_sheet" ? "region_select" : "detail_open",
                target: source,
                areaCode,
            });
        }
    }, [onSelectArea]);

    return (
        <ChartPanel
            title={title ?? `${unitLabel}別ランキング`}
            icon={<MapIcon />}
            action={headerActions}
            // 集計条件があるときだけ補足を置き、空の線と余白を作らない。
            footer={cardFooter && <div className="-mx-4 space-y-1.5 border-t px-4 pt-3">{cardFooter}</div>}
            // 地図を枠の端まで描く: 横は px-0!、上は Card の gap-4 を外して見出しの下線に接する
            className="gap-0!"
            contentClassName="px-0!"
        >
            {/* 地図・表とも各 1 インスタンスに保つ (地図を 2 つマウントすると Leaflet が二重に動く)。
                並べ方 (広い幅は横並び、狭い幅はタブ) は市区町村のランキングと共用の MapTableSplit が決める。 */}
            <MapTableSplit
                onTabChange={(next) => trackUiInteraction({ action: "tab_switch", target: next })}
                overlay={isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <Skeleton className="h-full w-full opacity-50" />
                    </div>
                )}
                map={
                    <RankingMapChartClient
                        rankingItem={activeRankingItem}
                        rankingValues={rankingValues}
                        areaType={areaType}
                        bare
                        colorViewSwitch
                        mapClassName="h-full"
                        selectedPrefectureCode={detailAreaCode ?? highlightAreaCode}
                        onPrefectureClick={(code) => openDetail(code, "map")}
                        valueDisplay={valueDisplay}
                    />
                }
                table={
                    <RankingDataTable
                        rankingValues={rankingValues}
                        rankingItem={rankingItem}
                        bare
                        onSelectArea={areaType === "prefecture" ? (code) => openDetail(code, "table") : undefined}
                        selectedAreaCode={detailAreaCode ?? highlightAreaCode}
                        valueDisplay={valueDisplay}
                    />
                }
            />
            {areaType === "prefecture" && !onSelectArea && (
                <RankingAreaDetailSheet
                    rankingItem={activeRankingItem}
                    rows={detailRows}
                    areaCode={detailAreaCode}
                    onAreaChange={(code, via) => openDetail(code, via === "step" ? "detail_sheet" : "table")}
                    valueDisplay={valueDisplay}
                />
            )}
        </ChartPanel>
    );
}
