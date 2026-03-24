# repositories/api

e-Stat API との HTTP 通信を担当。

## 責務

- API リクエストパラメータの構築
- HTTP 通信の実行（リトライ処理含む）
- API レスポンスの検証

## ファイル一覧

| ファイル | 関数 | 説明 |
|----------|------|------|
| `build-request-params.ts` | `buildRequestParams` | リクエストパラメータ構築 |
| `fetch-from-api.ts` | `fetchFromApi` | API からメタ情報取得 |
| `validate-response.ts` | `validateResponse` | レスポンス検証 |
