---
name: generate-ai-content
description: ランキングページ向け AI コンテンツ（考察・地域傾向・FAQ・県別解説）を R2 観測値から生成し、決定的ゲートを通して staging→R2 に反映する。Use when user says "AIコンテンツ生成", "FAQ生成", "ランキング分析生成".
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

## モデル運用ポリシー（★コストゲート・2026-08-30）

定期量産は **Gemini API 無料枠**、agent は例外是正に限定する。

| 役割 | 実行者 | 品質 / コスト契約 |
|---|---|---|
| author (日次) | `gemini-3.7-flash` API | structured JSON schema、既定 3件/日、並列 1 |
| 決定的ゲート | `audit-ai-content.mjs` | 数値捏造・括弧羅列・重複・欠落は blocker |
| critic (日次) | author と別リクエストの Gemini API | `PASS | REVISE`。REVISE は指摘付きで最大1回再生成 |
| 例外是正 | `ranking-content-author` + `ranking-content-critic` | 3回連続失敗の quarantine や高流入 key だけ |

`GEMINI_API_KEY` は**課金無効の専用 Google AI Studio project**から発行する。
コードはキーが有料 project に属するかを事前証明できないため、これは Secret 所有者の運用ゲート。
無料 tier のデータ利用条件を踏まえ、公開統計と公開用解説だけを送り、秘密・個人情報は入れない。

Claude Code/OAuth を使う自動生成は廃止のまま。過去に 5 件で $79〜$90、0 件で $87.31 を消費したため、
定期経路に戻さない。

## データソース（DBレス）

| 入力/出力 | 場所 |
|---|---|
| ランキング観測値（入力） | R2 `app/stats/<key>/values.json`（`listRankingValues` 経由） |
| ランキングメタ（入力） | R2 `app/ranking/<key>/item.json`（rankingName / unit / yearCode） |
| プロンプト構築 | `packages/ai-content/src/services/prompts/ranking-content-prompt.ts`（純関数） |
| 生成物の保存（出力） | staging `.local/r2/app/ranking/<key>/ai-content.json` → R2（r2-publisher が push） |

R2 読み取り env（認証不要）: `NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`

## パイプライン構成（`packages/ai-content/src/scripts/`）

| スクリプト | npm script | 役割 |
|---|---|---|
| `list-pending.ts` | `ai:list` | R2 active keys → missing / incomplete / complete を分類（ワークリスト） |
| `build-input.ts` | `ai:input -- <key>` | R2 → `RankingContentInput` + prompt 文字列（純 read） |
| `preflight-gemini.ts` | `ai:preflight` | 極小の structured 実生成でモデル・認証・quota を切り分け |
| `generate-parallel.ts` | `ai:gen -- [opts]` | Gemini API author → audit → Gemini critic → outbox/report。CLI は手動 fallback |

## クイックスタート

> **現在の日次正典**: `.github/workflows/ai-content-gemini-daily.yml` (07:15 JST、既定3件)。
> 件数は `.claude/state/metrics/ai-content/history.csv` で 7 run 以上を観測した後だけ見直す。

> **2026-08-21 当時の経緯**: 件数を決めるのは週次計画 (`.claude/todo/weekly.md` の Must) だった。月間目標は
> `.claude/todo/monthly.md` が持つ。日次 CI (`ai-content-generate-daily.yml`) は
> 2026-08-21 に削除した — 対話セッションと同じ Pro/Max 利用枠を食う一方で歩留まりが
> 08-19 に 0/5 ($87.31)、08-20 に 1/5 ($21.33) まで落ちたため。
> **当時は生成を対話セッションが行っていた**。現在の定期経路は Gemini API。

> Claude Code の Bash から `generate-parallel.ts` の claude CLI 子プロセスを起動しない。
> 大きい stdin が詰まるため、対話セッションでは agent 生成、端末では CLI、日次は workflow と経路を混在させない。

### 1. 対象把握

```bash
cd /Users/minamidaisuke/stats47
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:list --workspace=@stats47/ai-content
# 例: total 2093 | missing 1556 | incomplete 488 | complete 49
```

### 2. Gemini API 手動 dry-run / 少量実行

```bash
# API 課金なしの入力検証
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:gen --workspace=@stats47/ai-content -- \
  --model gemini-api --critic gemini-api --concurrency 1 --limit 3 --dry-run

# 実行は課金無効の専用キーでのみ行う
GEMINI_API_KEY=... npm run ai:gen --workspace=@stats47/ai-content -- \
  --model gemini-api --critic gemini-api --concurrency 1 --limit 3 --retries 1 --outbox
```

### 3. R2 反映（r2-publisher / diff-push-r2 に委譲）

```bash
# staging (.local/r2/app/ranking/<key>/ai-content.json) を R2 へ push
# → r2-publisher agent もしくは diff-push-r2 app/ranking
```

## generate-parallel.ts オプション

| オプション | デフォルト | 説明 |
|---|---|---|
| `--model` | `gemini-api` | 明示した手動 fallback に限り `claude-*` / `gemini` CLI も可 |
| `--critic` | `gemini-api` | 手動診断に限り `none` も可。公開候補では無効化しない |
| `--concurrency` | `1` | 無料 quota を守る直列実行 |
| `--limit N` | 全件 | 処理件数上限 |
| `--area` | `prefecture` | `prefecture` / `city` / `port` |
| `--force` | false | complete も含め全 active key を再生成 |
| `--keys k1,k2` | （pending 走査） | 対象 key を明示（pending 判定をスキップ） |
| `--out <dir>` | `.local/r2` | staging 出力 dir |
| `--dry-run` | false | **LLM を呼ばず** prompt 長と staging パスだけ出す（セッション内検証用・課金なし） |
| `--outbox` | false | git 公開 outbox へフラット書込（develop へ push 後に publisher を起動） |
| `--report <file>` | なし | 件数・成否・APIリクエスト・トークンの JSON report（本文なし） |

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

## 手動例外是正（quarantine / 高流入 key のみ）

以下は日次量産の代替ではない。Gemini 自動経路で 3 回失敗したキーや、公開優先度が高く
人手判断が必要なキーだけを対象にする。

1. **対象を出す。** quarantine state と GSC 優先度を確認し、明示キーだけを選ぶ。
2. **1 件ずつ author agent を foreground で起動**し、`data/ai-content-staging/<key>.json` を書かせる。
3. **機械の床を通す。** `node .claude/scripts/ai-content/audit-ai-content.mjs --file <path>`。
   blocker があれば同じ author に blocker と対象 field だけ渡して外科修正し、再実行する。
4. **critic を別コンテキストで回す** (batch ≤10 key。§critic の起動方法)。
   **★PASS を確認してから push する。** 自動経路は Gemini critic を機械強制するが、手動例外では
   agentの判定記録を作業証拠として確認する。
5. **push する。** develop へ push すると `publish-ai-content.yml` が push トリガーで発火し、
   R2 反映前に `audit-ai-content.mjs` を再実行する。発火しなければ
   `gh workflow run publish-ai-content.yml -f keys="<key>"` で明示 dispatch する。

**通過分だけ公開する。** 1 件落ちても残りを止めない。公開 0 件のときは「成功」と report しない。
連続で critic に落ちるキーは `record-generation-outcome.mjs` に記録すると
`build-ai-content-queue.mjs --next` が 3 回目から除外する。

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
   修正フィールドを渡して delta 起動 (全文・正典の再読なし)。quarantine の手動是正レビューも delta で行う。

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
- backlog: `.claude/todo/backlog.md` `[AICONTENT-DBLESS-REBUILD]`
