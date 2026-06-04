"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { SIDEBAR_PROMO_BANNERS } from "../constants/sidebar-banners";

import { BannerAd } from "./BannerAd";

/**
 * 運営者 (サイト管理者) プロモーションカード。
 *
 * 「サイト管理者 (KAZU) のミニプロフィール + アフィリエイトバナー」を 1 枚のカードで表示する。
 * 2 つの軸 (転職 / AI 学習) を用意し、マウント時にクライアント側でランダムに 1 つ選んで表示する。
 *
 * - ランダム選択はクライアント側 (Math.random) のみ。`cookies()`/`headers()` を使わないため
 *   layout からの利用でも SSG を壊さない (.claude/rules/nextjs-ssg-preservation.md 準拠)。
 * - アフィリエイトは新規 URL をハードコードせず SIDEBAR_PROMO_BANNERS (SSOT) を再利用:
 *     index 0 = STRATEGY CAREER (エンジニア転職)  → 転職軸
 *     index 1 = AI Agent Camp (Claude Code 研修) → AI 学習軸
 * - PR 表記 / rel="sponsored" / 計測ピクセル / GA4 計測は BannerAd が担保する。
 */

type Axis = "tenshoku" | "ai";

interface AxisContent {
  /** 軸ラベル (バッジ) */
  badge: string;
  /** 1 行フック */
  headline: string;
  /** 補足 (運営者の実体験) */
  body: string;
  /** SIDEBAR_PROMO_BANNERS の index */
  bannerIndex: number;
  /** GA4 計測 position 用サフィックス */
  axisKey: Axis;
}

const AXIS_CONTENT: Record<Axis, AxisContent> = {
  tenshoku: {
    badge: "転職という選択",
    headline: "県庁職員から、AI を学んでエンジニア転職。",
    body: "「公務員は転職に弱い」は思い込みでした。行政で培った正確さと段取り力は、民間でも通用する武器です。",
    bannerIndex: 0,
    axisKey: "tenshoku",
  },
  ai: {
    badge: "AI 学習という選択",
    headline: "40 代手前から独学で AI を習得し、仕事を自動化。",
    body: "学び直しに遅すぎることはありません。生成 AI のおかげで「分からないまま放置しない」環境が整いました。",
    bannerIndex: 1,
    axisKey: "ai",
  },
};

interface OperatorPromoCardProps {
  /**
   * 配置文脈。
   * - "global": 全ページ共通 (フッター上)。横幅を内側で制限してセンタリングする。
   * - "sidebar": 右レール内。幅は親に従う。
   */
  placement?: "global" | "sidebar";
}

export function OperatorPromoCard({ placement = "global" }: OperatorPromoCardProps) {
  // マウント後にランダムで軸を確定する (SSR では描画しない = 余計な impression を発火させない)
  const [axis, setAxis] = useState<Axis | null>(null);

  useEffect(() => {
    setAxis(Math.random() < 0.5 ? "tenshoku" : "ai");
  }, []);

  const wrapperClass =
    placement === "global"
      ? "mx-auto w-full max-w-2xl px-4 py-8"
      : "w-full";

  // 確定前はレイアウトシフトを抑えるため最小高さのプレースホルダを返す
  if (axis === null) {
    return (
      <div className={wrapperClass} aria-hidden>
        <div className="min-h-[320px] rounded-none border bg-card" />
      </div>
    );
  }

  const content = AXIS_CONTENT[axis];
  const banner = SIDEBAR_PROMO_BANNERS[content.bannerIndex % SIDEBAR_PROMO_BANNERS.length];
  const position = `operator-card-${placement}-${content.axisKey}`;

  return (
    <div className={wrapperClass}>
      <div className="rounded-none border bg-card p-4 shadow-sm">
        {/* 運営者ミニプロフィール */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-bold text-primary">K</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">KAZU</p>
            <p className="text-xs text-muted-foreground">
              元県庁職員 → AI 独学 → 転職・独立 / stats47 運営者
            </p>
          </div>
        </div>

        {/* 軸別フック */}
        <p className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground">
          {content.badge}
        </p>
        <p className="mt-2 text-sm font-bold leading-snug text-foreground">
          {content.headline}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{content.body}</p>

        {/* 体験記 / 運営者情報への導線 */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <Link
            href="/blog/koumuin-ai-tenshoku-1500man"
            className="font-semibold text-primary underline underline-offset-2"
          >
            体験記を読む
          </Link>
          <Link href="/about" className="text-muted-foreground underline underline-offset-2">
            運営者について
          </Link>
        </div>

        {/* アフィリエイトバナー (PR 表記・計測は BannerAd が担保) */}
        {banner && (
          <div className="mt-3 flex justify-center border-t pt-3">
            <BannerAd
              href={banner.href}
              imageUrl={banner.imageUrl}
              trackingPixelUrl={banner.trackingPixelUrl}
              width={banner.width}
              height={banner.height}
              label={banner.label}
              category="other"
              position={position}
            />
          </div>
        )}
      </div>
    </div>
  );
}
