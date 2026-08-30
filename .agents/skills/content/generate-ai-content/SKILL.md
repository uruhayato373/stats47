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
> 担当 agent: `ranking-content-author`。品質ゲート: `.Codex/scripts/ai-content/audit-ai-content.mjs`。
> モデル選択とagent起動promptは `.Codex/rules/model-prompting.md` /
> `.Codex/rules/agent-output-contract.md` を正典とする。

## モデル運用ポリシー（★コストゲート・2026-08-30）

定期量産は **Gemini API 無料枠**、agent は例外是正に限定する。

| 役割 | 実行者 | 契約 |
|---|---|---|
| author | `gemini-3.7-flash` API | structured JSON、既定3件/日、並列1 |
| 決定的ゲート | `audit-ai-content.mjs` | blocker 0 のみ継続 |
| critic | author と別リクエストの Gemini API | PASS / REVISE。最大1回再生成 |
| 例外是正 | ranking-content-author / critic | quarantine や高流入 key だけ |

`GEMINI_API_KEY` は課金無効の専用 Google AI Studio project から発行する。
無料 tier へは公開統計と公開用解説だけを送り、秘密・個人情報を入れない。

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
| `preflight-gemini.ts` | `ai:preflight` | structured 実生成でモデル・認証・quota を切り分け |
| `generate-parallel.ts` | `ai:gen -- [opts]` | Gemini author → audit → Gemini critic → outbox/report |

## クイックスタート

> **日次量産の正典**は `.github/workflows/ai-content-gemini-daily.yml`。
> Gemini API で author → audit → 別リクエスト critic → publish dispatch まで実行する。

> Codex の Bash から `generate-parallel.ts` の Codex CLI 子プロセスを起動しない。
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

# 実行は課金無効の専用キーでのみ
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
| `--outbox` | false | git 公開 outbox へ書込 |
| `--report <file>` | なし | 成否・API request・token の JSON report |

## 手動で 1 件処理する場合（エージェント生成）

```bash
# 1) 入力 + prompt を取得
NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npm run ai:input --workspace=@stats47/ai-content -- <rankingKey> --prompt-only > /tmp/prompt-<key>.txt

# 2) prompt に従い JSON 生成（agent もしくは Codex CLI）→ /tmp/out-<key>.json
#    出力は AiContentSnapshotRow 形式（faq / prefectureCommentary は JSON 文字列、insights / regionalAnalysis は Markdown）

# 3) ★必ず決定的ゲート（blocker 0 を確認）
node .Codex/scripts/ai-content/audit-ai-content.mjs --file /tmp/out-<key>.json

# 4) blocker 0 なら staging に置く → r2-publisher が push
```

## ★公開経路は 2 つ。実行環境で選ぶ（間違えると生成物が公開に到達しない）

| 実行環境 | 置き場所 | 公開手段 |
|---|---|---|
| R2 creds あり（ローカル / CI） | `.local/r2/app/ranking/<key>/ai-content.json` | `diff-push-r2 --prefix app/ranking` |
| **creds なし（クラウド / Routine セッション）** | **`data/ai-content-staging/<key>.json`**（フラット） | develop へ push → `publish-ai-content.yml` が gate 再検証 → R2 → CDN purge → outbox 削除 |

**outbox はフラットな `<rankingKey>.json` でなければならない**。workflow の検出 glob が
`data/ai-content-staging/*.json` なので、`app/ranking/<key>/` の階層を作ると拾われない。

## Routine（日次 CI）

`ai-content-gemini-daily.yml` が次を一続きで実行する。

1. 全件キューを再構築し、needs-regen を `LIMIT` 件選ぶ (件数の SSOT は workflow。ここに数値を書かない)
2. R2観測値から対象別 prompt を決定的に準備する
3. Gemini API がauthor → audit → 独立 critic を回す
4. PASS 分だけ outbox へ書き、token / pass rate を metrics に記録する
5. develop へ push し、`publish-ai-content.yml` を明示 dispatch する

`GEMINI_API_KEY` 未登録、対象あり生成0件、push / dispatch 未確認は hard fail。
既定件数は3で、7 run 以上の quota 実測後にだけ見直す。

## 品質ゲート（必須）

`audit-ai-content.mjs` が検出する blocker（1 件でもあれば不採用）:
- **括弧内数値挿入**（`(42日)` 等。プロンプト全面禁止）
- **NG ワード**（ワースト / ベスト / 激減 / 急増 / 衝撃）
- **FAQ 推測表現**
- insights / prefectureCommentary 欠落

`generate-parallel.ts` はゲートを内部で自動実行し、blocker 持ちを `[REJECT]` して staging に書かない。
機械ゲート通過後の意味レビュー（重複・読者価値・トーン）は `ranking-content-critic` agent に依頼する。

### critic の起動方法 (★batch + compact + delta・2026-07-07 / TOKEN-AICONTENT-01)

per-key に critic agent を起動しない。以下の 3 点でセッション消費を抑える (正典: `.Codex/agents/ranking-content-critic.md`):

1. **batch 起動 (≤10 key / 1 agent)**: key リストを 1 度の Agent 起動で渡す (doc09 §5 の設計)。
   起動 prompt 冒頭に OUTPUT FORMAT (Template A: `Key | Section | Issue | Severity | Recommendation`、
   1 key 1 行以上) + BEHAVIOR CONTRACT (`agent-output-contract.md`「行動契約 (凝縮版)」) を固定する。
2. **compact 読み**: critic は R2 JSON を生読みせず jq で実コンテンツのみ取得 (critic agent 定義に
   コマンド記載。実測 -22%)。
3. **REVISE 再審査は `mode: delta`**: author が指摘フィールドのみ外科修正 → critic に前回指摘 +
   修正フィールドを渡して delta 起動 (全文・正典の再読なし)。quarantine の手動是正だけに使う。

## エラーハンドリング

- R2 fetch 失敗 / item・観測値なし → 該当 key を `[SKIP]`（クラッシュしない）
- JSON パースエラー → `[FAIL]`
- audit blocker → `[REJECT]`（staging に書かない）

## 参照

- 生成パイプライン: `packages/ai-content/src/scripts/{list-pending,build-input,generate-parallel}.ts`
- プロンプトテンプレート: `packages/ai-content/src/services/prompts/ranking-content-prompt.ts`（ゲートと同期）
- 決定的ゲート: `.Codex/scripts/ai-content/audit-ai-content.mjs`
- 型定義: `packages/ai-content/src/types/snapshot.ts`（`AiContentSnapshotRow`）
- 担当 agent: `.Codex/agents/ranking-content-author.md` / 意味レビュー: `ranking-content-critic`
- backlog: `.Codex/todo/backlog.md` `[AICONTENT-DBLESS-REBUILD]`
