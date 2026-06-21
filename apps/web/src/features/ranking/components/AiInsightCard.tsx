import type { ReactNode } from "react";

import { Sparkles } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

interface AiInsightCardProps {
  /** カード見出し（例: "データの考察"） */
  title: string;
  children: ReactNode;
  /** 本文直下にネストするサブ節（例: 折りたたみ「地域別の傾向」）。同一カード内に統合表示する。 */
  footer?: ReactNode;
}

/**
 * AI 生成コンテンツの常時表示カード（Option D / Phase 1）
 *
 * 折りたたみではなく、ヘッダー + 本文を常に表示する。
 * `footer` を渡すと本文の下に区切り線付きでサブ節を同一カード内に統合表示する。
 * Server Component（インタラクティブ要素なし）。
 */
export function AiInsightCard({ title, children, footer }: AiInsightCardProps) {
  return (
    <SurfaceCard className="p-0">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">AI生成</span>
      </div>
      <div className="px-6 py-4">{children}</div>
      {footer && <div className="border-t border-border">{footer}</div>}
    </SurfaceCard>
  );
}
