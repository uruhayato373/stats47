import { hrefFor } from "@stats47/data-configs/content/href";

import { getRequiredBaseUrl } from "@/lib/env";

import { SITE_NAME } from "@/config/site";


import { themeHref } from "../config/theme-href";

import type { ThemeConfig } from "../types";

/** 都道府県×テーマのページの県 (`/areas/[code]/[themeSlug]`)。無ければテーマのページ (47 都道府県) */
export interface ThemeStructuredDataArea {
  areaCode: string;
  areaName: string;
  /** その県の説明文 (meta description と同じ文) */
  description?: string;
}

export function generateThemeBreadcrumbStructuredData(theme: ThemeConfig, area?: ThemeStructuredDataArea): object {
  const baseUrl = getRequiredBaseUrl();
  // 画面のパンくずと同じ順にする (県のページは ホーム > 都道府県一覧 > 県 > テーマ)
  const items = area
    ? [
        { name: "ホーム", item: baseUrl },
        { name: "都道府県一覧", item: `${baseUrl}/areas` },
        { name: area.areaName, item: `${baseUrl}${hrefFor("area", { areaCode: area.areaCode })}` },
        { name: theme.title },
      ]
    : [
        { name: "ホーム", item: baseUrl },
        { name: "テーマ一覧", item: `${baseUrl}/themes` },
        { name: theme.title },
      ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({ "@type": "ListItem", position: index + 1, ...entry })),
  };
}

/**
 * テーマのページの構造化データ。県のページは名前・URL・説明をその県のものにし、about に県 (Place) を足す
 * (2026-10-30。旧: 県のページもテーマのページと同じ名前・URL を出し、どの県のページかが入っていなかった)。
 */
export function generateThemePageStructuredData(theme: ThemeConfig, area?: ThemeStructuredDataArea): object {
  const baseUrl = getRequiredBaseUrl();
  const url = area
    ? `${baseUrl}${hrefFor("area-theme", { areaCode: area.areaCode, themeSlug: theme.themeKey })}`
    : `${baseUrl}${themeHref(theme.themeKey)}`;
  const topic = { "@type": "Thing", name: theme.title, description: theme.description };
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: area ? `${area.areaName}の${theme.title}` : theme.title,
    description: area?.description ?? theme.description,
    url,
    keywords: theme.keywords.join(", "),
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
    },
    about: area
      ? [
          topic,
          {
            "@type": "AdministrativeArea",
            name: area.areaName,
            containedInPlace: { "@type": "Country", name: "日本" },
          },
        ]
      : topic,
  };
}
