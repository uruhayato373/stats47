import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { RailCard } from "@/components/surface";

/**
 * RankingSidebarSkeleton
 *
 * ランキングサイドバーの読み込み中に表示するスケルトンUI（Card 型）
 */
export function RankingSidebarSkeleton() {
    return (
        <RailCard title={<Skeleton className="h-5 w-32" />}>
            <div className="divide-y divide-border -mx-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 px-4 py-2">
                        <Skeleton className="flex-shrink-0 w-16 h-16 rounded-sm" />
                        <div className="flex-1 min-w-0 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-3 w-12 rounded-sm" />
                                <Skeleton className="h-3 w-16 rounded-sm" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </RailCard>
    );
}
