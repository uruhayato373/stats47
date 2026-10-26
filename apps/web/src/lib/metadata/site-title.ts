/**
 * OGP / Twitter 用のブランド名付きタイトル
 *
 * `<title>` の接尾辞は root layout の `title.template` (`%s | ${SITE_NAME}`、root-metadata.ts) が付ける。
 * ページの `title` には接尾辞を書かない (書くと「X | stats47 | 統計で見る都道府県」と二重になる)。
 *
 * 一方 `openGraph.title` / `twitter.title` には template が効かない
 * (Next.js 15.5 の resolve-metadata は openGraph の template を親の `openGraph.title.template`
 * からだけ取り、root の openGraph.title は文字列で template を持たない)。
 * OGP カードには従来どおり ` | stats47` を付けるので、その組み立てをこの関数に集約する。
 * 再発防止: apps/web/src/__tests__/metadata-title-suffix.test.ts
 */

/** OGP カードの title に付けるブランド表記 (2026-10 時点の og:title の実出力を維持する)。 */
export const OGP_TITLE_BRAND = "stats47";

export function formatOgpTitle(title: string): string {
  return `${title} | ${OGP_TITLE_BRAND}`;
}
