import { PageShell } from "@/components/layout";

export default function RankingListLoading() {
    return (
        <PageShell>
            <div className="animate-pulse space-y-6">
                {/* タイトル */}
                <div className="h-8 w-48 rounded bg-muted" />
                {/* 注目ランキングカード */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-none bg-muted" />
                    ))}
                </div>
                {/* カテゴリカード */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-none bg-muted" />
                    ))}
                </div>
            </div>
        </PageShell>
    );
}
