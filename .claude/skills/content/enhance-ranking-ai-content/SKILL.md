---
name: enhance-ranking-ai-content
description: >
  ranking_key ページ (/ranking/<key>) の ai_content (faq / regionalAnalysis / insights / prefectureCommentary)
  を NotebookLM (e-Stat 白書) と必要に応じ WebSearch で根拠補完しながらリライトする
  Orchestrator スキル。SEO 効果 (CTR / 平均掲載順位) 改善を目的とし、月 5-10 件上限・
  1 セッション 1 件・バッチ禁止の規約で運用。Use when user says
  "ranking ai content リライト", "ranking_key の AI コンテンツ補強",
  "NotebookLM で ranking ページ強化", "/enhance-ranking-ai-content".
disable-model-invocation: true
---

# /enhance-ranking-ai-content — ranking_key の ai_content を NotebookLM 補強でリライト

`/ranking/<rankingKey>` ページの `ai_content` フィールドを、NotebookLM 横断クエリで取得した白書由来の社会的背景・事例・歴史的文脈で補強しながら再生成する **aggregator orchestrator**。

**棲み分け**:
- 本スキル: **リライト専用** (`metrics.faq` 等が NOT NULL 前提)、NotebookLM 出典で内容深化
- `/generate-ai-content`: **初回生成専用** (NULL → 値、Claude/Gemini 並列、`--limit N --force`)
- `/notebooklm-research`: **公開済ブログ記事 (`article.md`) 補強専用** (対象が異なる)
- `/brushup-blog-article`: **GSC ベース seoTitle / description 改訂** (メタ改訂、内容深化とは別軸)

> **AI 生成感の回避**: NotebookLM の文言を **絶対に転記しない** こと。`buildRankingContentPrompt` の `extraContext` 引数経由で「言葉づかいの素材」として渡し、再構成させる。

## 前提条件

### NotebookLM CLI
- `~/bin/notebooklm` (notebooklm-py v0.4.1 以上)。初回認証は `notebooklm login`
- 詳細セットアップ: `.claude/skills/blog/notebooklm-research/SKILL.md`

### ラッパースクリプト
- `.claude/scripts/notebooklm-cross-query.mjs` (横断クエリ、`--json` 出力)
- 利用可能 notebook 4 件 (SKILL.md 「利用可能ノートブック」参照、stats47 では主に「最新の白書」)

### ai_content 関連の既存資源
- DB schema: `packages/database/src/schema/metrics.ts` (yearCode, faq, regionalAnalysis, insights, prefectureCommentary)
- 1 件更新: `packages/ai-content/src/repositories/upsert-ranking-ai-content.ts` → `upsertRankingAiContent()`
- prompt: `packages/ai-content/src/services/prompts/ranking-content-prompt.ts` → `buildRankingContentPrompt(input, { extraContext })`
- R2 export: `packages/ai-content/src/exporters/ranking-ai-content-snapshot.ts` → `exportRankingAiContentSnapshot()` (全件 16 並列、~2,000 ファイル/秒)
- R2 key: `app/ranking/<rankingKey>/ai-content.json`

### GSC 低 CTR 抽出
- `.claude/scripts/gsc/extract-low-ctr-ranking-pages.mjs --format json` で候補リスト取得

## 引数

```
/enhance-ranking-ai-content <ranking_key> [--auto] [--dry-run]
```

| 引数 | 説明 |
|---|---|
| `<ranking_key>` | 対象 ranking_key (例: `wheat-flour-consumption-quantity`)。**単一指定のみ**、glob / 複数指定 / バッチ禁止 |
| `--auto` | 差分プレビュー後の承認ステップをスキップ (CI / Routine 用)。Step 6 の diff stdout 表示は維持 (review 余地確保) |
| `--dry-run` | DB / R2 を一切触らず、リライト案 diff の stdout 表示で終了。docs 追記もスキップ |

## 実行フロー

### Step 1: 現状取得

1. ローカル D1 から該当 `ranking_key` の metrics 行を SELECT (yearCode + faq + regionalAnalysis + insights + prefectureCommentary)
2. R2 `app/ranking/<rankingKey>/ai-content.json` も読み込む (diff 用 baseline)
3. faq / regionalAnalysis / insights が **NULL の場合は中断**、`/generate-ai-content --key <rankingKey>` を案内する

```bash
# 例
NODE_ENV=development NODE_OPTIONS='--conditions react-server' \
  npx tsx -e "
    import { getDrizzle } from '@stats47/database/server';
    import { metrics } from '@stats47/database/server';
    import { eq } from 'drizzle-orm';
    const db = await getDrizzle();
    const row = await db.select().from(metrics).where(eq(metrics.rankingKey, '<key>')).limit(1);
    console.log(JSON.stringify(row[0], null, 2));
  "
```

