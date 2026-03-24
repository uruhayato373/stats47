import React from "react";
import { Series } from "remotion";
import { FullScreen, RankingTable, RankingTitle, type ThemeName } from "@/shared";
import { RankCardGes } from "./RankCardGes";
import { SCENE_DURATION } from "@/utils/constants";

interface RankingShortGesProps {
    meta: {
        title: string;
        subtitle?: string;
        unit: string;
    };
    topEntries: Array<{
        rank: number;
        areaCode: string;
        areaName: string;
        value: number;
    }>;
    allEntries: Array<{
        rank: number;
        areaCode: string;
        areaName: string;
        value: number;
    }>;
    theme?: ThemeName;
    showSafeAreas?: boolean;
}

/**
 * YouTube Shorts 用 ランキング動画 (GES 背景版)
 */
export const RankingShortGes: React.FC<RankingShortGesProps> = ({
    meta,
    topEntries,
    allEntries,
    theme = "dark",
    showSafeAreas = false,
}) => {
    return (
        <FullScreen>
            <Series>
                {/* 1. イントロ */}
                <Series.Sequence durationInFrames={SCENE_DURATION.intro + SCENE_DURATION.title}>
                    <RankingTitle
                        titleMain={meta.title}
                        titleSub={meta.subtitle || "都道府県ランキング"}
                        catchphrase1="気になる結果は？"
                        catchphrase2="最後までチェック！"
                        theme={theme}
                    />
                </Series.Sequence>

                {/* 2. ランキング発表 (5位〜1位) */}
                {topEntries.sort((a, b) => b.rank - a.rank).map((entry) => (
                    <Series.Sequence key={entry.rank} durationInFrames={90}>
                        <RankCardGes
                            areaCode={entry.areaCode}
                            title={meta.title}
                            rank={entry.rank}
                            areaName={entry.areaName}
                            value={entry.value}
                            unit={meta.unit}
                            theme={theme}
                            showSafeAreas={showSafeAreas}
                        />
                    </Series.Sequence>
                ))}

                {/* 3. 全体結果テーブル */}
                <Series.Sequence durationInFrames={SCENE_DURATION.table}>
                    <RankingTable
                        meta={{
                            title: meta.title,
                            subtitle: meta.subtitle,
                            unit: meta.unit,
                        }}
                        entries={allEntries}
                        theme={theme}
                    />
                </Series.Sequence>

                {/* 4. アウトロ (エンゲージメント向上) */}
                <Series.Sequence durationInFrames={SCENE_DURATION.last}>
                    <RankingTitle
                        titleMain="フォローしてね！"
                        titleSub="もっと知りたい？"
                        catchphrase1="最新の統計をお届け"
                        catchphrase2="stats47.jp"
                        theme={theme}
                    />
                </Series.Sequence>
            </Series>
        </FullScreen>
    );
};
