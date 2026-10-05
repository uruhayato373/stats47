/**
 * WebSite・Organization 構造化データスクリプト生成
 *
 * layout.tsx の dangerouslySetInnerHTML で出力するための
 * JSON-LD script タグ文字列を返す。
 */

import { SITE_ALTERNATE_NAME, SITE_NAME, SITE_TAGLINE } from "@/config/site";

import { OPERATOR_SOCIAL_URLS } from "./person";

/** ロゴ URL（publisher Organization で共通参照） */
function logoImageObject(baseUrl: string) {
  return {
    "@type": "ImageObject",
    url: `${baseUrl}/logo.png`,
  };
}

/** root Organization schema（layout と publisher で共通参照） */
export function buildOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: baseUrl,
    logo: logoImageObject(baseUrl),
    description: SITE_TAGLINE,
    sameAs: [...OPERATOR_SOCIAL_URLS],
  };
}

/** Article publisher 用（inline、@context は親に含まれる） */
export function buildPublisherOrganization(baseUrl: string) {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: logoImageObject(baseUrl),
  };
}

/**
 * WebSite と Organization の JSON-LD スクリプトタグ文字列を返す
 */
export function generateWebSiteStructuredDataScripts(baseUrl: string): string {
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    description: SITE_TAGLINE,
    inLanguage: "ja",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = buildOrganizationSchema(baseUrl);

  return [
    `<script type="application/ld+json">${JSON.stringify(webSiteSchema)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>`,
  ].join("\n");
}
