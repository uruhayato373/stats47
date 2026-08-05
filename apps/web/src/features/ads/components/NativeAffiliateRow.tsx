import Image from "next/image";

import { getSurfaceCardClassName } from "@/components/surface";

import { AdImpressionTracker } from "@/features/ads/components/AdImpressionTracker";
import { TrackedAffiliateLink } from "@/features/ads/components/tracked-affiliate-link";
import {
  isLandscapeBanner,
  type ResolvedAffiliateBanner,
} from "@/features/ads/services/resolve-affiliate-ad";

interface NativeAffiliateRowProps {
  /** セクションタイトル。省略時は "関連サービス" */
  title?: string;
  /** 右上の "もっと見る" リンク */
  moreHref?: string;
  /** バナー配列。縦長を除いた先頭 4 件を描画し、0 件なら null を返す */
  banners: ResolvedAffiliateBanner[];
  /** AffiliateLink の position 追跡用 */
  position?: string;
  /** AffiliateLink の category 追跡用 */
  trackingCategory?: string;
}

/**
 * ネイティブアフィリエイト枠。個別カードのグリッドで表示する (外枠カードで一括りにしない)。
 *
 * ★ 2026-08-06: 外側 SurfaceCard + カード内ヘッダを廃止し、PR ラベル付きの 1 段見出しに変更。
 *   旧構造は (a) 呼び出し元の SectionHeader と二重見出しになる、(b) カード入れ子になる、
 *   (c) 見出しが「関連書籍・商品」等で実在庫 (書籍ゼロ) と乖離する、という指摘を受けた。
 *   PR ラベルは AffiliateTextAdList と同スタイル (景表法配慮・全アフィリ枠で統一)。
 *
 * ★ 縦長 (height > width) クリエイティブはここで除外する。aspect-[4/3] + object-contain の
 *   枠にスカイスクレイパー (120x600) が入ると極細の縦帯に潰れるため。縦長の受け皿は
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
  title = "関連サービス",
  moreHref,
  banners,
  position = "native-row",
  trackingCategory = "native-affiliate",
}: NativeAffiliateRowProps) {
  // 呼び出し元がフィルタ済みでも冪等 (防御的フィルタ)
  const visible = banners.filter(isLandscapeBanner).slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-xs font-medium text-muted-foreground/70">PR</span>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {moreHref && (
          <a
            href={moreHref}
            className="ml-auto shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            もっと見る ›
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {visible.map((b) => (
          <AdImpressionTracker
            key={b.href + b.imageUrl}
            category={b.vertical ?? trackingCategory}
            label={b.title}
            position={position}
            adId={b.id}
            creativeSize={`${b.width}x${b.height}`}
            className="h-full"
          >
            <TrackedAffiliateLink
              href={b.href}
              category={b.vertical ?? trackingCategory}
              label={b.title}
              position={position}
              adId={b.id}
              className={getSurfaceCardClassName({
                interactive: true,
                className: "group flex h-full flex-col gap-2 p-2",
              })}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                <Image
                  src={b.imageUrl}
                  alt={b.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain transition-transform group-hover:scale-[1.03]"
                  loading="lazy"
                />
                {b.trackingPixelUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={b.trackingPixelUrl}
                    alt=""
                    width={1}
                    height={1}
                    className="absolute h-px w-px opacity-0"
                  />
                )}
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                {b.title}
              </p>
            </TrackedAffiliateLink>
          </AdImpressionTracker>
        ))}
      </div>
    </section>
  );
}
