import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

export function RankingKeyPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <main>
                {/* Share Buttons */}
                <div className="flex justify-end mb-4">
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Highlights */}
                <Skeleton className="h-48 w-full mb-8 rounded-xl" />

                {/* Map Chart */}
                <div className="mb-8">
                    <Skeleton className="h-[500px] w-full rounded-xl" />
                </div>

                {/* Column Chart */}
                <div className="mb-8">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>

                {/* Data Table */}
                <Skeleton className="h-[600px] w-full rounded-xl" />
            </main>
        </div>
    );
}
