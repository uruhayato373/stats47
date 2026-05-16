---
name: deploy
description: develop ブランチを main へ PR + CI で反映してデプロイする。Use when user says "デプロイ", "deploy", "本番反映". テスト・型チェック・ビルド + ローカル D1/R2 sync 漏れ検知付き.
disable-model-invocation: true
---

変更を develop → main (PR + CI 経由) へ反映して本番デプロイする。

## ブランチ運用ルール

```
feature/* ──(直 merge)──▶ develop ──(PR + CI)──▶ main（デプロイ）
```

- **feature/***: 機能ブランチ。develop から分岐し、ローカルで `git merge --no-ff` で develop に取り込む。PR は不要 (`pr-quality-check.yml` は main PR でしか走らない)
- **develop**: 統合ブランチ。feature/* からの直 merge を受け、`git push origin develop` で remote 反映
- **main**: 本番デプロイブランチ。**develop → main の PR 経由でのみ更新**。CI green → マージ → Cloudflare Pages 自動デプロイ

## 前提

- 変更がすべてコミット済みであること
- **現在ブランチが feature/* であること**。develop にいる場合は Step 1.5 で feature 化してから進める

## 手順

### Step 1: 事前チェック

```bash
git branch --show-current
git status
```

- 未コミットの変更がある場合 → ユーザーに確認して中止
- 現在のブランチ名を `$CURRENT_BRANCH` として記憶する

### Step 1.5: feature ブランチ化（develop/main にいる場合）

`$CURRENT_BRANCH` が `develop` or `main` の場合、未 push コミットがあるなら **feature ブランチへ移動**する。ブランチ名はユーザーに確認するか `feature/<日時>-<短い要約>` 形式で提案。

```bash
# develop の未 push コミットを feature ブランチに移動
git checkout -b feature/20260418-<topic>

# develop を origin に合わせる（ローカルの先行コミットは feature に移動済み）
git branch -f develop origin/develop
```

既に feature/* にいる場合はこの Step をスキップ。

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

### Step 2.5: R2 スナップショット更新漏れチェック（sync 忘れ防止）

ローカルで DB データ（ranking・sns_posts 等）や R2 アセット（記事・画像）を編集していた場合、
本番デプロイ後にコードと R2 スナップショットがずれてエラーになる事故を防ぐため、push 前に確認する。

- DB データを変更した場合 → `/sync-snapshots` で R2 スナップショットを再生成・push 済みか確認
- R2 アセット（画像等）を変更した場合 → `/push-r2` で push 済みか確認

#### R2 差分チェック（簡易: ローカル変更時刻ベース）

```bash
find .local/r2 -type f -newermt "24 hours ago" 2>/dev/null | head -5
```

- **出力が空** → R2 は OK
- **ファイルが出る** → 該当ファイルを表示してユーザーに `/push-r2` 実行可否を確認

### Step 3: feature ブランチを develop へ直 merge

PR は不要 (CI 発火しない)。ローカルで直接マージする。

```bash
# feature ブランチの最終 commit を確認
git log --oneline origin/develop..$CURRENT_BRANCH

# develop に取り込み
git switch develop
git pull origin develop
git merge --no-ff $CURRENT_BRANCH -m "Merge $CURRENT_BRANCH: <短い要約>"
git push origin develop
```

- `--no-ff` で merge commit を残して論理境界を保持
- conflict 発生時はユーザーに報告して指示を仰ぐ (自動解決しない)

### Step 4: develop → main PR を作成

ここで PR を作成 → `pr-quality-check.yml` の CI が自動発火する。

```bash
gh pr create --base main --head develop --title "Release: <短い要約>" --body "$(cat <<'EOF'
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

PR URL を出力。CI が green になるまで次へ進まない。

### Step 5: CI 完了待ち & PR マージ

```bash
# CI 完了待ち (polling、最大 10 分)
gh pr checks <PR_NUMBER> --watch || true

# CI green を確認してマージ
gh pr merge <PR_NUMBER> --merge
```

- マージ後 Cloudflare Pages が自動デプロイをトリガー
- マージできない場合 (CI 失敗 / conflict) → ユーザーに報告

### Step 6: 元のブランチに戻る & 後処理

```bash
git switch develop
git pull origin develop
git branch -d $CURRENT_BRANCH                              # ローカル削除
git push origin --delete $CURRENT_BRANCH 2>/dev/null || true  # リモート削除
```

### Step 7: 完了報告

- マージしたブランチ名
- テスト・型チェック・ESLint の結果サマリ
- **D1 / R2 sync の実行有無**
- develop, main それぞれの push 結果
- PR URL とマージ時刻
- Cloudflare デプロイ完了確認 (`gh run list --branch main --workflow "Deploy to Cloudflare Workers" --limit 1`)

### Step 8: Cloudflare Purge 自動実行の判定

以下のいずれかに該当する変更が含まれる場合、**`/purge-cdn` を Claude が自動実行**する（ダッシュボード操作不要）。

- `apps/web/src/middleware.ts` のルール追加・変更（特に 410 / 301 / noindex 分岐）
- `apps/web/src/app/**/page.tsx` の `generateMetadata` で `robots` / `canonical` を変更
- `apps/web/src/app/robots.ts` / `sitemap.ts` / `manifest.ts` の変更
- `apps/web/src/config/gone-*.ts` / `known-*.ts` への追加・削除
- `apps/web/src/lib/indexable-area-categories.ts` の変更

**理由**: 本番の HTML 200 応答は `Cache-Control: s-maxage=86400` で Cloudflare エッジに最大 24 時間キャッシュされる。middleware ルール変更を即時反映するには Purge が必要。

実行: `/purge-cdn` スキル。影響範囲を 1 行で宣言してから実行。

sitemap / middleware と無関係 (blog 記事追加のみ、バグ修正のみ等) の場合は Step 8 全体をスキップ。

## エラー時の方針

- テスト/型チェック/ESLint の失敗 → ユーザーに確認し、続行 or 中止を判断
- マージコンフリクト → **自動解決しない**。ユーザーに状況を報告し指示を仰ぐ
- push 失敗 → ユーザーに報告し、リトライ or 手動対応を相談
- CI 失敗 → 失敗 job のログを確認、修正コミットを feature に作って再 push、再度 develop merge → 既存 PR は自動再 CI
- いかなる場合も `--force` は使用しない
