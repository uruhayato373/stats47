import Image from "next/image";

import { hrefFor } from "@stats47/data-configs/content/href";
import { ArrowRight, BookOpen, Database } from "lucide-react";

import { getSurfaceCardClassName } from "@/components/surface";

import { TrackedProductLink } from "./TrackedProductLink";

import type { StorefrontProduct } from "../types";

/** note の表紙の比率 (1280×670) */
const COVER_WIDTH = 224;
const COVER_HEIGHT = 117;

interface ProductItemProps {
  readonly product: StorefrontProduct;
  /** row: 別のカードの中に置く、表紙つきの 1 行 (カードを重ねない) */
  readonly layout?: "card" | "row";
  readonly surface?: "product_catalog" | "blog_product" | "ranking_product";
  /** product_impression・product_click の置き場所 */
  readonly placement?: string;
}

export function ProductItem({ product, layout = "card", surface = "product_catalog", placement }: ProductItemProps) {
  const href = hrefFor("product", { slug: product.slug });
  const Icon = product.channel === "kindle" ? BookOpen : Database;

  if (layout === "row") {
    return (
      <TrackedProductLink
        href={href}
        label={`${product.id}:${product.title}`}
        surface={surface}
        product={product}
        placement={placement}
        className="group mt-3 flex items-center gap-3 border-t border-border pt-3"
      >
        {product.coverImageUrl && (
          <Image
            src={product.coverImageUrl}
            alt=""
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            className="h-auto w-28 shrink-0 rounded-sm"
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {product.title}
          </span>
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {product.priceYen.toLocaleString("ja-JP")}円・{product.channelLabel}
            <ArrowRight className="h-3 w-3 text-primary" aria-hidden="true" />
          </span>
        </span>
      </TrackedProductLink>
    );
  }

  return (
    <TrackedProductLink
      href={href}
      label={`${product.id}:${product.title}`}
      surface="product_catalog"
      product={product}
      className={getSurfaceCardClassName({
        interactive: true,
        className: "group flex h-full flex-col p-5",
      })}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{product.channelLabel}</span>
      </div>
      <h2 className="mt-3 text-base font-bold leading-snug text-foreground group-hover:text-primary">
        {product.title}
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {product.description}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-sm font-bold text-foreground">
          {product.priceYen.toLocaleString("ja-JP")}円
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          詳細を見る
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </TrackedProductLink>
  );
}
