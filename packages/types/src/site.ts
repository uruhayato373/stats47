import siteJson from './site.json';

/**
 * stats47 のサイト識別子 (サイト名・ドメイン・R2・GSC/GA4 の ID)。
 *
 * 値の正本は同じディレクトリの site.json。Node スクリプト (.mjs/.cjs) は
 * `.claude/scripts/lib/site-config.cjs` 経由で同じ JSON を読む。
 * 環境変数で上書きする箇所は、各呼び出し元で `process.env.X || SITE.y` の形を保つ。
 */
export const SITE = {
  name: siteJson.name,
  alternateName: siteJson.alternateName,
  domain: siteJson.domain,
  origin: siteJson.origin,
  r2PublicBaseUrl: siteJson.r2PublicBaseUrl,
  r2Bucket: siteJson.r2Bucket,
  r2PrivateBucket: siteJson.r2PrivateBucket,
  gscProperty: siteJson.gscProperty,
  ga4PropertyId: siteJson.ga4PropertyId,
} as const;
