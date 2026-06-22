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

    return (
        <SurfaceCard className="overflow-hidden p-0">
            <div className="border-b border-border px-3 py-3">
                <h3 className={`text-base font-semibold flex items-center gap-1.5 ${titleClassName}`}>
                    {icon}
                    {title}（{items.length}件）
                </h3>
            </div>
            <div className="px-3 pb-3 pt-3">
                <TooltipProvider delayDuration={300}>
                    <nav className="flex flex-col gap-0.5 max-h-[40vh] overflow-y-auto">
                        {items.map((item) => (
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
