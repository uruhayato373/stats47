"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { RankingDataTable } from "@/features/ranking";

import { fetchRankingTableDataAction, type FetchRankingTableDataResult } from "../../actions/fetch-ranking-table-data";

interface DashboardDataTableProps {
    title: string;
    props: Record<string, unknown>;
    rankingLink?: string | null;
    className?: string;
}

export function DashboardDataTable({
    title,
    props,
    rankingLink,
    className,
}: DashboardDataTableProps) {
    const [data, setData] = useState<FetchRankingTableDataResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // rankingKeyの特定
    // props.rankingKey があればそれを使う
    // なければ rankingLink から抽出を試みる
    let rankingKey = props.rankingKey as string;
    if (!rankingKey && rankingLink) {
        const parts = rankingLink.split('/');
        // 末尾が空文字の場合（スラッシュで終わる場合）を考慮
        rankingKey = parts[parts.length - 1] || parts[parts.length - 2];
    }

    // rankingKey が特定できない場合は useEffect 内で error state に設定

    useEffect(() => {
        if (!rankingKey) {
            setError("ランキングキーが特定できませんでした");
            return;
        }

        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await fetchRankingTableDataAction(rankingKey);

                if (!isMounted) return;

                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.error);
                }
            } catch {
                if (isMounted) {
                    setError("データの取得に失敗しました");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [rankingKey]);

    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border bg-card shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border bg-card shadow-sm p-4">
                <div className="text-center text-sm text-destructive">
                    <p className="font-semibold mb-1">エラーが発生しました</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!data || !data.rankingItem) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border bg-card shadow-sm">
                <div className="text-center text-sm text-muted-foreground">
                    データがありません
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                {rankingLink && (
                    <a
                        href={rankingLink}
                        className="text-sm text-primary hover:underline"
                    >
                        詳細 →
                    </a>
                )}
            </div>

            <RankingDataTable
                rankingValues={data.rankingValues}
                rankingItem={data.rankingItem}
            />

            <div className="mt-2 text-right text-xs text-muted-foreground">
                {data.yearName && <span>{data.yearName}時点</span>}
            </div>
        </div>
    );
}
