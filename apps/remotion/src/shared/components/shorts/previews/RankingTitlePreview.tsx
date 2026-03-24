import { type RankingEntry, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";
import React from "react";
import { RankingTitle } from "../RankingTitle";

interface RankingTitlePreviewProps {
    meta?: RankingMeta;
    allEntries?: RankingEntry[];
    theme?: ThemeName;
    catchphrase1?: string;
    catchphrase2?: string;
}

export const RankingTitlePreview: React.FC<RankingTitlePreviewProps> = ({
    meta,
    allEntries,
    theme = "dark",
    catchphrase1 = "1位はあの県...⁉︎",
    catchphrase2 = "あなたの地元は何位？",
}) => {
    const { meta: resolved } = resolveRankingData({ meta, allEntries });

    return (
        <RankingTitle
            titleMain={resolved.title}
            titleSub={`${resolved.yearName || "最新"} 都道府県ランキング`}
            catchphrase1={catchphrase1}
            catchphrase2={catchphrase2}
            theme={theme}
        />
    );
};
