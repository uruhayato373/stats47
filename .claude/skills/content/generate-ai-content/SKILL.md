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

## データソース（DBレス）

| 入力/出力 | 場所 |
|---|---|
| ランキング観測値（入力） | R2 `app/stats/<key>/values.json`（`listRankingValues` 経由） |
| ランキングメタ（入力） | R2 `app/ranking/<key>/item.json`（rankingName / unit / yearCode） |
| プロンプト構築 | `packages/ai-content/src/services/prompts/ranking-content-prompt.ts`（純関数） |
| 生成物の保存（出力） | staging `.local/ai-content-staging/app/ranking/<key>/ai-content.json` → R2（r2-publisher が push） |

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
# staging (.local/ai-content-staging/app/ranking/<key>/ai-content.json) を R2 へ push
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
| `--out <dir>` | `.local/ai-content-staging` | staging 出力 dir |
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

## 品質ゲート（必須）

`audit-ai-content.mjs` が検出する blocker（1 件でもあれば不採用）:
- **括弧内数値挿入**（`(42日)` 等。プロンプト全面禁止）
- **NG ワード**（ワースト / ベスト / 激減 / 急増 / 衝撃）
- **FAQ 推測表現**
- insights / prefectureCommentary 欠落

`generate-parallel.ts` はゲートを内部で自動実行し、blocker 持ちを `[REJECT]` して staging に書かない。
機械ゲート通過後の意味レビュー（重複・読者価値・トーン）は `ranking-content-critic` agent に依頼する。

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
- backlog: `docs/02_実装計画/04_機能バックログ.md` `[AICONTENT-DBLESS-REBUILD]`
