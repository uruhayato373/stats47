# Cloudflare Pages は s-maxage で Edge Cache されない

**トリガー**: `next.config.ts` に `s-maxage=86400` を設定したが、`cf-cache-status` ヘッダーが返らない。Lighthouse の LCP が改善しない。
**対処**: Cloudflare ダッシュボードの **Cache Rules** で HTML レスポンスを Edge にキャッシュする設定が必要。`s-maxage` ヘッダーだけでは Pages/Workers 経由のレスポンスは Edge Cache されない。
**根拠**: Cloudflare Pages は Workers ランタイムで動作し、通常の CDN とは異なるキャッシュ挙動を持つ。Edge Cache を有効にするには Cache Rules（旧 Page Rules）での明示的な設定が必要。
**確信度**: 0.8
**発見日**: 2026-03-28
**関連**: Cloudflare ダッシュボード → Caching → Cache Rules, `apps/web/open-next.config.ts`（R2 ISR は動作している）
