export default function CompareLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
                {/* タイトル + セレクトボックス */}
                <div className="flex items-center gap-4">
                    <div className="h-10 w-48 rounded bg-muted" />
                    <div className="h-10 w-40 rounded-lg bg-muted" />
                </div>

                {/* 地域選択エリア */}
                <div className="space-y-4">
                    <div className="h-6 w-32 rounded bg-muted" />
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-8 w-24 rounded-full bg-muted" />
                        ))}
                    </div>
                </div>

                {/* コンテンツエリア */}
                <div className="space-y-6 pt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-3">
                            <div className="h-5 w-40 rounded bg-muted" />
                            <div className="h-20 w-full rounded bg-muted" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
