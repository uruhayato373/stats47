---
type: improvement-log
metric: gsc
created: 2026-05-16
updated: 2026-06-02
---

# GSC 改善ログ

施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

## [Q-DESIGN-01] ranking/blog 問い設計の集客施策 (戦略 doc20 起点)

- **status**: pending
- **tier**: 1
- **target_metric**: gsc-ctr / gsc-clicks
- **owner**: claude
- **created**: 2026-06-02
- **due**: 2026-06-30 (R1-R3 デプロイ + 初回計測)
- **戦略根拠**: `docs/01_技術設計/20_ページタイプ×ファネル役割マップ.md` — 集客面 = ranking/blog に問い設計を寄せる
- **GSC 出典**: `.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W22/`

### 着手前に判明した実態 (方針を分岐させた根拠)

| 観察 | データ | 含意 |
|---|---|---|
| ranking 上位 impr が低 CTR・好位置 | `wheat-flour-consumption-quantity` 1,059 impr / CTR 0.57% / 順位 6.4、`-expenditure` 976 / 0.82% / 7.5 | **未着手の集客レバー。位置は良いのにタイトルで取り逃し** |
| 現行 seoTitle が数値羅列・NG パターン | quantity = 「三重3,072g vs 山梨1,284g 小麦粉消費量2.4倍差」、expenditure = 「…最下位山梨県で2.2倍格差」 | `blog-quality-standards` の NG (X倍格差/数値羅列)。検索語「うどん消費量ランキング」(244 impr) と語彙不一致 |
| ai-content 欠落ページ | `retail-establishments-by-prefecture` ai-content.json = **HTTP 404** (254 impr / CTR 0.39%) | FAQ/insights 不在 = PAA リッチリザルト取り逃し |
| 疑問形 PAA は勝ち筋だが取りこぼし | `一般病床の病床利用率が最も高い都道府県は？` CTR **8.3%** / 順位 3.55 ⇔ `療養病床の病床利用率が最も低い都道府県は？` CTR **0%** / 順位 9.1 | FAQ question を実測 PAA 文言に寄せれば snippet 獲得余地 |
| **blog 上位候補は既に brushup 済み** | temperature-extremes-map(2,754 impr/1.3%)・child-height-regional-gap(2,061/0.78%)・habitable-area-land-use(606/0.66%)・park-green-space-gap(360/0.56%) は auto-brushup-history に各 2 hit | **再 brushup は predecessor/successor 純粋効果分離を壊す。タイトルは最適化済でも CTR 低 = ボトルネックは位置 (順位 8-12) の可能性** |

→ **結論: 集客の greenfield レバーは ranking 側。blog は「再 brushup」でなく「既存波の効果計測が先」。**

### R (ranking) サブ施策 — 新規レバー

| ID | 施策 | 対象 | SSOT / 実装 |
|---|---|---|---|
| **R1** | seoTitle を問い設計化 (疑問形/curiosity gap + 実測クエリ語彙) | 高 impr×低 CTR ranking top20 (下記候補表) | `packages/data-configs/src/metrics/<key>.ts` の `seoTitle` 編集 → R2 反映 |
| **R2** | ai-content 欠落ページの再生成 (FAQ+insights 復活) | `retail-establishments-by-prefecture` 等 404 ページ | `/generate-ai-content` → `/push-r2 --prefix app/ranking` (CI) |
| **R3** | FAQ question を実測 PAA 文言に最適化 (「最も高い/低い都道府県は？」型を必ず1問) | FAQ 生成 prompt 全体 | `packages/ai-content/src/services/prompts/ranking-content-prompt.ts` |
| **R4** | seoTitle の full time-code 混入バグ修正 (`【2023100000年】`) | `disaster-damage-amount.ts` ほか | `npm run validate:years` で検出 → 4 桁修正 |

#### R1 候補 (2026-W22, impr≥80 & CTR<2%, impr 降順)

