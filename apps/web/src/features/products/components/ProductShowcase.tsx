import { SectionHeader } from "@/components/section";

import { ogpImageUrl } from "@/lib/metadata/ogp-image";

import type { StorefrontProduct, StorefrontShowcaseSection } from "../types";

/** 図とファイル見本の描画を共用し、区切り線は増やさず見出しの階層で分ける。 */
function ShowcaseSection({ section, slug }: {
  readonly section: StorefrontShowcaseSection;
  readonly slug: string;
}) {
  return (
    <section aria-label={section.heading} className={`@container flex min-w-0 flex-col gap-3${section.figures.length > 1 ? " @sm:col-span-2" : ""}`}>
      <SectionHeader title={section.heading} as={section.kind === "chart" ? "h3" : "h2"} hideRule className="mb-0" />
      <p className="text-sm leading-relaxed text-pretty">{section.lead}</p>
      <ul className="grid gap-4 @sm:grid-cols-2">
        {section.figures.map((figure) => (
          <li key={figure.file}>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- 公開 R2 の静的 PNG をそのまま配信 */}
              <img
                src={ogpImageUrl(`app/products/${slug}/showcase/${figure.file}`)}
                alt={figure.alt}
                width={1080}
                height={1350}
                loading="lazy"
                decoding="async"
                className="h-auto w-full"
              />
              <figcaption className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{figure.alt}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductShowcase({ product }: { readonly product: StorefrontProduct }) {
  const charts = product.showcase?.filter((section) => section.kind === "chart") ?? [];
  const files = product.showcase?.filter((section) => section.kind === "file") ?? [];
  return (
    <>
      {charts.length > 0 && (
        <section aria-label="作成例" className="flex flex-col gap-6">
          <SectionHeader title="作成例" hideRule className="mb-0" />
          <div className="grid gap-x-4 gap-y-6 @sm:grid-cols-2">
            {charts.map((section) => <ShowcaseSection key={section.heading} section={section} slug={product.slug} />)}
          </div>
          {product.showcaseNote && <p className="text-xs leading-relaxed text-muted-foreground">{product.showcaseNote}</p>}
        </section>
      )}
      {files.length > 0 && (
        <div className="grid gap-4 @sm:grid-cols-2">
          {files.map((section) => <ShowcaseSection key={section.heading} section={section} slug={product.slug} />)}
        </div>
      )}
    </>
  );
}
