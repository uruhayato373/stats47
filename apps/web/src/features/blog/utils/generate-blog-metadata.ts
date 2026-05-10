import type { Metadata } from "next";

export interface BlogMetadataInput {
  title: string;
  description: string;
  slug: string;
}

export function generateBlogMetadata({ title, description, slug }: BlogMetadataInput): Metadata {
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
