---
name: deploy
description: develop ブランチを main にマージしてデプロイする。Use when user says "デプロイ", "deploy", "本番反映". テスト・型チェック・ビルド + ローカル D1/R2 sync 漏れ検知付き.
disable-model-invocation: true
---

変更を develop → main へマージしてデプロイする。

## ブランチ運用ルール

```
feature/* ──(PR 必須)──▶ develop ──(直接 merge)──▶ main（デプロイ）
```

- **feature/***: 機能ブランチ。develop から分岐する。**develop へは PR 経由でのみマージする**
- **develop**: 統合ブランチ。feature/* からの PR を受ける。**develop 直接 push は禁止**
- **main**: 本番デプロイブランチ。develop からの直接 merge のみ（Cloudflare Pages がトリガー）。main への直接コミット・push 禁止
- PR は `gh pr create --base develop` で `.github/workflows/pr-quality-check.yml` が自動実行される

## 前提

- 変更がすべてコミット済みであること
- **現在ブランチが feature/* であること**（develop 直接はワークフロー外）。develop にいる場合は Step 1.5 で feature 化してから進める

## 手順

### Step 1: 事前チェック

```bash
git branch --show-current
git status
```

- 未コミットの変更がある場合 → ユーザーに確認して中止
- 現在のブランチ名を `$CURRENT_BRANCH` として記憶する

### Step 1.5: feature ブランチ化（develop/main にいる場合）

`$CURRENT_BRANCH` が `develop` or `main` の場合、未 push コミットがあるなら **feature ブランチへ移動**する。ブランチ名はユーザーに確認するか `feature/<日時>-<短い要約>` 形式で提案（例: `feature/20260418-purge-skill`）。

```bash
# develop の未 push コミットを feature ブランチに移動
git checkout -b feature/20260418-<topic>

# develop を origin に合わせる（ローカルの先行コミットは feature に移動済み）
git branch -f develop origin/develop
```

`$CURRENT_BRANCH` を新しい feature ブランチ名に更新。既に feature/* にいる場合はこの Step をスキップ。

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

全パスしたら Step 2.5 へ進む。

### Step 2.5: ローカル D1 / R2 の差分チェック（sync 忘れ防止）

ローカルで DB データ（ranking・sns_posts 等）や R2 アセット（記事・画像）を編集していた場合、
本番デプロイ後にコードと DB/R2 がずれてエラーになる事故を防ぐため、push 前に差分を検知する。

#### D1 差分チェック

```bash
npm run diff:d1 --workspace=packages/database
```

- **出力に「✓ すべて同期済みです。」が含まれる** → D1 は OK。次へ
- **「アクション (push)」セクションが出る** → ローカルに未 push の変更あり
  - ユーザーに確認: 「ローカル D1 に未 push の変更が N テーブルあります。`/sync-remote-d1` を先に実行しますか？（y/n）」
  - **y**: `/sync-remote-d1` を呼んで push 完了を待ってから Step 3 へ
  - **n**: 理由を記録（例: 「別 PR で同期予定」）、Step 3 へ進む

#### R2 差分チェック（簡易: ローカル変更時刻ベース）

`.local/r2/` 配下に直近 24 時間で変更されたファイルがあれば、push 漏れの可能性がある。

```bash
find .local/r2 -type f -newermt "24 hours ago" 2>/dev/null | head -5
```

- **出力が空** → R2 は OK。Step 3 へ
- **ファイルが出る** → 該当ファイルを表示してユーザーに確認:
  - 「`.local/r2/` に直近 24h で変更された N ファイルがあります（例: XXX）。`/push-r2` で反映しますか？（y/n）」
  - **y**: `/push-r2` を呼んで完了を待ってから Step 3 へ
  - **n**: 理由を記録、Step 3 へ進む

**判断のコツ**:
- コード変更だけで DB/R2 は触っていないセッション → D1/R2 どちらも「✓」になるはず、スキップ可
- `/register-ranking`・`/populate-*`・`/publish-article`・`/sync-articles` 等を使ったセッション → ほぼ確実に sync が必要
- 判断が付かない場合は常に sync を推奨（空同期でも失敗はしない）

### Step 3: feature ブランチを push + PR 作成

```bash
git push -u origin $CURRENT_BRANCH
```

PR 本文は HEREDOC で組み立てる（1 セッション分の commit を要約）。既存の PR テンプレートがあれば踏襲。

```bash
gh pr create --base develop --head $CURRENT_BRANCH --title "feat: <短い要約>" --body "$(cat <<'EOF'
## Summary
- <1-3 行の要約>

## 変更点
- <ファイル別の変更内容>

## 検証
- [x] tsc --noEmit pass
- [x] eslint pass
- [x] vitest run pass
- [x] D1 sync OK（ローカルに未 push 差分なし / 別 PR で同期予定）
- [x] R2 sync OK（.local/r2/ に 24h 以内の未 push ファイルなし）
- [ ] Playwright E2E（該当なら）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

PR URL を出力してユーザーに報告。`.github/workflows/pr-quality-check.yml` が自動実行されるため、CI が pass したらマージ可。

### Step 4: PR マージ待ち & develop → main

PR が GitHub 上でマージされたら（ユーザー or `gh pr merge --merge`）:

```bash
git checkout develop
git pull origin develop   # PR マージ結果を取り込み
git checkout main
git pull origin main
git merge develop
git push origin main
```

- **コンフリクトが発生した場合** → ユーザーに報告し、解決方法を相談する。
- **main push で Cloudflare Pages がデプロイを自動トリガー**

### Step 5: 元のブランチに戻る

feature ブランチは既にマージ済なので削除してもよい:

```bash
git checkout develop
git branch -d $CURRENT_BRANCH                   # ローカル削除
git push origin --delete $CURRENT_BRANCH 2>/dev/null || true  # リモート削除（マージ後に GitHub 自動削除されていれば不要）
```

### Step 6: 完了報告

以下を報告する:

- マージしたブランチ名
- テスト・型チェック・ESLint の結果サマリ
- **D1 / R2 sync の実行有無**（Step 2.5 で sync を走らせた場合はその結果、スキップした場合は理由）
- develop, main それぞれの push 結果
- エラーがあった場合はその内容

### Step 7: Cloudflare Purge 自動実行の判定

以下のいずれかに該当する変更が含まれる場合、**`/purge-cdn` を Claude が自動実行**する（ダッシュボード操作不要）。

- `apps/web/src/middleware.ts` のルール追加・変更（特に 410 / 301 / noindex 分岐）
- `apps/web/src/app/**/page.tsx` の `generateMetadata` で `robots` / `canonical` を変更
- `apps/web/src/app/robots.ts` / `sitemap.ts` / `manifest.ts` の変更
- `apps/web/src/config/gone-*.ts` / `known-*.ts` への追加・削除
- `apps/web/src/lib/indexable-area-categories.ts` の変更

**理由**: 本番の HTML 200 応答は `Cache-Control: s-maxage=86400` で Cloudflare エッジに最大 24 時間キャッシュされる。middleware ルール変更を即時反映するには Purge が必要。410 応答は `no-store` なので Purge 不要だが、「以前 200 を返していた URL が 410 に切り替わる」ケース（例: Fix 7/8、GONE_*_KEYS 追加）では 200 側のキャッシュが残る。

実行: `/purge-cdn` スキルを呼ぶ（内部で `npx tsx packages/r2-storage/src/scripts/purge-cache.ts` を実行）。影響範囲を 1 行で宣言してから実行。

変更が sitemap / middleware と無関係（例: blog article の追加のみ、バグ修正のみ）の場合は Step 7 全体をスキップ。

## エラー時の方針

- テスト/型チェック/ESLint の失敗 → ユーザーに確認し、続行 or 中止を判断
- マージコンフリクト → **自動解決しない**。ユーザーに状況を報告し指示を仰ぐ
- push 失敗 → ユーザーに報告し、リトライ or 手動対応を相談
- いかなる場合も `--force` は使用しない
