import Image from "next/image";

import { isLandscapeBanner } from "../utils";

import { AdImpressionTracker } from "./AdImpressionTracker";
import { PrLabel } from "./PrLabel";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

import type { ResolvedAffiliateBanner } from "../types";

interface NativeAffiliateRowProps {
  /** バナー配列。縦長を除き、variantの上限（3件または4件）まで描画する */
  banners: ResolvedAffiliateBanner[];
  /** AffiliateLink の position 追跡用 */
  position?: string;
  /** AffiliateLink の category 追跡用 */
  trackingCategory?: string;
  /**
   * `standard`: 最大 4 件（一覧・ハブ用）。`three-up`: 最大 3 件（読了位置用）。
   * どちらも列の数は本文の幅で決め、1 行に入る数だけ見せる (COLUMN_CLASS)。
   */
  variant?: "standard" | "three-up";
}

/**
 * 本文の幅 (コンテナ) で列の数を決める。バナーは原寸 (300px) より縮めず、入る数だけ横に並べる (2026-10-29 オーナー決定)。
 * 境界 = 原寸 300px × 列の数 + 隙間 8px × (列の数 − 1): 2 列 608px / 3 列 916px / 4 列 1224px。
 * 旧: ブラウザの幅 768px 以上で一律 3 列 (standard は 4 列・モバイル 2 列) にしていたため、右レールのある本文 (810px) や
 * タブレットの幅でバナーが 223〜254px に縮み、中の文字が読みにくかった。
 */
const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 @min-[608px]:grid-cols-2",
  3: "grid-cols-1 @min-[608px]:grid-cols-2 @min-[916px]:grid-cols-3",
  4: "grid-cols-1 @min-[608px]:grid-cols-2 @min-[916px]:grid-cols-3 @min-[1224px]:grid-cols-4",
};

/** 1 行に収まらない分は出さない (2 段目に半端な行を作らない)。i 枚目は i+1 列が入る幅から見せる */
const ITEM_VISIBILITY_CLASS = [
  undefined,
  "hidden @min-[608px]:block",
  "hidden @min-[916px]:block",
  "hidden @min-[1224px]:block",
];

/**
 * ネイティブアフィリエイト枠。リンク付きバナー画像を、各画像の上の PR 表記つきでグリッド表示する。
 *
 * ★ 2026-08-14: PR ラベル・見出し・商品名・もっと見る導線・カード装飾を廃止した。
 *   ASP 提供バナーの意匠をそのまま表示し、サイト側の可視テキストや装飾を重ねない。
 * ★ 2026-10-08: PR 表記だけをオーナー判断で戻した (PrLabel)。見出し・商品名・装飾は引き続き足さない。
 *
 * ★ 縦長 (height > width) クリエイティブはここで除外する。本文の横並びグリッドに
 *   スカイスクレイパー (120x600) が入ると行が過度に高くなるため。縦長の受け皿は
 *   sidebar-sticky スロット (SidebarStickyBannerAd)。呼び出し元は除外分を見込んで
 *   解決 limit を 8 程度にする (正典: .claude/rules/affiliate-ads-standards.md §3)。
 *
 * ★ 2026-08-04: impression 計装を追加した。それまで **クリックだけ送って impression を
 *   送っていなかった**ため、GA4 の impression 内訳に native 枠が 1 つも現れず、CTR の
 *   分母が系統的に欠けていた (この枠は blog / ranking / category / survey / tag / themes /
 *   home / compare / 市区町村と主要ページ種別のほぼ全てに出る)。
 *   正典: .claude/rules/analytics-event-standards.md
 *
 * ★ 計測の `category` には **banner の vertical (10 軸)** を渡す。`trackingCategory`
 *   (例 "category-landweather") は 10 軸外なので affiliate_vertical に流すと内訳が壊れる。
 *   ページ文脈は `position` (例 "category-native") が担うため情報は失われない。
 */
export function NativeAffiliateRow({
  banners,
  position = "native-row",
  trackingCategory = "native-affiliate",
  variant = "standard",
}: NativeAffiliateRowProps) {
  // 呼び出し元がフィルタ済みでも冪等 (防御的フィルタ)
  const itemLimit = variant === "three-up" ? 3 : 4;
  const visible = banners.filter(isLandscapeBanner).slice(0, itemLimit);
  if (visible.length === 0) return null;

  return (
    <div className="@container">
      <div className={`grid items-start gap-2 ${COLUMN_CLASS[visible.length]}`}>
        {visible.map((b, index) => (
          <AdImpressionTracker
            key={b.href + b.imageUrl}
            category={b.vertical ?? trackingCategory}
            label={b.title}
            position={position}
            adId={b.id}
            creativeSize={`${b.width}x${b.height}`}
            className={ITEM_VISIBILITY_CLASS[index]}
          >
            {/* 原寸 300px の枠をセルの中央に置き、PR 表記はその左上。250x250 は枠の中央 (広告の枠の台帳の fitsInto)。
                枠の幅を中身に合わせると、画像の max-w-full と互いを参照して幅 0 になる (2026-10-29 に実測) */}
            <div className="mx-auto flex w-full max-w-75 flex-col gap-1">
              <PrLabel />
              <TrackedAffiliateLink
                href={b.href}
                category={b.vertical ?? trackingCategory}
                label={b.title}
                position={position}
                adId={b.id}
                className="relative block"
              >
                <Image
                  src={b.imageUrl}
                  alt={b.title}
                  width={b.width}
                  height={b.height}
                  sizes={`${b.width}px`}
                  // 幅は width 属性 (原寸) のまま、セルが狭いときだけ縮める。幅を auto にすると属性の幅が消え、
                  // lazy の画像は読み込み前に 0×0 になって読み込まれない (2026-10-29 に実測)
                  className="mx-auto block h-auto max-w-full"
                  loading="lazy"
                />
                {b.trackingPixelUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={b.trackingPixelUrl}
                    alt=""
                    width={1}
                    height={1}
                    className="absolute left-0 top-0 h-px w-px opacity-0"
                  />
                )}
              </TrackedAffiliateLink>
            </div>
          </AdImpressionTracker>
        ))}
      </div>
    </div>
  );
}
