import { BookOpen } from "lucide-react";

import { SurfaceSection } from "@/components/surface";

import { findKindleProductForBlog } from "../storefront";

import { TrackedProductLink } from "./TrackedProductLink";

export function BlogProductCta({ blogSlug }: { readonly blogSlug: string }) {
  const product = findKindleProductForBlog(blogSlug);
  if (!product) return null;

  const href = `/products/${product.slug}`;
  return (
    <SurfaceSection className="mt-8 border-primary/30 p-5">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary">同じテーマを一冊で読む</p>
          <h2 className="mt-1 text-base font-bold text-foreground">{product.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            この記事を含む関連テーマを、図表と書き下ろし解説を加えて再構成したKindle版です。
          </p>
          <TrackedProductLink
            href={href}
            label={`${product.id}:${product.title}`}
            surface="blog_product"
            className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            内容と価格を確認する →
          </TrackedProductLink>
        </div>
      </div>
    </SurfaceSection>
  );
}
