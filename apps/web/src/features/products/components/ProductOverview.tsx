import { Badge } from "@stats47/components";
import { BookOpen, Check, Database } from "lucide-react";

import { SectionHeader } from "@/components/section";

import { ProductPurchase } from "./ProductPurchase";

import type { StorefrontProduct } from "../types";

/** 全商品の内容と購入導線。見本より先に置き、商品情報はカタログから受け取る。 */
export function ProductOverview({ product, purchaseProduct, preview = false }: {
  readonly product: StorefrontProduct;
  readonly purchaseProduct: StorefrontProduct;
  readonly preview?: boolean;
}) {
  const Icon = product.channel === "kindle" ? BookOpen : Database;

  return (
    <section aria-label="商品内容と購入" className="flex flex-col gap-8">
      <div className="grid items-start gap-4 @sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <SectionHeader title="含まれるもの" icon={<Icon aria-hidden="true" />} hideRule className="mb-0" />
          <ul className="flex flex-col gap-2">
            {product.included.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-1 size-4 shrink-0 text-info" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <ProductPurchase product={purchaseProduct} placement="product_detail_top" currentVersion={preview} />
      </div>

      <div className="flex flex-col gap-2">
        <SectionHeader title={product.useCases?.length ? "こんな用途に" : "こんな方へ"} hideRule className="mb-0" />
        {product.useCases?.length ? (
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {product.useCases.map(({ title, description }) => (
              <li key={title}>
                <span className="font-semibold text-foreground">{title}</span>：<span>{description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {product.audience.map((audience) => (
              <li key={audience}>
                <Badge variant="secondary" className="h-auto! max-w-full whitespace-normal text-left">
                  {audience}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
