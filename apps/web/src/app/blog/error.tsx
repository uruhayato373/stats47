"use client";

import { useEffect } from "react";

import { Button } from "@stats47/components";
import { AlertCircle, RefreshCcw } from "lucide-react";

import { PageShell } from "@/components/layout";

export default function BlogError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Error is already captured by Next.js error boundary
    }, [error]);

    return (
        <PageShell variant="reading">
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-none border border-red-200 bg-red-50 text-red-500">
                    <AlertCircle size={40} />
                </div>
                <h1 className="mb-4 text-lg font-bold text-foreground">
                    データの取得中にエラーが発生しました
                </h1>
                <p className="mb-8 max-w-md text-muted-foreground">
                    ブログ記事の読み込みに失敗しました。一時的な問題の可能性がありますので、時間を置いて再度お試しください。
                </p>
                <div className="flex gap-4">
                    <Button
                        variant="default"
                        onClick={() => reset()}
                        className="flex items-center gap-2"
                    >
                        <RefreshCcw size={18} />
                        再読み込み
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => (window.location.href = "/")}
                    >
                        トップページに戻る
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
