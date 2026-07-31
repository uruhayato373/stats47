---
name: generate-ai-content
description: ランキングページ向け AI コンテンツ（考察・地域傾向・FAQ・県別解説）を R2 観測値から生成し、決定的ゲートを通して staging→R2 に反映する。Use when user says "AIコンテンツ生成", "FAQ生成", "ランキング分析生成". Claude並列/Gemini逐次選択可.
disable-model-invocation: true
primary_agent: ranking-content-author
---

# /generate-ai-content — ランキング AI コンテンツ生成（完全DBレス）

ランキング詳細ページ（`/ranking/<key>`）に載る AI 生成テキスト（`insights`=データの考察 /
`regionalAnalysis`=地域別の傾向 / `faq` / `prefectureCommentary`=県別解説）を生成し、
決定的ゲートを通して R2 `app/ranking/<key>/ai-content.json` に反映する。

> **2026-06-21 DBレス再構築済**。旧版は D1 (`ai_content` テーブル + 生成 CLI + D1→R2 exporter) に依存し
> commit `7569bd5c` "dbless Part D" で削除されていたが、**D1 非依存で再構築**した。D1 は一切使わない。
> 担当 agent: `ranking-content-author`。品質ゲート: `.claude/scripts/ai-content/audit-ai-content.mjs`。
> モデル選択とagent起動promptは `.claude/rules/model-prompting.md` /
> `.claude/rules/agent-output-contract.md` を正典とする。

## モデル運用ポリシー（★コストゲート・2026-07-03 確定）

トークン消費を抑えつつ高流入ページの品質を守る **2段 critic** 設計。正典:
`.claude/rules/model-prompting.md`。

| 役割 | モデル | 根拠 |
|---|---|---|
| **author**（生成・全件） | **`sonnet` 固定**（frontmatter `model: sonnet`） | 最大の消費源。決定的ゲートが客観フロアを握るため sonnet で十分 |
| ① 決定的ゲート `audit-ai-content.mjs` | — (スクリプト) | モデル非依存の砦（数値捏造 / 括弧羅列 / 重複） |
| critic tier-1（意味レビュー） | **`sonnet` 既定**（frontmatter） | ルーブリック審査は sonnet で足りる |
| critic tier-2（エスカレーション） | **`opus` 明示指定** | queue の `reviewTier:"opus"`（GSC流入**上位30件**）+ tier-1 が REVISE した件だけ |

**確実ゲート（公式仕様）**: subagent の model 解決順は `env > 起動時param > frontmatter > session`。
`ranking-content-author` は frontmatter に `model: sonnet` を持つので、**起動時に `model` を渡さなければ
必ず sonnet で走る**（param 省略が鉄則）。**author 起動時に `model: opus` を渡してはならない**（コストゲートの唯一の抜け穴）。
opus を使うのは tier-2 critic を高流入キーに明示起動するときだけ。

tier-2 対象キーは `build-ai-content-queue.mjs` が `remediation-queue.json` の各 needs entry に
`reviewTier`（上位30=`opus` / 他=`sonnet`）を機械付与し、`LATEST.md` の「review」列（🔴opus）で確認できる。

## データソース（DBレス）

| 入力/出力 | 場所 |
|---|---|
| ランキング観測値（入力） | R2 `app/stats/<key>/values.json`（`listRankingValues` 経由） |
| ランキングメタ（入力） | R2 `app/ranking/<key>/item.json`（rankingName / unit / yearCode） |
| プロンプト構築 | `packages/ai-content/src/services/prompts/ranking-content-prompt.ts`（純関数） |
| 生成物の保存（出力） | staging `.local/r2/app/ranking/<key>/ai-content.json` → R2（r2-publisher が push） |

R2 読み取り env（認証不要）: `NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`

## パイプライン構成（3 スクリプト・すべて `packages/ai-content/src/scripts/`）

| スクリプト | npm script | 役割 |
|---|---|---|
| `list-pending.ts` | `ai:list` | R2 active keys → missing / incomplete / complete を分類（ワークリスト） |
| `build-input.ts` | `ai:input -- <key>` | R2 → `RankingContentInput` + prompt 文字列（純 read） |
| `generate-parallel.ts` | `ai:gen -- [opts]` | buildInput → claude/gemini CLI 生成 → **audit ゲート** → staging 書込 |

