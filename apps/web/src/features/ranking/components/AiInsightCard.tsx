import type { ReactNode } from "react";

import { Sparkles } from "lucide-react";

import { ContentDisclosure } from "@/components/content";

interface AiInsightCardProps {
  /** カード見出し（例: "データの考察"） */
  title: string;
  children: ReactNode;
  /** 本文直下にネストするサブ節（例: 折りたたみ「地域別の傾向」）。同一カード内に統合表示する。 */
  footer?: ReactNode;
}

/**
 * AI 生成コンテンツの共通開閉カード。
 *
 * `footer` を渡すと本文の下にサブ節を同一カード内に統合表示する。
 * ネイティブ details のため Server Component のまま本文を SSR できる。
 */
export function AiInsightCard({ title, children, footer }: AiInsightCardProps) {
  return (
    <ContentDisclosure
      title={title}
      leading={<Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />}
      meta={<span className="text-xs font-normal text-muted-foreground">AI生成</span>}
    >
      {children}
      {footer ? <div className="mt-4 border-t border-border">{footer}</div> : null}
    </ContentDisclosure>
  );
}