### Step 2: ranking メタと上位/下位 5 県の抽出

1. ranking_items / metrics から `rankingName` / `unit` を取得
2. 該当 yearCode の上位 5 / 下位 5 都道府県 + value を抽出
3. Step 3 の NotebookLM クエリに埋め込むため、サマリ文字列を用意

### Step 3: NotebookLM 横断クエリ (3 種類)

`notebooklm-cross-query.mjs` で「最新の白書」notebook に対し 3 クエリを順番に投げる:

```bash
# (a) 社会的背景・政策動向
node .claude/scripts/notebooklm-cross-query.mjs --json \
  --notebooks "最新の白書" \
  "「{rankingName}」の社会的背景・近年の政策動向を白書記述から教えてください。具体的な事例があれば 2-3 件併記してください。"

# (b) 上位県・下位県の地域特性
node .claude/scripts/notebooklm-cross-query.mjs --json \
  --notebooks "最新の白書" \
  "上位 5 県 ({top5}) と下位 5 県 ({bottom5}) の地域特性 (産業/人口/地理) を白書から整理してください。"

# (c) 自治体事例・取組
node .claude/scripts/notebooklm-cross-query.mjs --json \
  --notebooks "最新の白書" \
  "「{rankingName}」に関連する自治体施策・取組を 2-3 件、白書から教えてください。"
```

各 JSON 出力の `results[].response.answer` を Claude セッション側で読み取り、要約 → 後段の `extraContext` 用に整形。`references` (引用箇所) は出典記録用に保持。

### Step 4: (オプション) WebSearch 補完

白書で情報不足な場合のみ実行 (時事性ある ranking、例: 観光客数 / 出生率 / 半導体生産)。Claude セッションの WebSearch ツールで 1-2 件のみ補完。検索結果はサマリ化して `extraContext` に追記。

### Step 5: リライト案生成

`buildRankingContentPrompt(input, { extraContext: "..." })` で再生成プロンプトを構築 → Claude セッション側で実行 (or `npx tsx packages/ai-content/src/scripts/generate-parallel.ts` の wrapper)。

`extraContext` の組み立て方:
```
## NotebookLM (最新の白書) 出典

### 背景・政策動向
{Step 3 (a) の answer 要約 80-150 字、文体素材としての位置付け}

### 地域特性
{Step 3 (b) の answer 要約 80-150 字}

### 自治体事例
{Step 3 (c) の answer 要約 80-150 字}

### WebSearch 補完 (該当時のみ)
{Step 4 のサマリ 50-100 字}

### 出典
- NotebookLM notebook: 最新の白書 (2bf7f0dd-...)
- 引用箇所: {references から代表 2-3 件}
```

### Step 6: 差分プレビュー → 適用

1. 既存 metrics 行と新生成 JSON を field 単位で diff 表示 (stdout、unified diff or 段落単位)
2. `--dry-run` 時はここで終了
3. `--auto` でない場合はユーザー承認待ち (interactive)、承認後に進む
4. `upsertRankingAiContent({ rankingKey, yearCode, faq, regionalAnalysis, insights, prefectureCommentary })` で D1 UPDATE
5. `exportRankingAiContentSnapshot()` で R2 一括 export (~2,000 ファイル、~秒) → 該当 `app/ranking/<key>/ai-content.json` の timestamp 更新確認

```bash
# R2 timestamp 確認 (公開エンドポイント)
curl -I https://r2-public.stats47.jp/app/ranking/<rankingKey>/ai-content.json | grep -i last-modified
```

### Step 7: 改善ログに section append

`docs/05_改善ログ/ai-content.md` に新 section を append (id: `AICONTENT-NNN` 連番、due は today + 28d):

```markdown
## [AICONTENT-NNN] <ranking_key> ai_content リライト (NotebookLM 補強)

- **status**: pending
- **tier**: 2
- **target_metric**: ranking-ctr
- **owner**: claude
- **deployed_at**: YYYY-MM-DD (today)
- **due**: YYYY-MM-DD (today + 28d)
- **verification_command**: `node .claude/scripts/gsc/extract-low-ctr-ranking-pages.mjs --filter-key <ranking_key>`
- **related_pr**: #N

### 背景 (Before)
- W{week} CTR {x}% / position {y} / 業界平均 {avg}% (Backlinko 2023)

### 施策
- NotebookLM (最新の白書) で背景・事例補強、faq / regionalAnalysis / insights / prefectureCommentary をリライト
- NotebookLM 出典: 最新の白書 (2bf7f0dd-...)、引用 {N} 件

### 想定効果
- CTR {x}% → 業界平均 {avg}% (clicks +{N}/月)

### 検証
- 4 週後 (YYYY-MM-DD) に上記 verification_command で再抽出、業界平均到達なら effect/full、未達なら effect/partial
```

