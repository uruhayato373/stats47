import { ArrowRight, BookOpen, Database } from "lucide-react";

import { getSurfaceCardClassName } from "@/components/surface";

import { TrackedProductLink } from "./TrackedProductLink";

import type { StorefrontProduct } from "../types";

export function ProductItem({ product }: { readonly product: StorefrontProduct }) {
  const href = `/products/${product.slug}`;
  const Icon = product.channel === "kindle" ? BookOpen : Database;

  return (
    <TrackedProductLink
      href={href}
      label={`${product.id}:${product.title}`}
      surface="product_catalog"
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
