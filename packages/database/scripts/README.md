# Static DB Seed Scripts

本プロジェクトでは、マスターデータや統計データなどの「Static DB」の管理に **R2 ベースの同期フロー** を採用しています。

- **Master Record**: `packages/database/src/seed/OVERVIEW.md` (Git管理)
- **Data Store**: Cloudflare R2 (`seeds/*.json`)
- **Data Flow**: ローカル D1 ⇄ `.local/r2/seeds/*.json` ⇄ R2

## 環境とDB構成

`apps/web/wrangler.toml` の定義に基づき、Static DB は以下の構成になっています。

| 環境 | D1 Database Name | Binding | 備考 |
|:-----|:-----------------|:--------|:-----|
| **Local** | `stats47_local_static` | `STATS47_STATIC_DB` | 開発用。好きに破壊・再構築可能。 |
| **Production** | `stats47_static` | `STATS47_STATIC_DB` | 本番データ。 |

## コマンド

```bash
# 1. ローカル D1 → .local/r2/seeds/*.json に抽出
npm run seed:extract

# 2. .local/r2/seeds/*.json → R2 にアップロード
npm run seed:push

# 3. R2 → .local/r2/seeds/*.json にダウンロード
npm run seed:pull

# 4. .local/r2/seeds/*.json → ローカル D1 に投入
npm run seed

# 5. .local/r2/seeds/*.json → リモート D1 に投入（dry-run 推奨）
npm run seed:remote:production -- --dry-run
npm run seed:remote:production
```

> **Note**: `seed:remote:production` はリモート D1（本番）を直接更新します。実行前に必ず dry-run で確認してください。

## 運用フロー

### 1. ローカルでの開発・データ更新

1. ローカル環境で通常通り開発・データ更新を行います。
2. 作業完了後、以下の手順で共有します。

```bash
# 抽出
npm run seed:extract

# R2へアップロード
npm run seed:push

# Gitコミット (OVERVIEW.mdのみ)
git add src/seed/OVERVIEW.md
git commit -m "update seed data"
```

### 2. 新しい環境 / 他メンバーの変更取り込み

```bash
# Git pull (OVERVIEW.mdの更新を確認)
git pull

# R2から最新データを取得
npm run seed:pull

# ローカルD1に反映
npm run seed
```

### 3. リモートへの同期 (Deploy)

`.local/r2/seeds/` の内容をリモート D1 に反映させます。

```bash
# Dry-run で確認（推奨）
npm run seed:remote:production -- --dry-run

# 実行（本番DBが更新されます！）
npm run seed:remote:production
```

## スクリプト詳細

### `npm run seed:extract` (extract-seed.ts)
- ローカル D1 からデータを読み出し、JSON ファイルとして `.local/r2/seeds/` に保存します。
- `seed-common.ts` の `SEEDS` 配列定義のみを対象とします。
- **安全性**: 抽出漏れを防ぐため、未定義テーブルがある場合はエラー終了します。
- 古い `.ts` ファイルがある場合は自動的に削除されます。

### `npm run seed:push` (seed-push.ts)
- `.local/r2/seeds/*.json` を R2 バケットの `seeds/` プレフィックス配下にアップロードします。
- サイズ比較により、変更のあるファイルのみアップロードします。

### `npm run seed:pull` (seed-pull.ts)
- R2 バケットの `seeds/` から JSON ファイルを `.local/r2/seeds/` にダウンロードします。
- サイズ比較により、変更のあるファイルのみダウンロードします。

### `npm run seed:remote:<env>` (seed-remote.ts)
- `.local/r2/seeds/*.json` のデータを読み込み、リモート D1 に INSERT します。
- **挙動**:
  1. `.local/r2/seeds/*.json` からデータをメモリにロード
  2. `.temp-sync/` に SQL ファイルを生成
  3. リモートの既存データを削除 (`DELETE FROM ...`) ※ `--skip-clear` でスキップ可
  4. `wrangler d1 execute` でデータを投入（分割実行）
  5. 投入後のレコード数を検証

## seed ファイルの管理方針

| ファイル形式 | 保存場所 | 管理方法 | 役割 |
|:-----|:---------|:---|:---|
| `OVERVIEW.md` | Git | Tracked | データの変更履歴、件数サマリ |
| `*.json` | ローカル / R2 | Git Ignored | 実データ。R2で共有 |

- **Git管理**: `OVERVIEW.md` のみ。データの中身（JSON）は Git に含めません。
- **R2管理**: 実データは全て R2 (`seeds/*.json`) で一元管理します。
