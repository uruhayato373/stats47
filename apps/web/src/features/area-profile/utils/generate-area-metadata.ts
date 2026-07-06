import { ogpImageKeys, ogpImageUrl } from "@/lib/metadata/ogp-image";

import type { Metadata } from "next";

interface AreaMetadataInput {
  title: string;
  description: string;
  areaCode: string;
}

interface AreaCategoryMetadataInput {
  title: string;
  description: string;
  areaCode: string;
  categoryKey: string;
  indexable: boolean;
}

export function generateAreaMetadata({ title, description, areaCode }: AreaMetadataInput): Metadata {
  // 事前生成した静的 OGP (R2)。ランタイム opengraph-image は Worker で 500 になるため使わない。
  const image = ogpImageUrl(ogpImageKeys.area(areaCode));
  return {
    title,
    description,
    alternates: {
      canonical: `/areas/${areaCode}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
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

export function generateAreaCategoryMetadata({
  title,
  description,
  areaCode,
  categoryKey,
  indexable,
}: AreaCategoryMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `/areas/${areaCode}/${categoryKey}`,
    },
    robots: indexable ? "index, follow" : "noindex, follow",
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
