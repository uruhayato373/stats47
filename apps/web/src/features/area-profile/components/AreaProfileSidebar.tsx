import Link from "next/link";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@stats47/components/atoms/ui/tooltip";
import { TrendingDown, TrendingUp } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

import type { StrengthWeaknessItem } from "../types";


/**
 * レールに描く上限。全件描くと 1 項目あたり Tooltip + Link + span×2 が積み上がり、
 * 2026-08-05 の trace では /areas/13000 の DOM が 9,101、単一 nav の children が 873 に
 * なっていた。PageShell は右レールを desktop / mobile の 2 箇所へ描くため、ここでの
 * 削減はそのまま 2 倍で効く。全件は本文の AreaRelatedRankingsCard 側で辿れる。
 */
const SIDEBAR_ITEM_LIMIT = 12;

interface RankingCardProps {
    title: string;
    items: StrengthWeaknessItem[];
    icon: React.ReactNode;
    titleClassName: string;
}

function RankingCard({
    title,
    items,
    icon,
    titleClassName,
}: RankingCardProps) {
    if (items.length === 0) return null;

    const visibleItems = items.slice(0, SIDEBAR_ITEM_LIMIT);

    return (
        <SurfaceCard className="overflow-hidden p-0">
            <div className="border-b border-border px-3 py-3">
                <h3 className={`text-base font-semibold flex items-center gap-1.5 ${titleClassName}`}>
                    {icon}
                    {/* 件数は「全国上位に何件入っているか」の事実なので総数を出す */}
                    {title}（{items.length}件）
                </h3>
            </div>
            <div className="px-3 pb-3 pt-3">
                <TooltipProvider delayDuration={300}>
                    <nav className="flex flex-col gap-0.5">
                        {visibleItems.map((item) => (
                            <Tooltip key={item.rankingKey}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={`/ranking/${item.rankingKey}`}
                                        className="group flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors hover:bg-accent/50"
                                    >
                                        {/* 順位 */}
                                        <span className={`text-xs font-bold shrink-0 w-6 text-right whitespace-nowrap ${titleClassName}`}>
                                            {item.rank}位
                                        </span>

                                        {/* 指標名 */}
                                        <span className="flex-1 min-w-0 line-clamp-1 text-xs leading-relaxed">
                                            {item.indicator}
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[240px]">
                                    <p className="font-medium">{item.indicator}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        全国{item.rank}位
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.value.toLocaleString("ja-JP")}{item.unit}（{item.year}）
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </nav>
                </TooltipProvider>
            </div>
        </SurfaceCard>
    );
}

interface AreaProfileSidebarProps {
    strengths: StrengthWeaknessItem[];
    weaknesses: StrengthWeaknessItem[];
}

export function AreaProfileSidebar({ strengths, weaknesses }: AreaProfileSidebarProps) {
    return (
        <div className="flex flex-col gap-4">
            <RankingCard
                title="全国上位"
                items={strengths}
                icon={<TrendingUp className="h-4 w-4" />}
                titleClassName="text-emerald-700"
            />
            <RankingCard
                title="全国下位"
                items={weaknesses}
                icon={<TrendingDown className="h-4 w-4" />}
                titleClassName="text-amber-700"
            />
        </div>
    );
}
