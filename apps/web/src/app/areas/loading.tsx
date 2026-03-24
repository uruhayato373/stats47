export default function AreasListLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
                {/* タイトル */}
                <div className="h-8 w-40 rounded bg-muted" />
                <div className="h-4 w-72 rounded bg-muted" />
                {/* 地方ブロック + 都道府県グリッド */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3 pt-4">
                        <div className="h-6 w-24 rounded bg-muted" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Array.from({ length: 6 }).map((_, j) => (
                                <div key={j} className="h-16 rounded-lg bg-muted" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
