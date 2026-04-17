---
name: deploy
description: develop ブランチを main にマージしてデプロイする。Use when user says "デプロイ", "deploy", "本番反映". テスト・型チェック・ビルド付き.
disable-model-invocation: true
---

変更を develop → main へマージしてデプロイする。

## ブランチ運用ルール

```
feature/* → develop → main（デプロイ）
```

- **develop**: 統合ブランチ。全ての変更はまず develop に入る
- **main**: 本番デプロイブランチ。develop からのマージのみ
- **feature/***: 機能ブランチ。develop から分岐し develop にマージ
- main に直接コミット・push しない

## 前提

- 変更がすべてコミット済みであること

## 手順

### Step 1: 事前チェック

```bash
git branch --show-current
git status
```

- 未コミットの変更がある場合 → ユーザーに確認して中止
- 現在のブランチ名を `$CURRENT_BRANCH` として記憶する

### Step 2: テスト・型チェック・ビルド

以下を**順番に**実行する。いずれかが失敗した場合はユーザーに報告し、続行するか確認する。

```bash
# 1. 型チェック
npx tsc --noEmit -p apps/web/tsconfig.json

# 2. ESLint
cd apps/web && npx eslint src/ --ext .ts,.tsx && cd ../..

# 3. ユニットテスト
cd apps/web && npx vitest run && cd ../..
```

全パスしたら Step 3 へ進む。

### Step 3: develop へマージ（feature ブランチの場合）

`$CURRENT_BRANCH` が `develop` でも `main` でもない場合:

```bash
git checkout develop
git pull origin develop
git merge $CURRENT_BRANCH
```

- **コンフリクトが発生した場合** → ユーザーに報告し、解決方法を相談する。自動解決しない。
- **マージ成功** → push する。

```bash
git push origin develop
```

`$CURRENT_BRANCH` が既に `develop` の場合はこのステップをスキップ。

### Step 4: main へマージ

```bash
git checkout main
git pull origin main
git merge develop
```

- **コンフリクトが発生した場合** → ユーザーに報告し、解決方法を相談する。
- **マージ成功** → push する。

```bash
git push origin main
```

### Step 5: 元のブランチに戻る

```bash
git checkout $CURRENT_BRANCH
```

### Step 6: 完了報告

以下を報告する:

- マージしたブランチ名
- テスト・型チェック・ESLint の結果サマリ
- develop, main それぞれの push 結果
- エラーがあった場合はその内容

### Step 7: Cloudflare Purge 推奨の判定

以下のいずれかに該当する変更が含まれる場合、**ユーザーに Cloudflare Dashboard の "Purge Everything" 実行を促す**（Claude は自動実行しない）。

- `apps/web/src/middleware.ts` のルール追加・変更（特に 410 / 301 / noindex 分岐）
- `apps/web/src/app/**/page.tsx` の `generateMetadata` で `robots` / `canonical` を変更
- `apps/web/src/app/robots.ts` / `sitemap.ts` / `manifest.ts` の変更
- `apps/web/src/config/gone-*.ts` / `known-*.ts` への追加・削除
- `apps/web/src/lib/indexable-area-categories.ts` の変更

**理由**: 本番の HTML 200 応答は `Cache-Control: s-maxage=86400` で Cloudflare エッジに最大 24 時間キャッシュされる。middleware ルール変更を即時反映するには Purge が必要。410 応答は `no-store` なので Purge 不要だが、「以前 200 を返していた URL が 410 に切り替わる」ケース（例: Fix 7/8、GONE_*_KEYS 追加）では 200 側のキャッシュが残る。

実行手順を報告例に含める:
```
⚠️ Cloudflare Purge Everything を推奨します:
  Dashboard → stats47.jp → Caching → Configuration → Purge Everything
  理由: <変更内容> により middleware の応答分岐が変わるため、エッジの古い 200 応答を即時除去する
```

変更が sitemap / middleware と無関係（例: blog article の追加のみ、バグ修正のみ）の場合は Purge 推奨は不要。

## エラー時の方針

- テスト/型チェック/ESLint の失敗 → ユーザーに確認し、続行 or 中止を判断
- マージコンフリクト → **自動解決しない**。ユーザーに状況を報告し指示を仰ぐ
- push 失敗 → ユーザーに報告し、リトライ or 手動対応を相談
- いかなる場合も `--force` は使用しない
