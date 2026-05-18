---
type: improvement-log
metric: ai-content
created: 2026-05-18
updated: 2026-05-18
---

# AI コンテンツ改善ログ (ranking_key)

`/ranking/<rankingKey>` ページの `ai_content` (faq / regionalAnalysis / insights / prefectureCommentary) を NotebookLM 等で補強しリライトした施策の真実源。**append-only**、1 リライト = 1 section。

## 運用ルール

- 1 セッション 1 件 (バッチ禁止)、月 5-10 件上限
- 候補抽出: `node .claude/scripts/gsc/extract-low-ctr-ranking-pages.mjs --format markdown`
- リライト実行: `/enhance-ranking-ai-content <ranking_key>` skill (Step 1-7、`--dry-run` 推奨)
- 効果判定期日 (`due`): 施策デプロイから **4 週後**。期日に GSC 再抽出で effect/full | partial | none を判定
- 判定ルール: `.claude/rules/evidence-based-judgment.md` (effect/* 付与前必読)

## 関連

- スキル: `.claude/skills/content/enhance-ranking-ai-content/SKILL.md`
- 初回生成 (本ログ対象外): `/generate-ai-content` skill
- 改善ログ INDEX: `docs/05_改善ログ/INDEX.md`
- GSC 抽出スクリプト: `.claude/scripts/gsc/extract-low-ctr-ranking-pages.mjs`

---

<!-- 新規 section は ここから下に append。最新が上に来るよう逆順 (LIFO) で追記してもよい -->

## [AICONTENT-001] wheat-flour-consumption-quantity ai_content リライト (NotebookLM 補強)

- **status**: pending
- **tier**: 2
- **target_metric**: ranking-ctr
- **owner**: claude
- **deployed_at**: 2026-05-18
- **due**: 2026-06-15 (W24, 4 週後)
- **verification_command**: `node .claude/scripts/gsc/extract-low-ctr-ranking-pages.mjs --filter-key wheat-flour-consumption-quantity --format json`
- **related_pr**: (本 PR、後ほど number 反映)

### 背景 (Before)

W21 GSC pages snapshot 抽出 (`extract-low-ctr-ranking-pages.mjs`) で **TOP 1** に該当:

| 指標 | 値 |
|---|---|
| CTR | 0.76% |
| Position | 6 |
| Impressions | 1,054 |
| 業界平均 CTR (Backlinko 2023, position=6) | 4.9% |
| 期待 +Clicks/月 | +43.6 |

`metrics.prefecture_commentary` が NULL で、47 県個別解説が欠落 (faq/regionalAnalysis/insights は existing)。CTR が業界平均の約 15% にとどまっており、ページ価値の薄さが clicks 損失を生んでいると想定。

### 施策

`/enhance-ranking-ai-content wheat-flour-consumption-quantity` skill (Step 1-7) を実行:

1. NotebookLM 「最新の白書」notebook に 3 横断クエリ:
   - 食料消費の地域差・近年の動向 (経済財政白書由来)
   - 上位県・下位県の地域特性 (水産白書・観光白書由来)
   - 気候・観光・人口構成の食料消費への影響 (各種白書由来)
2. extraContext (~1,125 chars) を構築し `buildRankingContentPrompt(input, { extraContext })` に注入
3. faq / regionalAnalysis / insights / prefectureCommentary (47 県) を再生成し D1 metrics 行を UPDATE
4. `export-snapshot.ts` でローカル R2 配信 (1,947 files / 573ms)

### 変更後 (After, ローカル D1)

| field | Before chars | After chars |
|---|---|---|
| faq | 666 | 669 |
| regional_analysis | 904 | 722 |
| insights | 498 | 516 |
| **prefecture_commentary** | **NULL** | **6,224** |

prefecture_commentary 47 件が新規生成され、ページ下部の 47 県個別解説が初表示される。

### 想定効果

- CTR 0.76% → 業界平均 4.9% 到達想定: +43.6 clicks/月
- 47 県個別解説により dwell time / pages/session 改善も期待

### 本番反映

本 PR merge 後、別途 `/push-r2 --only app/ranking/wheat-flour-consumption-quantity/ai-content.json` または `/sync-snapshots --only ai-content` を実行して本番 R2 に反映。ISR キャッシュ 24h があるため即時反映には `/purge-cdn` 併用検討。

### 検証

4 週後 (2026-06-15) に上記 verification_command で再抽出し業界平均比で判定:

- CTR ≥ 業界平均 4.9% (= ≥ 51 clicks/月) → **effect/full**
- CTR ≥ 業界平均 × 0.8 = 3.9% (= ≥ 41 clicks/月) → **effect/partial**
- CTR < 業界平均 × 0.8 → **effect/none**、次施策検討 (seoTitle 改訂 or 構造的問題の調査)

判定ルール: `.claude/rules/evidence-based-judgment.md` 準拠。
