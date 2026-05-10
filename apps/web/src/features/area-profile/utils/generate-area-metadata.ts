import type { Metadata } from "next";

export interface AreaMetadataInput {
  title: string;
  description: string;
  areaCode: string;
}

export interface AreaCategoryMetadataInput {
  title: string;
  description: string;
  areaCode: string;
  categoryKey: string;
  indexable: boolean;
}

export function generateAreaMetadata({ title, description, areaCode }: AreaMetadataInput): Metadata {
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
