export default function RankingListLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* タイトル */}
                <div className="h-8 w-48 rounded bg-muted" />
                {/* 注目ランキングカード */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-lg bg-muted" />
                    ))}
                </div>
                {/* カテゴリカード */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-lg bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}
