"use client";

import { ArrowRight, Sparkles } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

import { trackCtaClick } from "@/lib/analytics/events";

import { buildKomuinAiGuideUrl } from "./funnel-cta-config";

interface RankingFunnelCtaProps {
  rankingKey: string;
}

/**
 * 統計ランキング → 公務員AI ファネル CTA。
 *
 * 高ビューのランキングページ末尾 (出典カードの直後) に差し込み、
 * 「このランキングは自分で作れる」という好奇心を、e-Stat × Claude Code の
 * 買い切りガイド (note マガジン) へ自然に橋渡しする。
 *
 * - 自社コンテンツへの導線なので `sponsored` ではなく `noopener` のみ。
 * - クリックは GA4 `cta_click` + URL の UTM の二重で計測する。
 * - 遷移先 URL / 表示対象カテゴリは `funnel-cta-config.ts` で 1 箇所管理。
 * - 画像なし・固定高の静的カードなので CLS を発生させない。
 */
export function RankingFunnelCta({ rankingKey }: RankingFunnelCtaProps) {
  const href = buildKomuinAiGuideUrl(rankingKey);

  return (
    <SurfaceCard className="border-primary/20 bg-primary/5">
      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" />
        このランキング、自分で作れます
      </div>
      <p className="text-sm font-bold leading-snug text-foreground">
        e-Stat × Claude Code で、統計業務を自動化する
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        現役自治体職員が、外部 API がブロックされた職場 PC でも e-Stat
        の統計処理を自動化した方法を、買い切りガイドにまとめました。
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackCtaClick({
            ctaId: "ranking_to_komuin_ai_guide",
            label: "公務員AI 完全ガイド",
            position: "ranking-footer",
            rankingKey,
          })
        }
        className="mt-3 inline-flex items-center gap-1 rounded-none border border-primary/30 bg-card px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
      >
        e-Stat × Claude Code 完全ガイドを見る
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </SurfaceCard>
  );
}
