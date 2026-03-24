import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

/**
 * ランキングトップページのスケルトンコンポーネント
 */
export function RankingTopPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-10 animate-pulse">
            <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-4 w-full max-w-2xl" />
            </div>

            <section className="mb-12">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-lg" />
                    ))}
                </div>
            </section>

            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
            </div>
        </div>
    );
}