| rankingKey | impr | CTR | 順位 | 主な検索語 (queries.csv) |
|---|---:|---:|---:|---|
| wheat-flour-consumption-quantity | 1,059 | 0.57% | 6.4 | うどん消費量ランキング / 小麦粉消費量 都道府県 |
| wheat-flour-consumption-expenditure | 976 | 0.82% | 7.5 | 小麦粉消費量 ランキング |
| retail-establishments-by-prefecture | 254 | 0.39% | 8.5 | (R2 で ai-content 復活も併せて) |
| potato-consumption-quantity | 206 | 1.94% | 6.2 | じゃがいも消費量 |
| total-fertility-rate | 188 | 1.06% | 12.0 | 合計特殊出生率 (※順位改善も要) |
| residential-building-construction-cost | 184 | 0% | 9.7 | — |
| school-teacher-annual-income | 171 | 1.17% | 7.7 | 教員 年収 |
| squid-consumption-quantity | 164 | 1.83% | 7.7 | いか消費量 |

> R1 タイトル例 (quantity): 「三重3,072g vs 山梨1,284g…」→ **「小麦粉消費量ランキング都道府県｜うどん大国は本当に香川? 1位三重・最下位山梨【2024】」** 型。
> 先頭に検索語「小麦粉消費量ランキング」、curiosity gap (うどん大国の意外性) を併載。`blog-quality-standards.md` のタイトル基準を ranking にも適用。

### B (blog) サブ施策 — 計測駆動 (再 brushup 禁止)

| ID | 施策 | 根拠 |
|---|---|---|
| **B1** | 既存 brushup 波 (2026-05-25-auto / 05-28 / 05-29) の **effect 計測を先行** | 上位 blog 候補は全て brushup 済。再施策の前に eff果を確定しないと純粋効果分離不能 (`blog-data-schema.md`) |
| **B2** | 計測後、CTR が想定 80% 未満かつ順位 8-12 の記事は **タイトルでなく順位レバー** (内部リンク・深掘り・freshness) を検討 | タイトル最適化済で CTR 低 = ボトルネックは位置という仮説 |
| **B3** | 未 brushup の高 impr×低 CTR 記事のみ `/brushup-blog --target article` | 重複計上回避。`auto-brushup-history.json` で dedup 確認後 |

### 想定効果 (実証ベース・過大評価しない)

