export default function AreaProfileLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* パンくず */}
                <div className="h-4 w-48 rounded bg-muted" />
                {/* ヘッダー */}
                <div className="h-8 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                {/* カテゴリグリッド */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-lg bg-muted" />
                    ))}
                </div>
            </div>
        </div>
    );
}
