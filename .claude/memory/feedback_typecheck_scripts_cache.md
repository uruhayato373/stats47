---
name: feedback_typecheck_scripts_cache
description: 手元の type-check:scripts は .local/tsbuildinfo の差分キャッシュで新しい型エラーを見落とす。barrel 経由で取り込むファイルが増えた変更の push 前はキャッシュを消して回す
metadata:
  node_type: memory
  type: feedback
  originSessionId: dc8df5f2-4696-45c2-be9c-3bf1dbb0b505
  modified: 2026-10-29T22:24:29.634Z
---

手元の `npm run type-check:scripts` は `.local/tsbuildinfo` の差分キャッシュを使うので、import の連鎖が伸びて
別の tsconfig (例: `apps/web/scripts/tsconfig.ogp.json`) が新しいファイルを取り込むようになっても、手元では 9/9 ok のままになる。

**Why:** 2026-10-30 PR #1200 で、記事カード (`ArticleTeaser`) を `@/components/surface` の barrel に足したところ、OGP 画像の
スクリプトの型検査が barrel 経由で `lib/analytics/events.ts` を読むようになり、`window.gtag` の型 (`lib/analytics/types.ts` の
declare global) が範囲外で CI の Contract Tests だけが落ちた。手元はキャッシュで通っていた。

**How to apply:** 共有の barrel (`@/components/surface` など) に部品を足した・import を増やした変更を push する前は、
`rm -rf .local/tsbuildinfo && npm run type-check:scripts` で回す。グローバルの型 (declare global) に頼るファイルは、
宣言のファイルを `import type {} from './types'` で明示的に読む。関連: [[feedback_run_full_web_tests_before_push]]
