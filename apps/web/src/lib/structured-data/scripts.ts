/**
 * WebSite・Organization 構造化データスクリプト生成
 *
 * layout.tsx の dangerouslySetInnerHTML で出力するための
 * JSON-LD script タグ文字列を返す。
 */

/**
 * WebSite と Organization の JSON-LD スクリプトタグ文字列を返す
 */
export function generateWebSiteStructuredDataScripts(baseUrl: string): string {
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "統計で見る都道府県",
    url: baseUrl,
    description: "あなたの県は何位？1,800以上の統計で47都道府県をランキング・比較・分析",
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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "統計で見る都道府県",
    url: baseUrl,
    description: "あなたの県は何位？1,800以上の統計で47都道府県をランキング・比較・分析",
  };

  return [
    `<script type="application/ld+json">${JSON.stringify(webSiteSchema)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>`,
  ].join("\n");
}
