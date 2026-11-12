import Image from "next/image";

import { AdImpressionTracker } from "./AdImpressionTracker";
import { TrackedAffiliateLink } from "./tracked-affiliate-link";

import type { ResolvedAffiliateBanner } from "../types";

/**
 * 本文の幅 (コンテナ) で列の数を決める。バナーは原寸 (300px) より縮めず、入る数だけ横に並べる (2026-10-29 オーナー決定)。
 * 境界 = 原寸 300px × 列の数 + 隙間 8px × (列の数 − 1): 2 列 608px / 3 列 916px / 4 列 1224px。
 * 旧: ブラウザの幅 768px 以上で一律 3 列 (standard は 4 列・モバイル 2 列) にしていたため、右レールのある本文 (810px) や
 * タブレットの幅でバナーが 223〜254px に縮み、中の文字が読みにくかった。
 */
export const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-[minmax(0,300px)]",
  2: "grid-cols-[minmax(0,300px)] @min-[608px]:grid-cols-[repeat(2,300px)]",
  3: "grid-cols-[minmax(0,300px)] @min-[608px]:grid-cols-[repeat(2,300px)] @min-[916px]:grid-cols-[repeat(3,300px)]",
  4: "grid-cols-[minmax(0,300px)] @min-[608px]:grid-cols-[repeat(2,300px)] @min-[916px]:grid-cols-[repeat(3,300px)] @min-[1224px]:grid-cols-[repeat(4,300px)]",
};

/** 1 行に収まらない分は出さない (2 段目に半端な行を作らない)。i 枚目は i+1 列が入る幅から見せる */
export const ITEM_VISIBILITY_CLASS = [
  undefined,
  "hidden @min-[608px]:block",
  "hidden @min-[916px]:block",
  "hidden @min-[1224px]:block",
];

/**
 * 本文の横並びの 1 枚 (リンク付きのバナー画像と計測)。広告の段 (AdRow) の PR のセルが使う。
 * 2026-11-12: PR の列の部品 (NativeAffiliateRow) は、使っていたランキングの読了位置を AdSense に替えたので削除した。
 *
 * 計測の `category` には **banner の vertical (10 軸)** を渡す。`trackingCategory` (例 "category-landweather") は
 * 10 軸外なので affiliate_vertical に流すと内訳が壊れる。ページ文脈は `position` が担うため情報は失われない。
 * impression の計装は 2026-08-04 に足した (それまでクリックだけ送り、CTR の分母が欠けていた。正典 analytics-event-standards.md)。
 */
export function NativeBannerTile({
  banner: b,
  position,
  trackingCategory,
  className,
}: {
  banner: ResolvedAffiliateBanner;
  position: string;
  trackingCategory: string;
  className?: string;
}) {
  return (
    <AdImpressionTracker
      category={b.vertical ?? trackingCategory}
      label={b.title}
      position={position}
      adId={b.id}
      creativeSize={`${b.width}x${b.height}`}
      className={className}
    >
      {/* 原寸 300px の列。250x250 は列の中央 (広告の枠の台帳の fitsInto)。
        枠の幅を中身に合わせると、画像の max-w-full と互いを参照して幅 0 になる (2026-10-29 に実測) */}
      <div className="mx-auto w-full max-w-75">
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
  );
}
