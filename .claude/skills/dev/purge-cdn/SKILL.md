---
name: purge-cdn
description: Cloudflare CDN のキャッシュを API で即時パージする。Use when user says "Purge", "キャッシュパージ", "purge-cdn". middleware / sitemap / robots / metadata 系のデプロイ後に実行すると古い応答がエッジから消える.
disable-model-invocation: true
argument-hint: [--everything] [--r2-prefix <prefix>] [--r2-files <key1> <key2> ...]
---

Cloudflare Cache Purge API を叩いて stats47.jp / storage.stats47.jp の CDN キャッシュを即時削除する。

## 用途

`/deploy` の Step 7 で「Purge 推奨」と判定された際、ユーザーにダッシュボード操作を依頼する代わりに Claude が直接実行する。

主な実行タイミング:
- middleware ルール追加 / 変更後（Fix 7/8 のような 200 → 410 切替）
- `sitemap.ts` / `robots.ts` / metadata 設定変更後
- `GONE_*_KEYS` / `KNOWN_*_KEYS` への追加・削除
- R2 にアップロードしたファイルを即時反映したい場合

## 事前確認

`.env.local` に以下が設定されていること（既に `/fetch-gsc-data` 等が動いているなら通常 OK）:

- `CLOUDFLARE_API_TOKEN` — `Zone.Cache Purge` 権限付き
- `CLOUDFLARE_ZONE_ID` — stats47.jp の Zone ID

## 引数とモード

| モード | 引数 | 対象 | API 送信内容 |
|---|---|---|---|
| 全ゾーンパージ（デフォルト） | なし（or `--everything`） | stats47.jp + storage.stats47.jp 全キャッシュ | `{ "purge_everything": true }` |
| R2 プレフィックス指定 | `--r2-prefix <prefix>` | `storage.stats47.jp/<prefix>/*` | 該当 R2 キー一覧を取得後、URL ごとに `{ "files": [...] }` |
| R2 ファイル指定 | `--r2-files <key1> <key2> ...` | 指定キーのみ | `{ "files": [ "https://storage.stats47.jp/<key>", ... ] }` |

**注意**: `--r2-*` は R2 カスタムドメイン配下のみ。stats47.jp の HTML 200 応答をピンポイントで消したい場合は **全ゾーンパージを使う**（Cloudflare API 側に stats47.jp 単体の URL 指定パージは `--files` で可能だが、本スキルの CLI フラグは未対応）。

## 手順

### 0. 影響範囲の明示

実行前に **ユーザーに 1 行で宣言する**。誤って全パージを掛けると初回アクセスが一時的に遅くなるため。

例:
> `/purge-cdn --everything` 実行予定: stats47.jp + storage.stats47.jp 全キャッシュをパージ。初回アクセスが Cloudflare エッジに再キャッシュされるまで数百ms〜1s 遅延あり。

### 1. 既存スクリプト経由で実行

`packages/r2-storage/src/scripts/purge-cache.ts` が API 呼び出しを実装済み。薄くラップして呼ぶ。

#### モード: 全ゾーンパージ（デフォルト）

```bash
npx tsx packages/r2-storage/src/scripts/purge-cache.ts
```

#### モード: R2 プレフィックス

```bash
npx tsx packages/r2-storage/src/scripts/purge-cache.ts --prefix <prefix>
```

#### モード: R2 ファイル指定

```bash
npx tsx packages/r2-storage/src/scripts/purge-cache.ts --files <key1> <key2> ...
```

### 2. 結果検証

```bash
# エッジキャッシュが消えたことの確認例
curl -sI https://stats47.jp/ | grep -iE 'cf-cache-status|cf-ray|cache-control'
# 2回目で HIT に戻る / 1回目は MISS or DYNAMIC
```

R2 側:
```bash
curl -sI https://storage.stats47.jp/<key> | grep -iE 'cf-cache-status'
```

## 実装メモ

- 既存スクリプト `packages/r2-storage/src/scripts/purge-cache.ts` は Cloudflare API 直叩き（fetch）、wrangler CLI 依存なし
- Zone 全体を対象にするため `purge_everything: true` は stats47.jp / storage.stats47.jp 両方を消す（同一ゾーン前提）
- 500 URL 超の prefix パージは自動的に `purge_everything` にフォールバック
- API 権限: `CLOUDFLARE_API_TOKEN` に `Zone.Cache Purge` スコープが必要

## 関連

- `/deploy` — middleware / sitemap / robots 系変更後に Step 7 で本スキルの実行を推奨
- `packages/r2-storage/src/scripts/purge-cache.ts` — Purge API 実装本体
- `.claude/skills/db/purge-cache-r2/SKILL.md` — R2 オブジェクト自体の削除（混同しない。こちらはキャッシュのみ）
