"use client";

import Image from "next/image";

import { buttonVariants, cn } from "@stats47/components";
import { ExternalLink } from "lucide-react";

import { STAT_UNIT_CLASS, STAT_VALUE_CLASS } from "@/components/surface";

import { TrackedProductOutboundLink, useProductImpression } from "./TrackedProductLink";

import type { ProductDetailPlacement, StorefrontProduct } from "../types";

/** 上部・末尾で共用する購入案内。画像とボタンを含む案内全体で表示を一度だけ数える。 */
export function ProductPurchase({ product, placement, currentVersion = false }: {
  readonly product: StorefrontProduct;
  readonly placement: ProductDetailPlacement;
  readonly currentVersion?: boolean;
}) {
  const ref = useProductImpression<HTMLDivElement>(product.externalUrl, "product_detail", {
    productSlug: product.slug,
    ctaId: placement,
  });
  const isBottom = placement === "product_detail_bottom";
  const showCover = isBottom && product.coverImageUrl;
  const displayTitle = product.displayTitle ?? product.title;
  const destinationLabel = product.channel === "kindle" ? "Amazon" : "note";
  const linkProps = {
    href: product.externalUrl,
    productId: product.id,
    productSlug: product.slug,
    productTitle: product.title,
    channel: product.channel,
    detailPlacement: placement,
  };

  return (
    <div
      ref={ref}
      data-product-placement={placement}
      className={cn("grid min-w-0 items-center gap-4 bg-info-soft p-4", showCover && "@sm:grid-cols-3")}
    >
      {showCover && (
        <TrackedProductOutboundLink {...linkProps} className="block min-w-0">
          <Image
            src={showCover}
            alt={`${displayTitle}の販売ページを見る`}
            width={1280}
            height={670}
            sizes="(min-width: 768px) 224px, 100vw"
            className="h-auto w-full"
          />
        </TrackedProductOutboundLink>
      )}
      <div className={cn("flex min-w-0 flex-col gap-3", showCover && "@sm:col-span-2")}>
        {currentVersion && <p className="text-sm font-semibold">現在販売中の版</p>}
        {(isBottom || currentVersion) && <p className="text-base font-semibold text-pretty">{displayTitle}</p>}
        {currentVersion && <p className="text-xs leading-relaxed text-muted-foreground">表示中の改訂案とは収録内容が異なります。改訂案のデータ・図は、現在販売中の版には含まれていません。</p>}
        <dl>
          <dt className="text-xs font-medium text-info">販売価格</dt>
          <dd className={STAT_VALUE_CLASS}>
            {product.priceYen.toLocaleString("ja-JP")}
            <span className={STAT_UNIT_CLASS}>円</span>
          </dd>
        </dl>
        <TrackedProductOutboundLink {...linkProps} className={buttonVariants({ size: "lg", className: "w-full" })}>
          {destinationLabel}で{currentVersion ? "現在販売中の内容" : "内容"}を確認する
          <ExternalLink aria-hidden="true" />
        </TrackedProductOutboundLink>
        <p className="text-xs leading-relaxed text-muted-foreground">
          購入・決済・返品等には販売先の規約が適用されます。基準年や対応形式は販売先の最新表示を確認してください。
        </p>
      </div>
    </div>
  );
}