- **[根拠ある参照値]** 疑問形 PAA で好位置のページは CTR 8.3% を実測 (`一般病床の病床利用率が最も高い都道府県は？`)。ranking 好位置ページの CTR 上限の参照値とする。
- **[仮説]** R1 で wheat-flour 2 ページ (計 2,035 impr) の CTR を 0.7% → 3% に引上げ → 約 +47 clicks/週。**検証期日 2026-06-30**、未達なら順位/intent 不一致を疑い queries.csv で着地クエリ再確認。
- 数値はあくまで仮説。effect/* ラベルは計測 (下記コマンド) 後に付与する。

### 検証コマンド

```bash
# 着地クエリ確認 (タイトルが intent と合っているか)
/fetch-gsc-data last28d query snapshot 2026-Www   # 対象 rankingKey の流入クエリを確認
# ai-content 欠落の網羅監査 (R2 公開 URL)
for k in <rankingKey...>; do curl -s -o /dev/null -w "%{http_code} $k\n" \
  https://storage.stats47.jp/app/ranking/$k/ai-content.json; done
# seoTitle year lint
npm run validate:years --workspace=@stats47/data-configs
```

### 🚧 ブロッカー (2026-06-02 着手中に発見) — R0: config→item.json field-refresh が不在

**ranking ページが実際に描画する seoTitle/description は R2 `app/ranking/<key>/item.json` の値**で、
git TS config (`packages/data-configs/src/metrics/<key>.ts`) の編集は**現状 item.json に伝播しない**。

- 旧 monolith exporter (D1 metrics → item.json) は **Phase F (2026-05-30) で削除済**
- 現行 `exportRankingItemsPerUrl` (`packages/ranking/src/exporters/ranking-items-per-url-snapshot.ts`) は
  **既存 R2 item.json を読んで再グループ化するだけ** (コメント L38-40 が "config→item.json の field refresh は follow-up" と明記)
- `sync-metrics-cache.ts` は config → SQLite cache (seo_title 含む) までで、cache→item.json の書き戻しが無い
- **実証**: R2 item.json は今も汚染タイトルを保持 (curl 確認)
  ```
  app/ranking/disaster-damage-amount/item.json → seoTitle "…【2023100000年】…" (R4 未反映)
  app/ranking/wheat-flour-consumption-quantity/item.json → 旧 "三重3,072g vs…" (R1 未反映)
  ```

→ **影響**: R4 の 57 件 (汚染タイトルが現在 SERP に表示中) と R1 の編集は、**この refresh フローを作って CI で R2 push するまで本番に届かない**。

#### R0 (前提作業): config→item.json seo フィールド refresh exporter — ✅ 実装済 (2026-06-02)

| 項目 | 内容 |
|---|---|
| やること | `listAllMetrics()` の seoTitle/seoDescription を読み、各 `app/ranking/<key>/item.json` を patch (config 優先・未定義は既存温存)。他フィールドは verbatim 保持 |
| 実装 | `packages/ranking/src/exporters/ranking-item-seo-refresh.ts` (`refreshRankingItemSeoFields`) + CLI `packages/ranking/src/scripts/refresh-item-seo.ts` (dry-run 既定 / `--apply` / `--only`) |
| CI 配線 | `sync-snapshots` run.sh の TASKS に `item-seo-refresh` を **master の直後**に追加 (`--apply`)。master が .local/r2 に materialize → R0 が 59 件上書き → diff-push-r2 で反映 |
| 既存フロー調査 | populate/register スキルは不在。per-url exporter・export-master・listRankingItemsWithTagsFromR2 は全て R2 item.json の閉ループで config を読まないことを確認 → 新規 exporter が必要と確定 |
| dry-run 検証 | 全 2,209 metric で **patched=59 (R4の57+R1の2) / unchanged=2,146 / missing=4**。意図した範囲のみ検出を確認 (公開URL読取・無書込) |
| 本番反映 | `sync-snapshots.yml` を CI 実行 → diff-push 後 `curl …/app/ranking/<key>/item.json` で seoTitle が config 値と一致するか検証 (**未実行 = 次の手番**) |
| status | **実装済・CI 未実行**。merge 後に sync-snapshots を回せば R1/R4 が本番反映される |

### 次アクション (順序) — R0 ブロッカー反映後に更新

1. ✅ **R4 (config 修正 + lint 拡張)** — 57 件 seoTitle/desc の time-code 除去 + validator 拡張 (commit 済)
2. ✅ **R1 (top8 完了)** — wheat-flour 2 + retail/potato/total-fertility-rate/residential-building/school-teacher/squid の計 8 件を問い化 (commit 済)。R0 dry-run で 8/8 patched 確認
3. ✅ **R0 (config→item.json refresh exporter)** — 実装 + CI 配線 + dry-run 検証済 (commit 済)
4. ⏭ **develop merge → PR(main) → CI → sync-snapshots.yml 実行** — R0 で R1/R4 を本番反映 → curl で検証 (進行中)
5. R2 (retail 等 ai-content 再生成) + R3 (FAQ prompt PAA 化)
6. B1 (blog 既存波の effect 計測) — 06-20/06-26 期日に合わせる

### ⚠️ 派生で発見したデータ品質懸念 (要 follow-up)

- `school-teacher-annual-income`: 最下位 愛媛 315.7 万円 / 1位 愛知 885.9 万円 = 2.8 倍。**公立教員給与で 2.8 倍格差・年収 315 万は実態と乖離の疑い** (公務員給与は全国でほぼ均一)。R1 では sensational な「2.8倍」を seoTitle/desc から外して amplify を回避したが、**元データの検証が別途必要** (e-Stat 取得時の単位/集計ミスの可能性)。検証コマンド: `curl …/app/ranking/school-teacher-annual-income/values.json` で 47 県分布を確認。

## [BLOG-WAVE-2026-05-29-auto] GSC 改善余地上位 4 記事 auto-brushup (cloud session)

- **status**: pending
- **wave_id**: `2026-05-29-auto`
- **tier**: 1
- **target_metric**: blog-ctr
- **owner**: claude
- **deployed_at**: 2026-05-29
- **due**: 2026-06-26 (4 週後 effect 計測)
- **history_source**: `.claude/state/blog/auto-brushup-history.json` (wave_id="2026-05-29-auto", 4 entries)
- **環境注記**: cloud session (フル DB 不在)。tags は taggings テーブル管理のため all.json は全再生成せず、本番 all.json をベースに 4 記事の title/seoTitle/description のみ外科パッチ (tagMeta 131 件保持)。本文は R2 `app/blog/<slug>/article.md` を直接 push。

### 改修内容 (4 記事、全て quality-gate exit 0)

| slug | impressions | ctr_before | position | framing 採点 | 採用 framing |
|---|---|---|---|---|---|
| manufacturing-aichi-dominance | 858 | 0.58% | 8.69 | 37/40 | 総額王者・愛知 vs 効率王者・大分の逆転 |
| manufacturing-shipment-prefecture-ranking | 159 | 0% | 8.05 | 35/40 | 総額と効率で覇者が入れ替わる二系統構造 |
| agriculture-hokkaido-dominance | 103 | 0% | 9.33 | 35/40 | 農業王国の土地効率は下から3番目の逆説 |
| sewerage-water-supply-gap | 138 | 1.45% | 9.86 | 36/40 | 下水道22%でも水洗化77.5%で逆転 |

- 各記事 5 案 framing → 4 軸採点 (practical/structural/data_grounding/non_sensational) で best 選択、NG パターン (X倍格差 sensationalism 等) は採点で reject
- `manufacturing-shipment-prefecture-ranking` で実データ誤りも修正: 静岡 17兆→19.8兆、愛知/静岡 3.4倍→2.9倍、欠落していた大阪 (3位) を top5 に追加、「上位5県すべて太平洋ベルト」の歪曲を削除
- source-link 末尾集約違反 (shipment: tailRankingLinks=2) を H2 内分散で解消

### 想定効果

- 合計 expectedLift: **+105 clicks/週** (industry-avg CTR by position 計算ベース、select-brushup-candidates.mjs 算出)
- 主軸は manufacturing-aichi-dominance (858 imp / expectedLift 71)
- **検証コマンド**: 4 週後 (2026-06-26 頃) に `node .claude/scripts/blog/select-brushup-candidates.mjs` 起点の GSC snapshot で 4 slug の CTR を実測
- **判定基準**: 実測 CTR が想定の 80% 以上で effect/full、未達なら未達理由の仮説 + 次検証を記載 (参照: `.claude/rules/evidence-based-judgment.md`)

## [BLOG-WAVE-2026-05-28-manual] GSC 駆動 上位 4 記事 手動 brushup

- **status**: pending
- **wave_id**: `2026-05-28-manual`
- **tier**: 1
- **target_metric**: blog-ctr
- **owner**: claude
- **deployed_at**: 2026-05-28
- **due**: 2026-06-25 (4 週後 effect 計測)
- **predecessor_wave**: `2026-05-25-auto` (manufacturing-aichi-dominance は同 wave で生成された記事を本 wave で再 brushup)
- **selection**: `select-brushup-candidates.mjs` (GSC W21 × chart-audit × structure-audit 統合) の上位 4 件

### 改修対象 (4 記事、全て quality-gate pass)

| slug | imp | 改修前 CTR | 主な改修 |
|---|---|---|---|
| manufacturing-aichi-dominance | 858 | 0.58% | description を NG事実羅列→curiosity gap、callout 3 + 内部リンク 4 + データ出典 |
| manufacturing-shipment-prefecture-ranking | 159 | 0% | source-link 末尾集約解消 (図直下へ) + 関連記事/データ出典 |
| agriculture-hokkaido-dominance | 103 | 0% | callout + データ出典 section |
| sewerage-water-supply-gap | 138 | 1.5% | データ出典 heading 化 + callout + 本文補強 (上下水道の普及時期差) |

### 想定効果

- 合計 expectedLift: **+105 clicks/期** (select-brushup-candidates の expectedLift 合算: 71+19+11+4)
- 根拠: GSC 実測 imp × position 別 industry-avg CTR 改善 (curiosity gap で CTR 引き上げ)
- 観測: 4 週後 (2026-06-25 頃) GSC で実測。実測 CTR が想定の 70% 以上なら effect/full

### 検証コマンド (4 週後)

```bash
# 4 記事の CTR before/after を GSC snapshot で比較
for s in manufacturing-aichi-dominance manufacturing-shipment-prefecture-ranking agriculture-hokkaido-dominance sewerage-water-supply-gap; do
  grep "/blog/$s," .claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W2*/pages.csv
