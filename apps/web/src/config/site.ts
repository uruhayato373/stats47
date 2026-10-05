/**
 * Web アプリのサイト表示定数。
 *
 * サイト名・ドメイン・R2 公開 URL などの識別子は @stats47/types の SITE
 * (正本 packages/types/src/site.json) を参照し、ここでは Web 固有の文言と画像だけを定義する。
 * metadata・manifest・構造化データ・規約ページはこの定義を参照する。
 */
import { SITE } from "@stats47/types";

export { SITE };

/** サイト名 (例: title template・構造化データの publisher)。 */
export const SITE_NAME = SITE.name;

/** サイトの英字表記 (例: og:site_name・構造化データの alternateName)。 */
export const SITE_ALTERNATE_NAME = SITE.alternateName;

/** 本番 origin。環境で切り替える URL は lib/env.ts の getRequiredBaseUrl() を使う。 */
export const SITE_ORIGIN = SITE.origin;

/** R2 公開ストレージの既定 URL。環境変数で上書きする箇所は `env || R2_PUBLIC_BASE_URL` の形を保つ。 */
export const R2_PUBLIC_BASE_URL = SITE.r2PublicBaseUrl;

/** トップ・manifest・root metadata の説明文。 */
export const SITE_DESCRIPTION =
  "あなたの県は何位？年収・人口・消費量から教育・医療まで、1,800以上の統計で47都道府県をランキング。地図やグラフで地域の特徴をわかりやすく可視化します。";

/** OGP・構造化データ向けの短い説明文。 */
export const SITE_TAGLINE = "あなたの県は何位？1,800以上の統計で47都道府県をランキング・比較・分析";

/**
 * 既定の OGP 画像。ブランド素材 `public/brand/atlas-v1/ogp-default-1200x630.jpg` から書き出す。
 */
export const DEFAULT_OGP_IMAGE_PATH = "/og-image.jpg";

/** お問い合わせフォーム (Google フォーム)。 */
export const CONTACT_FORM_URL = "https://forms.gle/ZYi7Rmk4Kt9qZCXB8";
