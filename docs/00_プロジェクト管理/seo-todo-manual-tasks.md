---
type: manual-tasks
created: 2026-05-18
updated: 2026-05-18
status: pending-user-action
related_pr: [308, 310, 311, 312]
related_plan: docs/02_実装計画/seo-todo-unify-phase-1-3.md
---

# SEO TODO 手動作業マニュアル (W21 sprint 後)

W21 セッション (2026-05-18) で Phase 1+2+3 を全 deployed したが、以下 5 件は **agent では完結できず、ユーザー手動対応が必要**。各項目はコピペで即実行可能なコマンド付き。

## 進捗チェックリスト

- [ ] 1. NotebookLM CLI OAuth 認証 (5 分、要ブラウザ)
- [ ] 2. NotebookLM 用ノートブック作成 + ID 登録 (30 分、要 NotebookLM UI)
- [ ] 3. Anthropic Routine 手動登録 (10 分、要 claude.ai UI)
- [ ] 4. GitHub Secrets `ANTHROPIC_API_KEY` 追加 (3 分、要 GitHub UI)
- [ ] 5. (任意) Phase 3 動作検証 (15 分、ローカル CLI)

完了したらチェックを入れて commit。

---

## 1. NotebookLM CLI OAuth 認証

`/notebooklm-research` skill を使えるようにする初回認証。Mac 環境では本セッションで CLI install 完了済 (`~/.notebooklm-venv` + `~/bin/notebooklm`、`notebooklm-py 0.4.1`)。

```bash
# 認証 (ブラウザが開いて Google アカウント選択)
~/bin/notebooklm login

# 確認 (認証後にノートブック一覧が出る)
~/bin/notebooklm list --json | jq '.[] | {title, id}' | head -10
```

完了確認: `~/.notebooklm/profiles/default/storage_state.json` が作成される。

---

## 2. NotebookLM 用ノートブック作成 + ID 登録

