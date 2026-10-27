import { hrefFor } from "@stats47/data-configs/content/href";
import { BookOpen, FileSpreadsheet } from "lucide-react";

import { SurfaceSection } from "@/components/surface";

import {
  findDataProductForBlog,
  findDataProductUseCase,
  findKindleProductForBlog,
} from "../storefront";

import { TrackedProductLink } from "./TrackedProductLink";

export function BlogProductCta({ blogSlug }: { readonly blogSlug: string }) {
  const product = findKindleProductForBlog(blogSlug);
  const dataProduct = findDataProductForBlog(blogSlug);
  const useCase = findDataProductUseCase(blogSlug);
  if (!product && !dataProduct) return null;

  const dataBlock = dataProduct && (
    <>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {useCase}
        {dataProduct.title.replace(/をお渡しします$/, "")}
        （{dataProduct.priceYen.toLocaleString("ja-JP")}円）があります。固定年度のデータで、自動更新はありません。必要な年度・地域粒度・納品形式を購入前に確認してください。
      </p>
      <TrackedProductLink
        href={hrefFor("product", { slug: dataProduct.slug })}
        label={`${dataProduct.id}:${dataProduct.title}`}
        surface="blog_product"
        className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-primary underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        データ集の内容と条件を確認する →
      </TrackedProductLink>
    </>
  );

  if (!product) {
    return (
      <SurfaceSection className="mt-8 border-primary/30 p-5">
        <div className="flex items-start gap-3">
          <FileSpreadsheet
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">
              資料づくりに使う
            </p>
            <div className="mt-2">{dataBlock}</div>
          </div>
        </div>
      </SurfaceSection>
    );
  }

  const href = hrefFor("product", { slug: product.slug });
  return (
    <SurfaceSection className="mt-8 border-primary/30 p-5">
      <div className="flex items-start gap-3">
        <BookOpen
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">
            同じテーマを一冊で読む
          </p>
          <h2 className="mt-1 text-base font-bold text-foreground">
            {product.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            この記事を含む関連テーマを、図表と書き下ろし解説を加えて再構成したKindle版です。
          </p>
          <TrackedProductLink
            href={href}
            label={`${product.id}:${product.title}`}
            surface="blog_product"
            className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-primary underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            内容と価格を確認する →
          </TrackedProductLink>
          {dataBlock && (
            <div className="mt-5 border-t border-border pt-4">{dataBlock}</div>
          )}
        </div>
      </div>
    </SurfaceSection>
  );
}
