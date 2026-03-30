**[廃止] ISR キャッシュは 2026-03 に廃止済み。stats47-cache バケットは使用していない。**

全ページ SSR 化に伴い、R2 ISR キャッシュ（stats47-cache）は不要となった。
このスキルは過去に OpenNext R2 ISR キャッシュのパージに使用していた。

## 廃止の経緯

- ISR の前提（ビルド時に D1 で正しいページ生成）が CI 環境で成り立たなかった
- D1 接続エラーが ISR キャッシュに保存され、全訪問者にエラーページが配信される問題が繰り返し発生
- D1 クエリは 0.1ms で応答するため、SSR で十分な性能

## 参照

- `apps/web/open-next.config.ts` — `r2IncrementalCache` 削除済み
- `apps/web/wrangler.toml` — `NEXT_INC_CACHE_R2_BUCKET` バインディング削除済み