stats47 用ノートブックを NotebookLM UI (https://notebooklm.google.com) で作成。

### 推奨ノートブック構成

| ノートブック名 | 推奨ソース |
|---|---|
| **stats47 e-Stat 白書** | 国民生活白書 / 厚生労働白書 / 環境白書 / 防災白書 / 交通安全白書 / 観光白書 (e-Stat PDF) |
| **stats47 過去ブログ記事** | `.local/r2/app/blog/*/article.md` の主要 50 本 (PDF/DOC 化が必要) |
| **stats47 都道府県基礎データ** | 政府統計年鑑 / 都道府県統計協議会 / RESAS PDF |

### 作成後

```bash
# ID 取得
~/bin/notebooklm list --json | jq '.[] | {title, id}'

# 取得した ID を SKILL.md の「利用可能ノートブック」表に追記
$EDITOR .claude/skills/blog/notebooklm-research/SKILL.md
# → "利用可能ノートブック" section の表に行追加:
#   | stats47 e-Stat 白書 | <id> | 5 管理の定義・背景 |
```

(任意・高度) bulk-add で複数 PDF を一括投入:

```bash
# manifest.json 作成 (例)
cat > /tmp/notebook-manifest.json <<'EOF'
[
  { "file": "/path/to/e-stat-1.pdf", "title": "国民生活白書 2024" },
  { "file": "/path/to/e-stat-2.pdf", "title": "厚生労働白書 2024" }
]
EOF

node .claude/scripts/notebooklm-notebook-builder.mjs bulk-add \
  --notebook "stats47 e-Stat 白書" \
  --manifest /tmp/notebook-manifest.json \
  --skip-existing
```

---

## 3. Anthropic Routine 手動登録

Phase 3 の `stats47-daily-trend-pipeline` Routine を Anthropic 側に登録。`RemoteTrigger` create API は v1→v2 translate で失敗するため (req_011Cb9zha6bwTTJdUDUcnZTF)、**claude.ai UI から登録が必須**。

### 手順

1. https://claude.ai/code/triggers にアクセス
2. 「New Trigger」または「+ 作成」ボタン
3. 以下を入力:

| Field | Value |
|---|---|
| Name | `stats47 daily trend pipeline` |
| Cron | `0 0 * * *` (毎日 0:00 UTC = 9:00 JST) |
| Repository | `https://github.com/uruhayato373/stats47` |
| Model | `claude-opus-4-7` (or `claude-sonnet-4-6`) |
| Allowed tools | `Agent, Bash, Read, Write, Edit, Glob, Grep, TodoWrite` |
| Persist session | `false` |
| Enabled | ✓ (有効化) |

### プロンプト本文 (コピペ用)

```
stats47 daily trend pipeline を実行してください (Phase 3 半自動公開)。

## 前提
- 関連 plan: docs/02_実装計画/seo-todo-unify-phase-1-3.md Phase 3
- orchestrator skill: .claude/skills/blog/draft-from-trend/SKILL.md
- 1 回の実行で 1 記事のみ (バッチ化禁止)
- PR は draft 必須 (人手 GATE 1 レビュー = E-E-A-T / 独自性)
- 月 5-7 本ペース上限

## 手順
1. `git fetch origin && git checkout develop && git pull origin develop`
2. `ls -t .claude/skills/blog/trends-snapshots/*.md | head -1` で最新 snapshot 取得
3. snapshot からマッチ度 ★★★ かつ urgency=high を 1 件選ぶ。該当なしなら `[skip] no high-priority trend` と出して exit 0
4. `/draft-from-trend` skill を読んで順番に実行:
   - `/plan-blog-trends` で docs/20_/backlog/trends-YYYY-MM-DD.md に企画追記、slug 確定
   - `node .claude/scripts/blog/fetch-article-data.mjs --slug <slug>` で data JSON 配置
   - article.md 雛形生成 (frontmatter + H2 8-12 + chart placeholder)
   - `node .claude/scripts/blog/generate-article-charts.mjs --slug <slug>` で SVG 生成
5. `feature/trend-auto-YYYY-MM-DD-<slug>` branch 作成 → commit → push
6. `gh pr create --base develop --draft --label trend-auto --title "[auto-draft] <slug>" --body <PR body>`
7. 完了報告: PR URL 出力

## 失敗時
- `[Trend Pipeline Error] YYYY-MM-DD` Issue を起票 (label: `trend-auto, auto-generated`)
- エラー詳細 + 該当 step + 復旧手順候補を記載
```

### 登録後

取得した trigger ID を `.claude/state/triggers.json` の `id` フィールドに反映 (現在は `trig_seo_phase3_trend_pipeline_pending_registration` 仮 ID)。

```bash
# 例: Anthropic 側 ID が trig_01XXX の場合
$EDITOR .claude/state/triggers.json
# → "id": "trig_seo_phase3_trend_pipeline_pending_registration" を
#   "id": "trig_01XXX" に変更
# → "anthropic_registration_status": "pending_manual" を削除
# → notes から「Anthropic 側登録は手動で...」も削除
```

---

## 4. GitHub Secrets `ANTHROPIC_API_KEY` 追加

Sprint 5 (LLM 改修案 PR 起票 workflow) が require。`cwv-improvement-pr-weekly.yml` 実行時に Claude API 呼び出すため。

### 手順

1. https://console.anthropic.com/settings/keys で API key を取得 (or 既存 key を使う)
2. https://github.com/uruhayato373/stats47/settings/secrets/actions にアクセス
3. 「New repository secret」をクリック
4. Name: `ANTHROPIC_API_KEY`、Value: `sk-ant-api03-...` (取得した API key)
5. 「Add secret」

### gh CLI でも可能 (要 admin scope)

```bash
gh secret set ANTHROPIC_API_KEY --body "sk-ant-api03-..."

# 確認
gh secret list | grep ANTHROPIC_API_KEY
```

---

## 5. (任意) Phase 3 動作検証

W22 (5/25-31) の自動 fire を待たず、ローカルで dry-run 動作確認したい場合。

```bash
# scan-pending-improvements (Phase 1)
node .claude/scripts/lib/scan-pending-improvements.mjs --format markdown | head -10

# triage-matrix (Phase 2)
node .claude/scripts/lib/triage-matrix.mjs --format matrix

# auto-resubmit-url dry-run (Phase 2)
node .claude/scripts/gsc/auto-resubmit.mjs --dry-run

# extract-low-ctr-queries (Phase 3)
node .claude/scripts/gsc/extract-low-ctr-queries.mjs --format markdown | head -10

# suggest-cwv-candidates (Phase 3)
node .claude/scripts/psi/suggest-cwv-candidates.mjs \
  --url https://stats47.jp/ranking/area-population --max 5

# generate-cwv-pr dry-run (Sprint 5、ANTHROPIC_API_KEY 不要なら prompt 表示まで)
node .claude/scripts/psi/generate-cwv-pr.mjs \
  --url https://stats47.jp/ranking/area-population --dry-run

# fetch-article-data dry-run (Phase 3、既存 slug 必要)
node .claude/scripts/blog/fetch-article-data.mjs \
  --slug <既存 slug> --dry-run
```

すべて exit 0 で完了すれば本番動作も問題なし。

---

## 完了条件

5 項目すべてのチェックボックスを ☑ にして、本ファイルを commit すれば W21 SEO TODO sprint は完全終了。

```bash
git add docs/00_プロジェクト管理/seo-todo-manual-tasks.md
git commit -m "docs(seo-todo): 手動作業完了マーク"
git push origin develop
# → 必要なら develop → main PR でも反映
```

## 関連ドキュメント

- 全体プラン: `docs/02_実装計画/seo-todo-unify-phase-1-3.md`
- 改善ログ INDEX: `docs/05_改善ログ/INDEX.md`
- 自動化インベントリ: `docs/01_技術設計/10_自動化インベントリ.md`
- triggers.json: `.claude/state/triggers.json`
- NotebookLM skill: `.claude/skills/blog/notebooklm-research/SKILL.md`
