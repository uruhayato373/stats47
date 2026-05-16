import { CookieConsentBannerClient } from "./CookieConsentBannerClient";

/**
 * Cookie 同意バナー (Server Component, sync)
 *
 * SSR HTML に Client Component の skeleton を `visibility:hidden` で出し、
 * hydration 後に `document.cookie` を読んで表示判定する。
 *
 * **重要**: 本コンポーネントは layout.tsx から render される。
 * `cookies()` / `headers()` 等の dynamic 関数をここで呼ぶと
 * 全ルートが force-dynamic 化され ranking/[rankingKey] の SSG が
 * Cloudflare Workers 上で 500 になる (2026-05-10 commit ebad87c2 で revert 済)。
 * 詳細: `.claude/rules/nextjs-ssg-preservation.md`
 *
 * LCP 対策の本体: `CookieConsentBannerClient` の `visibility:hidden` 初期 render
 * (Lighthouse LCP candidate scoring から除外される、改善策カタログ §3.A.A1)。
 */
export function CookieConsentBanner() {
  return <CookieConsentBannerClient />;
}
