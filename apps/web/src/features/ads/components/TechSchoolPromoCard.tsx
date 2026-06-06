import { Sparkles } from "lucide-react";

import { TrackedAffiliateLink } from "./tracked-affiliate-link";

interface TechSchoolPromoCardProps {
  /** sidebar に表示する compact 版 / 本文中 inline 版を切り替え */
  variant?: "sidebar" | "inline";
}

/**
 * Claude Code / AI 副業スクール プロモーションカード。
 *
 * 環境変数 `NEXT_PUBLIC_TECH_SCHOOL_AFFILIATE_URL` が設定されていれば
 * その URL を遷移先に使用。未設定時は内部 `/about` への内部リンクに
 * フォールバック (法務的に安全)。
 *
 * 文脈: stats47 自体が「公務員 × Claude Code × e-Stat 自動化」の実例なので、
 * 同じ路線の AI スクール / 副業講座は読者の関心と高い文脈適合性を持つ。
 */
export function TechSchoolPromoCard({ variant = "sidebar" }: TechSchoolPromoCardProps) {
  const url = process.env.NEXT_PUBLIC_TECH_SCHOOL_AFFILIATE_URL || "/about";
  const isExternal = url.startsWith("http");

  if (variant === "inline") {
    return (
      <div className="my-6 rounded-none border border-slate-200 bg-card p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700">
          <Sparkles className="h-3 w-3" />
          AI スクール / 副業 PR
        </div>
        <p className="text-sm font-bold text-slate-900">
          Claude Code で副業を始める ─ 月 +10 万円を最短 3 ヶ月で
        </p>
        <p className="mt-1 text-xs text-slate-600">
          stats47 の自動化と同じ技術スタック (Claude Code / e-Stat API / TypeScript) を、未経験から学べる
          AI 副業講座。公務員・会社員に人気。
        </p>
        <TrackedAffiliateLink
          href={url}
          category="other"
          label="Claude Code 副業講座 (inline)"
          position="article-body"
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline"
          {...(isExternal ? { target: "_blank", rel: "sponsored noopener" } : {})}
        >
          無料カウンセリングを予約 →
        </TrackedAffiliateLink>
      </div>
    );
  }

  return (
    <div className="rounded-none bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 p-4 text-white shadow-md">
      <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
        <Sparkles className="h-3 w-3" />
        PR
      </div>
      <p className="text-sm font-bold leading-tight">
        Claude Code 副業講座
      </p>
      <p className="mt-1 text-xs text-white/85 leading-snug">
        AI 副業で月 +10 万円。公務員・会社員 OK。未経験から最短 3 ヶ月。
      </p>
      <TrackedAffiliateLink
        href={url}
        category="other"
        label="Claude Code 副業講座 (sidebar)"
        position="sidebar"
        className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-purple-700 hover:bg-purple-50 transition-colors"
        {...(isExternal ? { target: "_blank", rel: "sponsored noopener" } : {})}
      >
        無料カウンセリング →
      </TrackedAffiliateLink>
    </div>
  );
}
