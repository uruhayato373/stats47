"use client";

import { useEffect, useState } from "react";

import { BannerAd } from "./BannerAd";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

/**
 * VariantAdSlot に渡す variant の serializable 形 (ResolvedAffiliateVariant のクライアント側ミラー)。
 * server-only モジュールを client バンドルに引き込まないため、ここでローカル定義する。
 */
export interface AdVariant {
  experimentId: string;
  variantId: string;
  weight: number;
  adType: "banner" | "text";
  title: string;
  href: string;
  trackingPixelUrl: string | null;
  imageUrl: string | null;
  width: number | null;
  height: number | null;
  creativeSize: string;
}

interface VariantAdSlotProps {
  variants: AdVariant[];
  category: string;
  position: string;
}

const STORAGE_PREFIX = "aff_exp_";

/** 加重ランダムで1つ選ぶ (weight ≤ 0 は 1 扱い)。 */
function pickWeighted(variants: AdVariant[]): AdVariant {
  const weights = variants.map((v) => (v.weight > 0 ? v.weight : 1));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < variants.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return variants[i];
  }
  return variants[variants.length - 1];
}

/**
 * A/B テスト (AFF-05) のクライアント側出し分けスロット。
 *
 * - SSG を壊さないため出し分けは **クライアント側** で行う (サーバーは候補を全件渡すだけ)。
 * - mount 後に localStorage の割当 (experimentId 単位) を見て、無ければ加重ランダムで選び保存 (sticky)。
 *   → 同一ユーザーは常に同じ variant を見る (A/B の交絡を防ぐ)。
 * - SSR / hydration 時は固定高さの空枠を描画し、mount 後に中身を差し込む (hydration mismatch 回避 + CLS 抑制)。
 * - 表示した variant の impression / click を experiment_id / variant_id / creative_size 付きで GA4 送信。
 */
export function VariantAdSlot({ variants, category, position }: VariantAdSlotProps) {
  const [chosen, setChosen] = useState<AdVariant | null>(null);

  useEffect(() => {
    if (variants.length === 0) return;
    const experimentId = variants[0].experimentId;
    const key = `${STORAGE_PREFIX}${experimentId}`;

    let assigned: AdVariant | undefined;
    try {
      const storedId = window.localStorage.getItem(key);
      if (storedId) assigned = variants.find((v) => v.variantId === storedId);
    } catch {
      // localStorage 不可 (プライベートモード等) は無視して都度ランダム
    }

    if (!assigned) {
      assigned = pickWeighted(variants);
      try {
        window.localStorage.setItem(key, assigned.variantId);
      } catch {
        /* noop */
      }
    }

    // 出し分けは client 限定 (ランダム + localStorage)。SSR は null を返し mount 後に確定する
    // 設計なので setState-in-effect は意図的 (hydration mismatch 回避のため初期描画では選べない)。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChosen(assigned);
  }, [variants]);

  // CLS 回避: どの variant でも枠が動かないよう、banner の最大高さを固定枠にする。
  const maxBannerHeight = variants.reduce(
    (max, v) => (v.adType === "banner" && v.height && v.height > max ? v.height : max),
    0,
  );
  const minHeight = maxBannerHeight > 0 ? maxBannerHeight + 24 : undefined; // +24: PR バッジ分

  if (!chosen) {
    // SSR / mount 前: 固定高さの空枠 (レイアウトを確保)
    return <div style={minHeight ? { minHeight } : undefined} aria-hidden />;
  }

  if (chosen.adType === "banner" && chosen.imageUrl) {
    return (
      <div style={minHeight ? { minHeight } : undefined}>
        <BannerAd
          href={chosen.href}
          imageUrl={chosen.imageUrl}
          trackingPixelUrl={chosen.trackingPixelUrl}
          width={chosen.width}
          height={chosen.height}
          category={category}
          label={chosen.title}
          position={position}
          experimentId={chosen.experimentId}
          variantId={chosen.variantId}
          creativeSize={chosen.creativeSize}
        />
      </div>
    );
  }

  // テキスト variant
  return (
    <div style={minHeight ? { minHeight } : undefined} className="flex flex-col gap-1">
      <span className="self-start rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-500">
        PR
      </span>
      <TrackedAffiliateLink
        href={chosen.href}
        category={category}
        label={chosen.title}
        position={position}
        experimentId={chosen.experimentId}
        variantId={chosen.variantId}
        creativeSize={chosen.creativeSize}
        className="text-sm text-teal-700 underline underline-offset-2 hover:text-teal-800"
      >
        {chosen.title}
      </TrackedAffiliateLink>
    </div>
  );
}