done
```

### 未対応 (Phase 8 backlog)

- **chart dark mode**: 4 記事とも SVG が dark mode 未対応。generate-article-charts が data 命名不一致で再生成不可 → SVG CSS 注入ツールが別途必要 (`docs/50_Issues/feature-backlog.md` Phase 8)
- **factual checker 単位バグ**: 「兆円」本文を per-employee「万円」data と比較し VALUE_MISMATCH 誤検知 (値は正しい)
- **記事重複**: manufacturing-aichi-dominance と manufacturing-shipment-prefecture-ranking がほぼ同トピック (要 dedup 検討)

## [BLOG-WAVE-2026-05-25-auto] curiosity gap auto-brushup 54 記事 (legacy: BLOG-CTR-06)

- **status**: pending
- **wave_id**: `2026-05-25-auto`
- **legacy_section_ids**: BLOG-CTR-06
- **tier**: 1
- **target_metric**: blog-ctr
- **owner**: claude
- **deployed_at**: 2026-05-25
- **due**: 2026-06-22 (4 週後 effect 計測)
- **predecessor_wave**: `2026-05-23-manual` (10 記事のうち 8 記事を本 wave で再上書き → 純粋効果分離不能)
- **history_source**: `.claude/state/blog/auto-brushup-history.json` (53 entries, wave_id="2026-05-25-auto")
- **session-handoff**: [`docs/04_レビュー/session-handoff/2026-05-25-blog-factual-check-system.md`](../04_レビュー/session-handoff/2026-05-25-blog-factual-check-system.md)

### 改修内容

- 62 記事を curiosity gap framing で rewrite (sonnet 4 並列 + 7 並列 batch)
- critical review で発覚した 8 件 (rank 不整合 / 数値捏造) を revert
- WARN 17 件 (軽微 factual error) を surgical edit で fix
- 最終: 54 記事適用 (37 PASS + 17 fixed WARN)

### 想定効果

- 合計 expectedLift: **+826 clicks/週** (industry-avg CTR by position 計算ベース)
- 月換算: **+3,550 clicks/月**
- 観測: 4 週後 (2026-06-22 頃) GSC で実測

### 副次的成果 — factual cross-check 横断 library 構築 (P0-P3 完全実装)

旧 quality-gate.mjs は形式 (callout / NG word) のみで factual error 検出不能だった。新 system:

- `.claude/scripts/lib/article-factual-check.mjs` (共有 library、433 行)
- 全 5 blog skill に factual gate 統合 (auto-brushup / publish-article / draft-from-trend / publish-bulk-articles / brushup-blog-article)
- `article-writer` agent に「data → 書く」絶対遵守ルール
- generate-article-charts.mjs で SVG provenance 埋め込み
- pre-commit hook で staged article.md 自動 cross-check
- failure ledger: `.claude/skills/blog/SHARED-failure-cases.md` (F-001〜F-004)

これにより今後の brushup / 新規記事生成では数値捏造が本番に届く経路を 4 重防壁で遮断。

### 検証コマンド (4 週後の effect 判定)

```bash
# 1. 4 週後 GSC snapshot 取得
/fetch-gsc-data last28d page snapshot 2026-W25

