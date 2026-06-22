import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { SurfaceCard } from "@/components/surface";

/**
 * RankingSidebarSkeleton
 *
 * ランキングサイドバーの読み込み中に表示するスケルトンUI（Card 型）
 */
export function RankingSidebarSkeleton() {
    return (
        <SurfaceCard className="h-full w-full overflow-hidden p-0 animate-in fade-in duration-300">
            <div className="border-b border-border px-4 py-4">
                <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-4 pt-3">
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="flex gap-3 p-2 rounded-lg border border-border"
                        >
                            <Skeleton className="flex-shrink-0 w-16 h-16 rounded-md" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-3 w-12 rounded" />
                                    <Skeleton className="h-3 w-16 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SurfaceCard>
    );
}
