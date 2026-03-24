import React from "react";
import { RankCardGes } from "../RankCardGes";
import { type RankingEntry, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";

interface RankCardGesPreviewProps {
    title?: string;
    rank?: number;
    theme?: ThemeName;
    meta?: RankingMeta;
    allEntries?: RankingEntry[];
    totalCount?: number;
    showSafeAreas?: boolean;
}

/**
 * RankCardGes をプレビューするためのラッパー
 * モックデータから該当順位のデータを取得して表示します
 */
export const RankCardGesPreview: React.FC<RankCardGesPreviewProps> = ({
    title,
    rank = 1,
    theme = "dark",
    meta,
    allEntries,
    totalCount,
    showSafeAreas = false,
}) => {
    const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });
    const data = entries.find(e => e.rank === rank) || entries[0];

    return (
        <RankCardGes
            areaCode={data.areaCode}
            title={title || resolved.title}
            rank={rank}
            areaName={data.areaName}
            value={data.value}
            unit={resolved.unit}
            totalCount={totalCount || entries.length}
            theme={theme}
            showSafeAreas={showSafeAreas}
        />
    );
};
