export default function BlogListLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* パンくず */}
                <div className="h-4 w-32 rounded bg-muted" />
                {/* タイトル */}
                <div className="h-8 w-24 rounded bg-muted" />
                <div className="h-4 w-64 rounded bg-muted" />
                {/* 記事グリッド */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
                            <div className="h-3 w-20 rounded bg-muted" />
                            <div className="h-5 w-3/4 rounded bg-muted" />
                            <div className="h-4 w-full rounded bg-muted" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