## クイックスタート

> **重要**: `generate-parallel.ts` の生成（`--dry-run` 以外）は **Claude Code の外（ユーザーの端末）か CI で実行する**。
> claude CLI サブプロセスは Claude Code の Bash 内で stdin が ~3KB 以上だと詰まる制限があるため、セッション内では
> `--dry-run`（LLM を呼ばず prompt 長と staging パスだけ確認）で検証する。

> **実行経路の既定 (★トークン規律・2026-07-07 / TOKEN-AICONTENT-01)**: 量産生成は**ローカル CLI
> `npm run ai:gen` (haiku・セッション外) が既定**。セッション内の agent 生成は blocker 是正・少数 (≤5 key)
> の例外に限る (1 key で prompt ~4.9K chars + 出力 ~13K chars がセッションに積まれるため)。
> セッションの役割は「キュー管理 (`ai:list` / queue) + critic (batch) + 公開段取り」に限定する。

### 1. 対象把握

```bash
cd /Users/minamidaisuke/stats47
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:list --workspace=@stats47/ai-content
# 例: total 2093 | missing 1556 | incomplete 488 | complete 49
```

### 2. 生成（ユーザー端末 / CI）

```bash
# 未完を最初の 50 件だけ Claude 並列生成（audit ゲート通過分のみ staging へ）
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:gen --workspace=@stats47/ai-content -- \
  --model claude-haiku --concurrency 3 --limit 50 \
  >> /tmp/ai-content-gen.log 2>&1 &
tail -f /tmp/ai-content-gen.log
```

### 3. R2 反映（r2-publisher / diff-push-r2 に委譲）

```bash
# staging (.local/r2/app/ranking/<key>/ai-content.json) を R2 へ push
# → r2-publisher agent もしくは diff-push-r2 app/ranking
```

## generate-parallel.ts オプション

| オプション | デフォルト | 説明 |
|---|---|---|
| `--model` | `claude-haiku` | `claude-haiku` / `claude-sonnet` / `claude-opus` / `gemini` |
| `--concurrency` | `3` | 並列数 |
| `--limit N` | 全件 | 処理件数上限 |
| `--area` | `prefecture` | `prefecture` / `city` / `port` |
| `--force` | false | complete も含め全 active key を再生成 |
| `--keys k1,k2` | （pending 走査） | 対象 key を明示（pending 判定をスキップ） |
| `--out <dir>` | `.local/r2` | staging 出力 dir |
| `--dry-run` | false | **LLM を呼ばず** prompt 長と staging パスだけ出す（セッション内検証用・課金なし） |

## 手動で 1 件処理する場合（エージェント生成）

```bash
# 1) 入力 + prompt を取得
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:input --workspace=@stats47/ai-content -- <rankingKey> --prompt-only > /tmp/prompt-<key>.txt

# 2) prompt に従い JSON 生成（agent もしくは claude CLI）→ /tmp/out-<key>.json
#    出力は AiContentSnapshotRow 形式（faq / prefectureCommentary は JSON 文字列、insights / regionalAnalysis は Markdown）

# 3) ★必ず決定的ゲート（blocker 0 を確認）
node .claude/scripts/ai-content/audit-ai-content.mjs --file /tmp/out-<key>.json

# 4) blocker 0 なら staging に置く → r2-publisher が push
```

## ★公開経路は 2 つ。実行環境で選ぶ（間違えると生成物が公開に到達しない）

| 実行環境 | 置き場所 | 公開手段 |
|---|---|---|
| R2 creds あり（ローカル / CI） | `.local/r2/app/ranking/<key>/ai-content.json` | `diff-push-r2 --prefix app/ranking` |
| **creds なし（クラウド / Routine セッション）** | **`data/ai-content-staging/<key>.json`**（フラット） | develop へ push → `publish-ai-content.yml` が gate 再検証 → R2 → CDN purge → outbox 削除 |

**outbox はフラットな `<rankingKey>.json` でなければならない**。workflow の検出 glob が
`data/ai-content-staging/*.json` なので、`app/ranking/<key>/` の階層を作ると拾われない。

