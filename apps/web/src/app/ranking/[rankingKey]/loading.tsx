export default function RankingDetailLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* パンくず */}
                <div className="h-4 w-48 rounded bg-muted" />
                {/* タイトル */}
                <div className="h-8 w-2/3 rounded bg-muted" />
                {/* 地図 + テーブル */}
                <div className="space-y-4">
                    <div className="h-[400px] rounded-lg bg-muted" />
                    <div className="h-64 rounded-lg bg-muted" />
                </div>
            </div>
        </div>
    );
}
