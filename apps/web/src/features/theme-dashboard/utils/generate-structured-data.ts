import { getRequiredBaseUrl } from "@/lib/env";

import type { ThemeConfig } from "../types";

export function generateThemeBreadcrumbStructuredData(theme: ThemeConfig): object {
  const baseUrl = getRequiredBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "テーマ一覧", item: `${baseUrl}/themes` },
      { "@type": "ListItem", position: 3, name: theme.title },
    ],
  };
}

export function generateThemePageStructuredData(theme: ThemeConfig): object {
  const baseUrl = getRequiredBaseUrl();
  const url = `${baseUrl}/themes/${theme.themeKey}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: theme.title,
    description: theme.description,
    url,
    keywords: theme.keywords.join(", "),
    creator: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      url: baseUrl,
    },
    about: {
      "@type": "Thing",
      name: theme.title,
      description: theme.description,
    },
  };
}
