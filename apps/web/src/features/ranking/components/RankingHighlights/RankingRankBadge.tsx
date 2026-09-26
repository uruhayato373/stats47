import type { ReactNode } from "react";

import { cn } from "@stats47/components";
import { Medal } from "lucide-react";

import { RANK_MEDAL_BADGE } from "../../utils/rank-medal.palette";


/**
 * ランクに応じたカラークラスを取得する (内部用)
 */
function lookupRankColor(rank: number): string {
    if (rank === 1 || rank === 2 || rank === 3) return RANK_MEDAL_BADGE[rank];
    return "text-muted-foreground bg-muted border-border";
}

/**
 * ランクに応じたアイコンまたはランク番号を生成する (内部用)
 */
function buildRankIcon(rank: number): ReactNode {
    if (rank <= 3) {
        return <Medal className="h-4 w-4" />;
    }
    return <span className="text-xs font-bold">{rank}</span>;
}

/**
 * ランキング順位を表示するバッジコンポーネント
 * 順位に応じて色とアイコンを自動的に切り替えます。
 */
export function RankingRankBadge({ rank }: { rank: number }) {
    return (
        <div
            className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border",
                lookupRankColor(rank)
            )}
        >
            {buildRankIcon(rank)}
        </div>
    );
}
