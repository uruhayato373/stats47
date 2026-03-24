import type { ReactNode } from "react";

import { Medal } from "lucide-react";

import { cn } from "@stats47/components";

/**
 * ランクに応じたカラークラスを取得する (内部用)
 */
function lookupRankColor(rank: number): string {
    switch (rank) {
        case 1:
            return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
        case 2:
            return "text-slate-400 bg-slate-400/10 border-slate-400/20";
        case 3:
            return "text-amber-700 bg-amber-700/10 border-amber-700/20";
        default:
            return "text-muted-foreground bg-muted border-border";
    }
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
