R2 キャッシュバケット `stats47-cache` の全オブジェクトを削除（パージ）する。

## 概要

OpenNext の ISR インクリメンタルキャッシュが `stats47-cache` バケットに蓄積して肥大化した際に使用する。
キャッシュは次回アクセス時に自動再生成されるため、安全にパージできる。

## 手順

1. ユーザーにパージ実行の意思を確認する
2. 以下のスクリプトを実行:

```bash
npx tsx packages/r2-storage/src/scripts/purge-cache-r2.ts
```

3. 出力されるオブジェクト数・合計サイズを報告する

## バケットの用途

| バケット | 用途 | wrangler.toml バインディング |
|---|---|---|
| `stats47-cache` | OpenNext ISR キャッシュ | `NEXT_INC_CACHE_R2_BUCKET` |
| `stats47` | メインストレージ（ランキング・ブログ等） | `STATS47_BUCKET` |

`stats47-cache` は web / admin で共通使用。

## 参照

- `packages/r2-storage/src/scripts/purge-cache-r2.ts` — スクリプト本体
- `apps/web/wrangler.toml` — バケットバインディング定義
