import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";

import type { Metadata } from "next";

interface BlogMetadataInput {
  title: string;
  description: string;
  slug: string;
}

export function generateBlogMetadata({ title, description, slug }: BlogMetadataInput): Metadata {
  // 事前生成した静的 OGP (R2)。ランタイム opengraph-image は Worker で 500 になるため使わない。
  const image = ogpImageUrl(ogpImageKeys.blog(slug));
  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
