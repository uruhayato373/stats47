---
name: project-blog-brushup-risk-2026-05-25
description: AI blog brushup (auto-brushup-batch skill) は 13% factual FAIL + 27% WARN を出す。factual cross-check は 2026-05-25 に実装完了 (article-factual-check.mjs 横断ライブラリ)。次は実測 detection rate の検証フェーズ
metadata:
  node_type: memory
  type: project
  originSessionId: 7a37b2b0-7d83-47c6-affb-f433e679fcb3
---

# blog brushup の隠れた品質リスク (2026-05-25 検証結果)

2026-05-25 に 62 記事を /auto-brushup-batch SKILL.md フロー (sonnet sub-agent × 5 案 framing + 4 軸採点 + quality-gate) で大量 rewrite。全件 critical review で発覚:

- **FAIL 8 件 (13%)**: 数値捏造・ランク不整合・rice-harvest 型構造破綻
- **WARN 17 件 (27%)**: 軽微 (rounding、rank swap、年次不一致)
- **PASS 37 件 (60%)**

致命的だった失敗パターン:
- 東京発電量を 42M MWh と書いた (実際 5.7M MWh、7 倍誤差)
- 「47 県中 15 県が 70% 未満」と書いた (実際 23 県)
- SVG chart で rank 4-5 の県名・値を fabricate (data に存在しない数字)
- ランク順序の swap (神奈川 vs 千葉、京都 vs 愛知 等)

## factual cross-check: 実装済 (2026-05-25 commit `3384681a` + `2972dc5d`)

`quality-gate.mjs` は形式チェックのみだった問題は **解消済み**。横断ライブラリ `article-factual-check.mjs` (480 行) として実装:

- `buildGroundTruth(dataDir)`: `data/*.json` を再帰スキャンして `{prefName: [{rank, value, label}]}` index 化
- `checkRankClaims`: 本文「沖縄...41位」forward pattern を ground truth と突合 → 不一致なら **blocker**
- `checkInverseRankClaims`: 本文「41位は沖縄」inverse pattern も照合
- `checkInlineSvgProvenance`: `<!-- data-source: -->` 注記なし inline SVG を **warning** (値の出所が trace 不能)
- `indexSvgTitles`: SVG `<title>` の "県：metric=値" も value index 化して補助検証
- `isPerCapitaArticle`: 「一人当たり」記事は derived ranking なので blocker → warning に降格
- `RANK_CONTEXT_SKIP`: 「乖離・転落・上昇」等の change 表現は absolute rank ではないので skip

quality-gate.mjs:164-169 から自動呼び出し。CLI 単独でも実行可:
```
node .claude/scripts/lib/article-factual-check.mjs <article-path>
```

利用 skill: `/auto-brushup-batch`, `/publish-article`, `/draft-from-trend` 等 (P0-P3 全実装、commit `2972dc5d`)。

## 未確定 / 次の検証

**[仮説]** 現状実装で 13% FAIL ケース (東京発電量 7 倍誤差等) は機械検出される。
**検証コマンド**: brushed 53 slug の中で当時 FAIL/WARN 判定された slug に factual-check を再走、検出 hit rate を測定
**検証期日**: 2026-06-08 (W23 中)
**期日後の判定**:
- FAIL ケースの 80%+ を blocker として検出 → effect/full
- 50-80% → effect/partial、検出漏れパターンを `RANK_CONTEXT_SKIP` 等の正規表現で追加カバー
- < 50% → 構造的限界、LLM-based verification step 追加検討

## How to apply (今後の brushup イテレーション)

- /auto-brushup-batch は既に factual gate が走る → 大量並列で再実行可能
- ただし **検出力の実測がまだ** なので、当面は **sample critical review (10-15% rate)** を併走させる
- WARN 17 slug は `history.entries[i].warn` に記録済、手動 fix candidate
- 8 FAIL slug は history.json から除外済 → 検出力検証後に再 brushup 可能

**関連**: [[feedback_evidence_based_judgment]] (実証ベース判定ルール)、`.claude/rules/evidence-based-judgment.md`、`.claude/skills/blog/auto-brushup-batch/SKILL.md`、`.claude/scripts/blog/quality-gate.mjs`、`.claude/scripts/lib/article-factual-check.mjs`
