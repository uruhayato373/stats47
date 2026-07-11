import { ArticleShell } from "@/components/layout";

export default function RankingDetailLoading() {
    return (
        <ArticleShell
            rail={
                <div className="animate-pulse space-y-4">
                    <div className="h-64 rounded-lg bg-muted" />
                    <div className="h-32 rounded-lg bg-muted" />
                </div>
            }
        >
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
        </ArticleShell>
    );
}