## Routine（日次セッション）での回し方

CI (`ai-content-generate-daily.yml`) がキューを更新して「今日の対象」を Issue に出すので、
セッションはその key リストを受けて以下を回す。**CI 側は LLM を呼ばない**（Actions の中で
LLM を呼ぶと Claude でも別課金になるため。正典 `.claude/rules/ranking-content-standards.md`）。

```bash
# 1) 今日の対象を取る（Issue と同じ並び。CI を待たずに自分で出すこともできる）
node .claude/scripts/ai-content/build-ai-content-queue.mjs --no-build --next 10

# 2) 各 key: prompt 取得 → agent が生成 → 決定的ゲート → outbox
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:input --workspace=@stats47/ai-content -- <key> --prompt-only
#   → ranking-content-author に書かせる（frontmatter の model: sonnet に任せ、model を渡さない）
node .claude/scripts/ai-content/audit-ai-content.mjs --file data/ai-content-staging/<key>.json

# 3) critic（≤10 key を 1 回の batch 起動でまとめて）→ REVISE は外科修正して delta 再審査

# 4) develop へ push（publish-ai-content.yml が gate 再検証して R2 まで運ぶ）
```

**ゲートは緩めない。** blocker が残る key はその日は出さず、次回のキューが拾う。
件数は**控えめに始めて実測する**（初回 10 件）。サブスクの利用上限が制約なので、
実際の消費を測ってから増やす。

## 品質ゲート（必須）

`audit-ai-content.mjs` が検出する blocker（1 件でもあれば不採用）:
- **括弧内数値挿入**（`(42日)` 等。プロンプト全面禁止）
- **NG ワード**（ワースト / ベスト / 激減 / 急増 / 衝撃）
- **FAQ 推測表現**
- insights / prefectureCommentary 欠落

`generate-parallel.ts` はゲートを内部で自動実行し、blocker 持ちを `[REJECT]` して staging に書かない。
機械ゲート通過後の意味レビュー（重複・読者価値・トーン）は `ranking-content-critic` agent に依頼する。

### critic の起動方法 (★batch + compact + delta・2026-07-07 / TOKEN-AICONTENT-01)

per-key に critic agent を起動しない。以下の 3 点でセッション消費を抑える (正典: `.claude/agents/ranking-content-critic.md`):

1. **batch 起動 (≤10 key / 1 agent)**: key リストを 1 度の Agent 起動で渡す (doc09 §5 の設計)。
   起動 prompt 冒頭に OUTPUT FORMAT (Template A: `Key | Section | Issue | Severity | Recommendation`、
   1 key 1 行以上) + BEHAVIOR CONTRACT (`agent-output-contract.md`「行動契約 (凝縮版)」) を固定する。
2. **compact 読み**: critic は R2 JSON を生読みせず jq で実コンテンツのみ取得 (critic agent 定義に
   コマンド記載。実測 -22%)。
3. **REVISE 再審査は `mode: delta`**: author が指摘フィールドのみ外科修正 → critic に前回指摘 +
   修正フィールドを渡して delta 起動 (全文・正典の再読なし)。tier-2 opus エスカレーションも delta で行う。

## エラーハンドリング

- R2 fetch 失敗 / item・観測値なし → 該当 key を `[SKIP]`（クラッシュしない）
- JSON パースエラー → `[FAIL]`
- audit blocker → `[REJECT]`（staging に書かない）

## 参照

- 生成パイプライン: `packages/ai-content/src/scripts/{list-pending,build-input,generate-parallel}.ts`
- プロンプトテンプレート: `packages/ai-content/src/services/prompts/ranking-content-prompt.ts`（ゲートと同期）
- 決定的ゲート: `.claude/scripts/ai-content/audit-ai-content.mjs`
- 型定義: `packages/ai-content/src/types/snapshot.ts`（`AiContentSnapshotRow`）
- 担当 agent: `.claude/agents/ranking-content-author.md` / 意味レビュー: `ranking-content-critic`
- backlog: `docs/todo/05_機能バックログ.md` `[AICONTENT-DBLESS-REBUILD]`
