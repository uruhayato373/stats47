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

- **ローカル D1/R2 は `.local/` 配下。** `wrangler.toml` の `persist_to = "../../.local/d1"` と `next.config.ts` の `initOpenNextCloudflareForDev({ persist: { path: "../../.local/d1" } })` で、dev server と各スクリプトが同じデータを参照する。**`apps/web/.wrangler/state/` は使わない。**
- **ローカル D1**: `.local/d1/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`（wrangler/miniflare が自動生成する長いハッシュ名）。**`.local/d1/*.sqlite`（ルート直下）は 0 バイトのダミーファイルなので参照しないこと。**
- **ローカル R2**: `.local/r2/` 配下にシードデータ・ランキングデータ・ブログ記事を配置。miniflare R2 バインディングのキャッシュ（next dev 用、e-Stat API レスポンス等）は `.local/d1/r2/stats47/blobs/` 配下に保存される

## dual-mode 構成 (2026-05-28〜): D1 = Mac 内蔵 / R2 = SSD or cloud

容量の都合で `.local` 配下を **D1 (Mac 内蔵) と R2 (外付け SSD)** に分離している。狙いは「SSD 接続有無に関わらず開発できる」こと。

```
.local/                 (実ディレクトリ、Mac 内蔵)
├── d1/                 ← 実体 Mac 内蔵 (447M)。D1 SQLite + miniflare R2 binding cache。
│                          cloud に無い唯一コピーなので常駐。SSD 非接続でも D1 は動く
├── r2 ──────────────→  /Volumes/SSD/stats47-local/r2 への symlink (19G、観測値/snapshot mirror)
├── r2-manifest ─────→  SSD symlink
├── r2-pre-migration ─→ SSD symlink (旧バックアップ)
└── playwright-*-profile → SSD symlink (SNS ブラウザ自動化 profile)
```

### モード別挙動

| 状態 | D1 | R2 読み取り | R2 書き込み |
|---|---|---|---|
| **SSD 接続** | Mac 内蔵 (高速) | `.local/r2` symlink 経由でローカル (高速) | symlink 経由で SSD に stage → `/push-r2` |
| **SSD 非接続 (読み中心)** | Mac 内蔵 (高速) | symlink が dangle → `fetchFromR2` が **cloud S3 に自動フォールバック** | — |
| **SSD 非接続 (書込が必要)** | Mac 内蔵 | cloud S3 fallback | `scripts/dev/local-r2-mode.sh cloud` で Mac 内蔵 stage dir に切替 → `/push-r2` |

- `fetchFromR2` の 3 段フォールバック (ローカル FS → Workers binding → S3 API) により、R2 読みは SSD 非接続でも cloud から自動取得される (S3 認証は `.env.local`)
- **コード/docs/tsc/git 作業は SSD 不要** (D1 が Mac 内蔵にあるため SSR/クエリも動く)

### R2 モード切替

```bash
scripts/dev/local-r2-mode.sh status   # 現在のモード
scripts/dev/local-r2-mode.sh ssd      # SSD 接続時: symlink モード (デフォルト)
scripts/dev/local-r2-mode.sh cloud    # SSD 非接続で書込したい時: Mac 内蔵 stage
```

### 注意点

- **SSD 上の `d1/` は 2026-05-28 移行時点のバックアップ**。以降は Mac 内蔵 `.local/d1` が authoritative。Mac 内蔵 D1 を更新したら、必要に応じて SSD にも `cp -R` でバックアップ同期する (単一障害点回避)
- SSD 非接続の cloud モードで生成した snapshot は **必ず `/push-r2`** で cloud 反映する (ローカルにしか無い状態を残さない)

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
