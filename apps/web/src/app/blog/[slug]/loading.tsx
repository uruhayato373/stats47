import { ArticleShell } from "@/components/layout";
import { ArticleCard } from "@/components/surface";

export default function BlogPostLoading() {
    return (
        <ArticleShell>
            <div className="animate-pulse space-y-6">
                {/* パンくず */}
                <div className="h-4 w-48 rounded bg-muted" />
                {/* 記事カード */}
                <ArticleCard>
                    <div className="space-y-4">
                        <div className="h-8 w-3/4 rounded bg-muted" />
                        <div className="h-4 w-1/4 rounded bg-muted" />
                        <div className="space-y-3 pt-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-4 w-full rounded bg-muted" />
                            ))}
                        </div>
                    </div>
                </ArticleCard>
            </div>
        </ArticleShell>
    );
}
