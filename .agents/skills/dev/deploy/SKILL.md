---
name: deploy
description: develop ブランチを main へ PR + CI で反映してデプロイする。Use when user says "デプロイ", "deploy", "本番反映". テスト・型チェック・ビルド + ローカル D1/R2 sync 漏れ検知付き.
disable-model-invocation: true
primary_agent: devops-runner
---

変更を develop → main (PR + CI 経由) へ反映して本番デプロイする。

## ブランチ運用ルール

```
feature/* ──(直 merge)──▶ develop ──(PR + CI)──▶ main（デプロイ）
```

- **feature/***: 機能ブランチ。develop から分岐し、ローカルで `git merge --no-ff` で develop に取り込む。PR は不要 (`pr-quality-check.yml` は main PR でしか走らない)
- **develop**: 統合ブランチ。feature/* からの直 merge を受け、`git push origin develop` で remote 反映
- **main**: 本番デプロイブランチ。**develop → main の PR 経由でのみ更新**。CI green → マージ → Cloudflare Pages 自動デプロイ

## 実行環境の判定（★最初に必ず確認）

本 skill の `gh` コマンド例は **ローカル Mac 環境**前提。**Claude Code on the web / クラウド実行環境**では前提が違うので最初に判定する。

| 能力 | ローカル | web / クラウド実行 |
|---|---|---|
| `gh` CLI | あり | **無い** |
| `curl` で GitHub API | 可 | **不可** (★下記) |
| `git push` 先 | 任意ブランチ | セッション指定ブランチに制限されることがある |
| GitHub Actions 起動 (`gh workflow run` / dispatch) | 可 | **直接は不可** (連携トークンに `actions:write` 無し → 403) → **proxy 経由で可** |
| dispatch-only workflow の代理起動 | 可 | **可** — `data/workflow-dispatch-requests.json` を develop に push (`workflow-dispatch-proxy.yml`) |
| R2 直接書き込み | 不可 (CI 専用) | 不可 (同左) |

**判定**: `command -v gh` が無い / remote 環境 ⇒ **web モード**。

### ★web モードで GitHub を触る唯一の経路は MCP ツール

**`gh` が無いからといって `curl` に逃げない。** `curl -H "Authorization: bearer $GITHUB_TOKEN" https://api.github.com/...`
は必ず `{"message":"GitHub access is not enabled for this session..."}` を返す (2026-08-04 実測)。
**しかもこれは HTTP 200 で返るので `|| exit` 系のガードをすり抜ける**。background agent の中で
叩くと出力が空ファイルになるだけで、失敗したことすら見えない (同日、監視 agent 4 本が
何も返さないまま数十分無駄になった)。

web モードでは下表の MCP ツールだけを使う。

| やりたいこと | MCP ツール |
|---|---|
| PR 作成 / 更新 / マージ | `mcp__github__create_pull_request` / `update_pull_request` / `merge_pull_request` |
| PR の CI 状態・レビュー確認 | `mcp__github__pull_request_read` |
| workflow run の一覧・結論確認 | `mcp__github__actions_list` / `mcp__github__actions_get` |
| job ログ | `mcp__github__get_job_logs` |

- `actions_list` は応答が大きくトークン上限に当たることがある。その場合は結果がファイルに
  保存されるので、`python3 -c "import json; ..."` で `run_number` / `head_sha` / `conclusion`
  だけを抜く (全文を読まない)。
- **workflow の直接 dispatch は不可** (403)。代わりに 2 経路ある: ①記事・広告の R2 公開は下記「データ公開」のとおり
  **push トリガー**（develop への push が公開を発火）。②それ以外の dispatch-only workflow は
  **`workflow-dispatch-proxy.yml`** で代理起動する:
  ```jsonc
  // data/workflow-dispatch-requests.json を develop に commit + push
  { "workflow": "sync-snapshots.yml", "inputs": { "only": "ranking-items" },
    "ref": "develop", "reason": "...", "requestedAt": "<ISO・毎回更新>" }
  ```
  proxy の run が対象 run の URL を step summary に出す。`gh workflow run` を案内するだけで終わらせない。
- branch push が制限される場合は可能な範囲で実行し、不可なら明示してユーザーに依頼する。

### ★CI が「失敗」に見えるが実は superseded (cancelled) のケース

同じブランチへ後続 push が入ると concurrency group が古い run を **cancel** する。このとき
全 job の conclusion が `cancelled` になり、通知や PR の見た目は **failure と区別がつかない**。
2026-08-04 に PR #722 と #729 で 2 回誤読した。

**判定手順**: `pull_request_read` / `actions_get` で **conclusion が `failure` か `cancelled` か**を見る。
`cancelled` かつ同ブランチに自分の run より新しい run があれば superseded で、対処は不要 —
**新しい run の結果を待つ**。ログを読みに行かない (job が始まってすらいない)。

## データ公開（コードデプロイとは別物・★見落とし注意）

`deploy-workers.yml` (main push) が反映するのは **コードのみ**。**R2 に載るデータ (ブログ記事・affiliate 広告等) は別経路**で、コードデプロイだけでは反映されない。

| 対象 | 反映経路 | 起動 |
|---|---|---|
| 新規/更新ブログ記事 (`docs/21_ブログ記事原稿/<slug>/article.md`, `published:true`) | `blog-auto-publish.yml`（**develop checkout**・factual/quality ゲート後 R2 push・MAX_PUBLISH 件） | **develop への article.md push で自動発火** (Phase 2) / 手動は `publish-blog.yml` dispatch |
| affiliate 広告 (`apps/web/scripts/affiliate-ads-data.ts`) | `publish-affiliate-ads.yml`（develop checkout → `run.sh --only affiliate-ads`） | **develop への affiliate-ads-data.ts push で自動発火** / 手動は `sync-snapshots.yml -f only=affiliate-ads` |
| page_components 等その他 snapshot | `sync-snapshots.yml` | dispatch (`-f only=<task>`) |
| 固定バナー画像 (コード直書きの `SidebarPromoBanner` 等) | コードデプロイのみで反映 (R2 不要) | main マージで自動 |

**従って「記事を含むデプロイ」では**: feature → develop へ merge した時点で push トリガーが記事/広告を R2 公開し、develop → main の PR マージで Cloudflare がコードをデプロイする、の **2 経路が両方必要**。記事を追加したのにコードしかデプロイしないと「本番に記事が出ない」事故になる（2026-06-02 発生）。

> **CDN パージは公開 workflow に内蔵済 (2026-06-02)**: `blog-auto-publish.yml` は公開記事URL + `/blog` + ホーム + sitemap を**ピンポイントパージ**、`publish-affiliate-ads.yml` は**全ゾーンパージ**（バナーは全ページ埋め込みのため）。`purge-cache.ts --urls <絶対URL...>` で任意ページHTMLをパージ可能。手動パージは `/purge-cdn`。middleware/sitemap/robots/metadata 等コード由来の変更後は引き続き Step 8 で `/purge-cdn` を判定する。

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

#### develop 乖離 / 共有作業コピーの git race チェック（★必須）

複数セッションが同一作業コピー/.git を共有していると `develop` が origin と乖離していることがある（2026-06-01 実際に発生: 並行セッションが develop に blog をコミットし `git pull --ff-only` が失敗）。Step 3 で乖離した develop に merge すると、未検証の他作業を巻き込んでデプロイしてしまう。push 前に確認する:

```bash
git fetch origin develop main
git rev-list --left-right --count origin/develop...develop   # 乖離 (ahead behind) を確認
git status -s | grep -v "^??" | head             # 自分以外の tracked 変更が無いか
```

- **develop が origin と乖離** している / **並行セッションが develop に commit 中**（想定外の untracked/commit がある）場合は、**Step 3 の develop merge を行わず**、feature ブランチを **`origin/main` に rebase して `feature → main` の PR を直接作る**（`pr-quality-check.yml` は main 宛 PR で発火するため CI は走る）。これにより乖離 develop に触れずに自分の変更だけをクリーンにデプロイできる:

  ```bash
  git fetch origin main
  git rebase --onto origin/main <feature の分岐元 SHA> $CURRENT_BRANCH
  git push -u origin $CURRENT_BRANCH
  gh pr create --base main --head $CURRENT_BRANCH --title "…" --body "…"
  ```

  この場合デプロイ後に `develop` が `main` より遅れるので、別途 `main → develop` を取り込んで同期する（並行セッションが落ち着いてから）。
- develop が origin とクリーン（乖離なし・自分のみ）なら通常どおり Step 3 へ進む。

#### main 先行（hotfix 直行）チェック（★必須・2026-06-08 追加）

上の乖離チェックは「develop が origin/develop からズレているか」だけを見る。**hotfix が develop を経由せず main へ直行している場合、`main` が `develop` より先行して main/develop が分岐し、develop→main PR が重複コミット込みで巨大化・コンフリクト化する**（2026-06-08 発生: PR が 2955 ファイル diff に）。develop→main PR を作る前に必ず確認する:

```bash
git fetch origin main develop
git rev-list --count origin/develop..origin/main   # main が develop より先行している commit 数
```

- **0 なら** main は develop に内包済み → そのまま Step 3 へ。
- **>0 なら** main 先行＝分岐している。**先に `origin/main` を develop に取り込んで同期してから** develop→main PR を作る（これをしないと PR が巨大化する）:

  ```bash
  git switch develop && git pull origin develop
  git merge origin/main --no-edit
  # コンフリクトは内容同一（hotfix と develop の重複）なら ours/theirs で解決:
  #   コード   → main(theirs) の lint 修正済み版を採用
  #   docs等   → develop(ours) の最新状態を採用
  git push origin develop
  ```

  詳細規約: `.claude/rules/branch-workflow.md` の「hotfix / main 直行を入れたら main → develop を即同期する」。

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

# 4. 再発防止ガード (.claude/scripts/lib/check-*.cjs — 検出時 exit 1 で停止)
node .claude/scripts/lib/check-published-drafts.cjs   # 公開済み記事の下書きが docs/21 に残っていないか
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

**ローカル**:

```bash
# CI 完了待ち (polling、最大 10 分)
gh pr checks <PR_NUMBER> --watch || true

# CI green を確認してマージ
gh pr merge <PR_NUMBER> --merge
```

**web / クラウド** (`gh` が無い。`curl` は使えない → 上記「実行環境の判定」):

- CI 状態: `mcp__github__pull_request_read` (method `get_status`) を数分おきに呼ぶ。
  `sleep` で待たない (前面 sleep は禁止・Monitor か次ターンで再確認する)。
- `failure` を見たら **`cancelled` でないか**必ず確認する (superseded の判定は前掲)。
- マージ: `mcp__github__merge_pull_request`。
- マージ後 Cloudflare Pages が自動デプロイをトリガー。
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
- Cloudflare デプロイ完了確認
  - ローカル: `gh run list --branch main --workflow "Deploy to Cloudflare Workers" --limit 1`
  - web / クラウド: `mcp__github__actions_list` (`list_workflow_runs` / `resource_id: deploy-workers.yml`) で
    main の最新 run の `head_sha` が今マージした SHA か・`conclusion` が `success` かを確認
- **post-deploy smoke の結果も確認する** (`post-deploy-smoke.yml`)。deploy success は
  「Worker が起動した」までしか意味せず、route が notFound を返していても success になる。
  smoke の代表 route (16 件) が緑で初めて「本番に出た」と言える

### Step 7.5: 本番 URL の実応答確認（★ranking 活性化 / URL 構造 / metric isActive 変更時は必須）

**「deploy success」は「本番に意図どおり反映された」を意味しない。** 本番アプリはコードだけでなく R2 snapshot や派生リスト（`KNOWN_RANKING_KEYS` / `all.json` 等）と整合して初めて意図どおり応答する。以下を含むデプロイは、main マージ + Cloudflare deploy success の後に **本番 URL の HTTP status を Googlebot UA で実測**し、意図（200 / 301 / 410）と一致するか確認する。

対象変更:
- ranking metric の `isActive` 変更 / `GONE_RANKING_KEYS`・`KNOWN_RANKING_KEYS` 等の編集
- middleware の 301 / 410 ルール / URL 構造変更

```bash
# 期待 status を意図と照合（公開したはずなら 200、消したはずなら 410）
curl -s -o /dev/null -w "%{http_code}\n" \
  -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  "https://stats47.jp/<path>"
# CDN キャッシュ疑いは ?cb=$(date +%s) を付けてオリジン Worker の応答を直接確認
```

不一致なら未完（例: ranking を `isActive:true` にしても `KNOWN_RANKING_KEYS` / R2 `all.json` 未反映だと middleware の `isGone || !isKnown` で 410 のまま）。ranking 公開の多段依存は memory `project_ranking_publish_pipeline_gap` / `.claude/todo/backlog.md`「122 metric (完全データ) の本番公開」参照。

### Step 8: Cloudflare Purge 自動実行の判定

以下のいずれかに該当する変更が含まれる場合、**`/purge-cdn` を Claude が自動実行**する（ダッシュボード操作不要）。

- `apps/web/src/middleware.ts` のルール追加・変更（特に 410 / 301 / noindex 分岐）
- `apps/web/src/app/**/page.tsx` の `generateMetadata` で `robots` / `canonical` を変更
- `apps/web/src/app/robots.ts` / `sitemap.ts` / `manifest.ts` の変更
- `apps/web/src/config/gone-*.ts` / `known-*.ts` / `legacy-category-keys.ts` への追加・削除
- `apps/web/src/lib/url-policy.ts` の変更（indexable 判定の SSOT。area / cityCategory / ranking 等）

**理由**: 本番の HTML 200 応答は `Cache-Control: s-maxage=86400` で Cloudflare エッジに最大 24 時間キャッシュされる。middleware ルール変更を即時反映するには Purge が必要。

実行: `/purge-cdn` スキル。影響範囲を 1 行で宣言してから実行。

> **purge は CI 専任 (ローカル token 無し)**: `.env.local` の Cloudflare purge token は CI 専任化で削除済。ローカルからは `gh workflow run purge-cdn.yml` (input 無し=全パージ / `-f prefix=app/ranking`=R2 prefix) で dispatch する。`purge-cdn.yml` に特定ページ URL の `--urls` input は無いため、ページ HTML をピンポイント purge したい場合も全パージになる。**410 応答は `s-maxage=604800` で最大 7 日**エッジキャッシュされるので、`GONE_RANKING_KEYS` 等の gone リスト変更後は purge 必須 (purge しないと旧 410 が残る)。

sitemap / middleware と無関係 (blog 記事追加のみ、バグ修正のみ等) の場合は Step 8 全体をスキップ。

## エラー時の方針

- テスト/型チェック/ESLint の失敗 → ユーザーに確認し、続行 or 中止を判断
- マージコンフリクト → **自動解決しない**。ユーザーに状況を報告し指示を仰ぐ
- push 失敗 → ユーザーに報告し、リトライ or 手動対応を相談
- CI 失敗 → 失敗 job のログを確認、修正コミットを feature に作って再 push、再度 develop merge → 既存 PR は自動再 CI
- いかなる場合も `--force` は使用しない
