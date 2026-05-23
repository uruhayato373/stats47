import type { ReactNode } from "react";

import { Sparkles } from "lucide-react";

interface AiInsightCardProps {
  /** カード見出し（例: "データの考察"） */
  title: string;
  children: ReactNode;
}

/**
 * AI 生成コンテンツの常時表示カード（Option D / Phase 1）
 *
 * 折りたたみではなく、ヘッダー + 本文を常に表示する。
 * Server Component（インタラクティブ要素なし）。
 */
export function AiInsightCard({ title, children }: AiInsightCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-teal-700" />
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">AI生成</span>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