# 2. 該当 54 slug の CTR before/after を比較
node .claude/scripts/blog/measure-gsc-impact.mjs \
  --slugs-from .claude/state/blog/auto-brushup-history.json \
  --baseline-week 2026-W21 \
  --observation-week 2026-W25
```

### 判定基準 (`.claude/rules/evidence-based-judgment.md` 準拠)

- 実測 CTR ≥ 想定値 × 80% → effect/full
- 50% ≤ 実測 < 80% → effect/partial
- < 50% → effect/none
- baseline 悪化 → effect/adverse (該当記事を revert)

### 関連 commits

- `0fcc0190` Batch 1 (20 記事)
- `7ace00f1` Batch 2 (42 記事)
- `10c78eff` FAIL 8 件 revert + WARN 17 件 flag
- `3384681a` WARN 17 件 surgical fix + factual cross-check 追加 (P0)
- `2972dc5d` **P0-P3 完全実装** (library 切り出し + 全 skill 強化 + pre-commit hook + failure ledger)

## [SEO-TITLE-FIX-01] タイトル double-suffix バグ修正 (31 ページ)

- **status**: pending
- **tier**: 1
- **target_metric**: seo-ctr / all-pages
- **owner**: claude
- **deployed_at**: 2026-05-23
- **due**: 2026-06-20 (W25)
- **related_pr**: #334

### 背景

`generateMetadata` で title に「 | 統計で見る都道府県」を自前付加していたが、layout.tsx の root metadata が `template: "%s | 統計で見る都道府県"` を持つため、合計で suffix が **2 回**付いていた。

例 (修正前): 「企業・家計・経済 | 統計で見る都道府県 | 統計で見る都道府県」(60 文字超)

### 影響範囲

31 ファイル / 主要ページのほぼ全て:
- /category/[categoryKey] (17 カテゴリ)
- /themes/[theme] (17 テーマ)
- /survey, /survey/[surveyKey]
- /station-passengers, /station-passengers/[prefCode]
- /ports, /fishing-ports
- /gis-cross 系 4 ページ
- /about, /privacy, /terms

### 想定効果

- SERP で title が正常表示 (Google が truncate しなくなる)
- CTR 改善 (タイトルが意味不明な重複から、意図通りに見える)
- 影響 URL 数が多いため、全体平均 CTR の底上げが期待

実測 SERP 表示前後の確認は 2026-06-20 (W25) GSC snapshot で。

## [BLOG-CTR-05] Tier 3 brushup (3 記事) + /category description 差別化

- **status**: pending
- **tier**: 2
- **target_metric**: blog-ctr / category-ctr
- **owner**: claude
- **deployed_at**: 2026-05-23
- **due**: 2026-06-20

### Tier 3 ブログ brushup

| slug | imp | 旧 CTR | 改修ポイント |
|---|---|---|---|
| precipitation-snow-regional-gap | 191 | 0.52% | 「集中豪雨型 vs しとしと型」の真因を前面 |
| manufacturing-shipment-prefecture-ranking | 159 | 0.00% | 「総額1位は愛知だが1人当たり1位は大分」の対比 |
| foreign-residents-diversity-map | 127 | 0.79% | 「東京3.4% vs 秋田0.4%」+「製造業県上位」の意外 |

### /category description 差別化

17 カテゴリで同文だった description を、ranking count + sample title を動的に含める形に改修:

旧: `${category.categoryName}に関する都道府県別ランキング一覧。47都道府県を統計データで比較できます。`

新: `${category.categoryName}に関する都道府県別ランキング ${rankingCount} 件を掲載。${sampleTitles}など、47都道府県を比較・分析できます。`

これにより 17 カテゴリそれぞれが unique description を持ち、Google の duplicate content 判定リスクが解消される。

### 想定効果

- Tier 3 ブログ 3 記事: +10 clicks/週 (+40/月)
- /category 17 ページ: 全体的に SERP 露出向上、+20 clicks/週 (+80/月)
- 合計: +120 clicks/月

## [P0-RANKING-INDEX] /ranking インデックス率 43% → 70%+ 改善 (100x Phase 0 主軸)

- **status**: in-progress
- **tier**: 1
- **target_metric**: gsc-index-coverage / ranking-clicks
- **owner**: claude
- **deployed_at**: 2026-05-23 (Phase 1: 内部リンク + 診断)
- **due**: 2026-07-06
- **related_plan**: `docs/02_実装計画/100x-pv-strategy.md` Phase 0
- **related_pr**: feature/ranking-to-areas-internal-links
- **verification_command**: `awk -F',' 'NR>1 && $1 ~ /\/ranking\// {n++} END {print "ranking indexed: " n}' .claude/skills/analytics/gsc-improvement/reference/snapshots/<week>/pages.csv`

### 進捗 (2026-05-23, Phase 1 着手)

**診断結果**:
- sitemap /ranking URL 1,913 / GSC indexed 783 (40.9%)
- 未indexed 1,132 URL (`.claude/state/metrics/gsc/coverage-drilldown/2026-W21/ranking-unindexed-urls.csv` に集約)
- 未indexed URL のサンプル (aging-index, agricultural-output 等) は seoTitle/description が正常 → /areas のような壊れたメタデータではなく、**crawl budget × 内部リンク弱さ** が主因
- 未indexed URL の suffix パターン: consumption-expenditure 162, per-100k 58, per-1000 49, consumption-quantity 49, expenses-prefecture 32 (= niche derived metrics)

**Phase 1 デプロイ済 (2026-05-23)**:
1. RankingDataTable で都道府県名→/areas/{areaCode} 内部リンク (47 inbound/page × 783 indexed = ~37K internal links 追加)
2. 未indexed URL を CSV 化、Indexing API auto-resubmit の input として準備

**残作業 (Phase 2)**:
- INDEXING-AUTO-01 (`--execute`) で 1,132 URL を 200/日 × 6 日で submission
  ```
  node .claude/scripts/gsc/auto-resubmit.mjs \
    --input .claude/state/metrics/gsc/coverage-drilldown/2026-W21/ranking-unindexed-urls.csv \
    --execute --max 100
  ```
- /ranking 詳細から「関連ランキング」セクション (RelatedGroupCard を本文中段にも展開) の追加
- 4 週後の効果計測 (2026-W25 snapshot で indexed 数を再測)

### 背景

2026-W21 診断で判明: /ranking 詳細ページが sitemap に 1,913 URL あるが、GSC に impressions 出ているのは 821 URL のみ → **インデックス率 43%**。

clicks 576/週 (全体の 72%) を生んでいる主力ページ群なので、ここのインデックス率改善が Phase 0 最大のレバー。

### 施策

1. INDEXING-AUTO-01 と連携: 未 indexed の /ranking URL を優先送信対象に
2. 未 indexed URL の内容診断: 内容が薄いものは AI 補強 (NotebookLM など)、内部リンク不足のものはリンク追加
3. 構造化データ (BreadcrumbList, ItemList) の網羅確認
4. /ranking 詳細 → /areas/{prefCode}、/category/{key}、関連 ranking への内部リンク強化

### 想定効果

**[仮説]** indexed 821 → 1,300+ (70%+) になれば、1 URL あたり平均 0.7 click/週 を維持しても clicks +335/週 (+58%)。Phase 0 目標 ×1.5 の主要寄与施策。

**根拠**: /blog が 78% indexation を達成 (142/183) しているので、/ranking も同等まで持っていけるはず。差分は内部リンク密度と内容ボリュームと推測。

### 検証

- **検証期日**: 2026-07-06
- **期日後の判定**:
  - /ranking indexed ≥ 1,300 (70%+) → effect/full
  - 1,000-1,300 → effect/partial
  - < 1,000 → effect/none、次の検証: 個別ページ品質確認、低品質 URL の noindex 化検討

### NOT this施策

- 個別 URL の seoTitle 改修 → [CTR-AUTO-01] / [BLOG-CTR-02] 系
- sitemap 構造変更 → `indexing.md`

## [CTR-AUTO-01] CTR 改善候補の月次自動抽出 (Phase 3 sprint)

- **status**: in-progress
- **tier**: 2
- **target_metric**: blog-ctr / ranking-ctr
- **owner**: claude
- **deployed_at**: 2026-05-18
- **due**: 2026-06-21 (W25, 初回 fire 後の判定)
- **related_plan**: `docs/02_実装計画/seo-todo-unify-phase-1-3.md` Phase 3

### 進捗 (2026-05-18)

Phase 3 sprint で 2 ファイル追加:
- `.claude/scripts/gsc/extract-low-ctr-queries.mjs` — 業界平均 CTR (Backlinko 2023) と比較し position 5-15 帯の改善候補抽出
- `.github/workflows/ctr-improvement-monthly.yml` — 毎月 5 日 09:00 JST 自動 fire、`[CTR Improvement Candidates] YYYY-MM` Issue 起票

最新 W21 snapshot で動作確認: 8 候補抽出 (小麦粉消費量関連クエリが上位)、期待 +Clicks 計算正常。

### 残作業

- ラベル作成: `gh label create ctr-improvement-candidate --color FFA500 --description "CTR 改善候補 (月次自動抽出)"`
- 6/5 初回 fire 後、`[CTR Improvement Candidates] 2026-06` Issue を確認
- 上位 3 候補に `/brushup-blog-article` で seoTitle 改訂案を作成 (人手)

## [NOTE] 122 metric の本番公開保留 — GSC への含意 (2026-06-03)

- **status**: pending（施策効果判定ではなく将来影響の注記。effect ラベル対象外）
- **背景**: `feature/activate-122-ranking-metrics` で 122 ranking metric を `isActive:true` 化 + `GONE_RANKING_KEYS` から除去（PR #430/#431・デプロイ済）。だが `KNOWN_RANKING_KEYS` / R2 `app/ranking-items/all.json` 未反映で **本番は全件 410 のまま**（`middleware.ts:61` の `isGone || !isKnown` で 410）。
- **GSC への含意**:
  - 現状: 122 は gone から外れたが KNOWN にも無く 410 のまま = **GSC 上の挙動は従来どおりで変化なし**。「クロール済み未登録 /ranking 453」への `KNOWN_RANKING_KEYS` middleware 対策方針と矛盾しない。
  - 将来公開時（feature-backlog の「122 metric 本番公開」着手時）: /ranking のインデックス対象が 122 増える。**「クロール済み・インデックス未登録」再発（過去 1,453 件）のリスク**があるため、SITEMAP/INDEXABLE 反映と URL Inspection API での GSC モニタをセットにすること。
- **関連**: `docs/50_Issues/feature-backlog.md`「122 metric (完全データ) の本番公開」/ memory `project_ranking_publish_pipeline_gap` / session-handoff `docs/04_レビュー/session-handoff/2026-06-04-git-cleanup-deploy-122metric.md`