## 完了レポート

```
=== /enhance-ranking-ai-content: <ranking_key> 完了 ===
yearCode: YYYY
NotebookLM クエリ数: 3
WebSearch 補完: あり / なし
差分: faq +N字 / regionalAnalysis +N字 / insights +N字 / prefectureCommentary +N字
R2 PUT: app/ranking/<ranking_key>/ai-content.json (last-modified YYYY-MM-DDTHH:MM:SSZ)
改善ログ: docs/05_改善ログ/ai-content.md [AICONTENT-NNN]
検証期日: YYYY-MM-DD (4 週後)
```

## 規約

- **NotebookLM 文言の転記禁止**: `extraContext` は「言葉づかいの素材」、prompt 内でも「再構成必須」と明示済
- **提供データ優先**: 数値・順位は variable のまま、`extraContext` で上書きしない
- **1 セッション 1 件**: 引数は単一 ranking_key、glob / 複数指定 / バッチ実行は禁止
- **月 5-10 件上限**: AI 生成感の蓄積・GSC ノイズ回避のため上限を運用ルールとして設定
- **`--dry-run` 推奨**: 初回実行時は必ず `--dry-run` で diff を確認、納得後に再実行
- **main 直接 push 禁止**: develop 経由必須 (`.claude/rules/branch-workflow.md`)
- **frontmatter の `deployed_at` / `due` 更新**: Step 7 で必ず today / today+28d を埋める
- **出典明記**: `extraContext` に notebook 名 + 引用箇所要約を必ず含める

## 失敗時フォールバック

| エラー | 対応 |
|---|---|
| NotebookLM 認証切れ (exit 2) | ユーザーに `~/bin/notebooklm login` を案内し中断 |
| NotebookLM 応答空 | WebSearch のみで実行可だが `extraContext` 薄くなる旨を warning、続行可否をユーザー判断 |
| LLM 出力 JSON パース失敗 | 1 回 retry、再失敗で中断 (R2 / D1 触らず、Step 7 skip) |
| `--dry-run` で承認なし終了 | docs 追記もスキップ (副作用なし) |
| 既存 ai_content NULL | 中断、`/generate-ai-content --key <ranking_key>` を案内 |
| `prefectureCommentary.items` 47 件揃わない | 再 retry、再失敗で旧データのまま中断 (R2 / D1 触らず) |

## 既知の制約

- NotebookLM 1 クエリ ~30 秒 × 3 = 約 90 秒/件
- `exportRankingAiContentSnapshot` は全件 export (1 件更新でも 2,000 件 PUT)、所要 ~秒
- ISR キャッシュ (24h) があるため即時反映には個別 purge が必要 (`/purge-cdn` スキル参照)
- 効果 (CTR / position) は **4 週後の GSC snapshot** でないと判定不能 ([`evidence-based-judgment.md`](.claude/rules/evidence-based-judgment.md))

## 関連

- `/generate-ai-content` (初回生成、本スキルの前提)
- `/notebooklm-research` (公開済ブログ用、本スキルとは対象が異なる)
- `/brushup-blog-article` (GSC ベース seoTitle 改訂、メタ改訂で内容深化とは別軸)
- `/sync-snapshots --only ai-content` (Step 6 で個別 export しない選択肢)
- 改善ログ INDEX: `docs/05_改善ログ/INDEX.md`
- 効果判定ルール: `.claude/rules/evidence-based-judgment.md` (effect/* 付与前必読)
- GSC 抽出: `.claude/scripts/gsc/extract-low-ctr-ranking-pages.mjs`
- NotebookLM ラッパー: `.claude/scripts/notebooklm-cross-query.mjs`

## 完了条件

- [ ] 対象 `metrics` 行に新 faq / regionalAnalysis / insights / prefectureCommentary が UPDATE 済
- [ ] R2 `app/ranking/<ranking_key>/ai-content.json` の last-modified が更新済
- [ ] `docs/05_改善ログ/ai-content.md` に `[AICONTENT-NNN]` section が append 済 (status: pending, due 4 週後)
- [ ] commit メッセージで `<ranking_key>` を明示
- [ ] 改善ログ section に `verification_command` が埋まっており、4 週後に再実行で effect 判定可能
