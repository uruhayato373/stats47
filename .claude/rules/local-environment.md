# ローカル開発環境

## モノレポ構成

```
apps/
  web/       Next.js (Cloudflare Pages) — 公開サイト
  remotion/  Remotion — 動画・SNS 投稿画像生成（YouTube/Instagram/X/note）
  ges/       Google Earth Studio — 47都道府県旋回動画の生成・自動化
packages/
  database/        Drizzle ORM + Cloudflare D1 スキーマ・シード
  types/           共通型定義
  visualization/   D3.js チャートコンポーネント
  components/      shadcn/ui ベース共通 UI
  estat-api/       e-Stat API クライアント
  ranking/         ランキング計算ロジック
  r2-storage/      Cloudflare R2 アクセス
  utils/           汎用ユーティリティ
```

## ストレージ

- **ローカル D1/R2 は `.local/d1/` に統一。** `wrangler.toml` の `persist_to = "../../.local/d1"` と `next.config.ts` の `initOpenNextCloudflareForDev({ persist: { path: "../../.local/d1" } })` で、`pull:d1` スクリプトと dev server が同じデータを参照する。**`apps/web/.wrangler/state/` は使わない。**
- **ローカル D1**: `.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`（wrangler/miniflare が自動生成する長いハッシュ名）。**`.local/d1/*.sqlite`（ルート直下）は 0 バイトのダミーファイルなので参照しないこと。**
- **ローカル R2**: `.local/r2/` 配下にシードデータ・ランキングデータ・ブログ記事を配置。R2 キャッシュ（e-Stat API レスポンス等）も `.local/d1/v3/r2/` 配下に保存される

## D1 パス固定値

`better-sqlite3` は存在しないパスで `new Database()` すると**空ファイルを自動作成する**。下記以外で D1 を開かないこと。

```
.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite
```

## ネットワーク

- **プロキシ制約**: 企業ネットワークで S3 API が HTTP 407/503 でブロックされる場合あり。`/push-r2` スキルが wrangler CLI フォールバックを案内する

## 頻用コマンド

```bash
# 型チェック（ワークスペース別）
npx tsc --noEmit -p apps/web/tsconfig.json
cd apps/remotion && npx tsc --noEmit

# D1 バックアップ（リモート D1 → R2）
npm run backup:d1 --workspace=packages/database -- --env production
```
