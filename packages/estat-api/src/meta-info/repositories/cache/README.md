# repositories/cache

R2 オブジェクトストレージへのキャッシュ操作を担当。

## 責務

- メタ情報のキャッシュ読み書き
- キャッシュキーの生成・一覧取得
- メタデータのサニタイズ

## ファイル一覧

| ファイル | 関数 | 説明 |
|----------|------|------|
| `find-cache.ts` | `findCache` | キャッシュからメタ情報取得 |
| `save-cache.ts` | `saveCache` | キャッシュにメタ情報保存 |
| `list-cache-keys.ts` | `listCacheKeys` | キャッシュキー一覧取得 |
| `sanitize-metadata.ts` | `sanitizeMetadata` | R2 メタデータのサニタイズ |
