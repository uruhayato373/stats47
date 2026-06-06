# ローカル開発環境

## モノレポ構成

```
apps/
  web/       Next.js (Cloudflare Pages) — 公開サイト
  remotion/  Remotion — 動画・SNS 投稿画像生成（YouTube/Instagram/X/note）
  ges/       Google Earth Studio — 47都道府県旋回動画の生成・自動化
packages/
  database/        Drizzle schema (型ソース) + テスト基盤 + 使い捨てビルドキャッシュ操作 (永続 D1 なし)
  types/           共通型定義
  visualization/   D3.js チャートコンポーネント
  components/      shadcn/ui ベース共通 UI
  estat-api/       e-Stat API クライアント
  ranking/         ランキング計算ロジック
  r2-storage/      Cloudflare R2 アクセス
  utils/           汎用ユーティリティ
```

## ストレージ

- **データ層は「完全DBレス」が正典** → `docs/01_技術設計/19_完全DBレス設計.md`。本番は R2 snapshot のみ読む。SSOT は **git TS (設定・運用エンティティ) と R2 (観測値・配信) の二つだけ**。Derived (area_profiles / correlations) は **エフェメラル計算 → R2**。**永続/リモート D1 は廃止。クラウド/ローカルとも git TS 編集 + R2 直接反映で作業する (D1 認証は不要)。**
- **ローカルビルド DB (SQLite)**: `packages/database/.data/stats47.sqlite`（旧 batch / エフェメラル集計が建てる**使い捨てビルドキャッシュ**。SSOT ではない）。git 管理外。**不在でも git TS 編集 / R2 直接反映 / エフェメラル集計は可能 = 基本「正常」**。R2 を読みたいだけなら公開 URL 経由で認証なしに取得できる。
  - これは **Cloudflare D1 サービスではない**。本番は R2 snapshot のみ読み、DB を一切 query しない。
- **dev server の miniflare**: `next.config.ts` の `initOpenNextCloudflareForDev({ persist: { path: "../../.local/d1" } })` は **R2 dev binding cache** (`.local/d1/r2/stats47/blobs/`) のために残置。`[[d1_databases]]` binding (STATS47_STATIC_DB) は app が read しないため vestigial（miniflare が `.local/d1/.../miniflare-D1DatabaseObject/*.sqlite` を作るが、batch は参照しない）。**`apps/web/.wrangler/state/` は使わない。**
- **R2 読み取り (標準)**: ビルド/集計スクリプトは **公開 URL 経由**で R2 を読める →
  `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`（GET のみ・list 不可）+ `NODE_OPTIONS='--conditions react-server'`。

## R2 書き込み (push / 削除) は CI / クラウド専用 ★

**読み取りはローカル可 (公開 URL)、書き込みはローカル禁止。** R2 反映はレビュー済みの git 状態から
GitHub Actions が行う。ローカルからの誤 push / 誤削除を防ぐため、push 系スクリプト
(`diff-push-r2.ts` / `push-r2-wrangler.ts` / `db:push` / `delete-r2-prefix.ts` / `r2-cleanup-orphans.ts`)
は `packages/r2-storage/src/scripts/_assert-ci-write.ts` のガードで **CI 外では停止**する
(`CI` / `GITHUB_ACTIONS` 未設定 かつ `ALLOW_LOCAL_R2_WRITE` 未設定時)。

| 目的 | 実行方法 (CI) |
|---|---|
| 配信 snapshot 再生成 + R2 push | `gh workflow run sync-snapshots.yml [-f only=<task>] [-f dry_run=true]` |
| blog 公開 | `publish-blog.yml` |
| e-Stat → R2 観測値更新 | `data-refresh.yml` |

- ローカルで `sync-snapshots/run.sh` を実行すると snapshot は `.local/r2` に生成され、push は自動スキップ。
- どうしてもローカルから push する場合のみ `ALLOW_LOCAL_R2_WRITE=1` を付与 (非推奨、S3 認証 or `wrangler login` 要)。
- CI シークレット: `CLOUDFLARE_R2_ACCESS_KEY_ID` / `CLOUDFLARE_R2_SECRET_ACCESS_KEY` / `CLOUDFLARE_ACCOUNT_ID` は設定済。

## ローカルビルド DB (SQLite) パス固定値

`better-sqlite3` は存在しないパスで `new Database()` すると**空ファイルを自動作成する**。下記以外で開かないこと。中央定義は `packages/database/src/config/local-db-paths.ts` の `LOCAL_DB_PATHS.STATIC.getPath()`（全 batch がこれ経由 or 同一パスを解決）。

```
packages/database/.data/stats47.sqlite
```

（旧 miniflare ハッシュパス `.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` は廃止。dev server の miniflare が同名ファイルを作る場合があるが batch は参照しない。）

## ネットワーク

- **プロキシ制約**: 企業ネットワークで S3 API が HTTP 407/503 でブロックされる場合あり。`/push-r2` スキルが wrangler CLI フォールバックを案内する

## 頻用コマンド

```bash
# 型チェック（ワークスペース別）
npx tsc --noEmit -p apps/web/tsconfig.json
cd apps/remotion && npx tsc --noEmit
```

> 旧 `npm run backup:d1 --env production`（リモート D1 → R2 バックアップ）は **リモート D1 廃止により不要**。
> 完全DBレスでは観測値・配信は R2 が SSOT、設定/運用は git TS が SSOT で履歴は git に残る。
