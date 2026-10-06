"use strict";

/**
 * stats47 のサイト識別子を Node スクリプトへ渡す共通モジュール。
 *
 * 値の正本は packages/types/src/site.json (TS 側は @stats47/types の SITE)。
 * .mjs からも名前付き import で読める (例: SITE_ORIGIN を lib/site-config.cjs から取り出す)。
 * 環境変数で上書きする箇所は、呼び出し元で `process.env.X || R2_PUBLIC_BASE_URL` の形を保つ。
 */
const SITE = require("../../../packages/types/src/site.json");

const SITE_NAME = SITE.name;
const SITE_DOMAIN = SITE.domain;
const SITE_ORIGIN = SITE.origin;
const R2_PUBLIC_BASE_URL = SITE.r2PublicBaseUrl;
const R2_BUCKET = SITE.r2Bucket;
const R2_PRIVATE_BUCKET = SITE.r2PrivateBucket;
const GSC_PROPERTY = SITE.gscProperty;
const GA4_PROPERTY_ID = SITE.ga4PropertyId;

module.exports = {
  SITE,
  SITE_NAME,
  SITE_DOMAIN,
  SITE_ORIGIN,
  R2_PUBLIC_BASE_URL,
  R2_BUCKET,
  R2_PRIVATE_BUCKET,
  GSC_PROPERTY,
  GA4_PROPERTY_ID,
};
