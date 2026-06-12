---
type: implementation-plan
date: 2026-06-12
status: active
parent: monetization-master-plan.md
tags: [ranking, seo, gsc, content-quality, traffic-growth, p2]
---

# ランキングページ品質向上計画 (P2 実行計画)

## 0. 位置づけ

- 親: `docs/02_実装計画/monetization-master-plan.md` (収益化 SSOT)。本計画は SSOT の **P2「トラフィック成長」** のランキングページ側を具体化する従属計画。ゲート判定・WIP 制限・Agent 分業原則は SSOT に従う (本計画で独自に緩めない)。
- 狙い: GSC clicks のランキング寄与を **734/週 → 1,400/週 (W40、§7)** に引き上げる。P2 ゲート (サイト全体 4,000 clicks/週) はランキング + blog の合算で達成する。
- 原則 (SSOT 判断2 の教訓): **パイロット → 計測 → 量産** の順を厳守。effect 未確定の系統に新施策を積まない (WIP ≤ 5)。
- **P1 期間中の例外**: Wave R1 (パイロット 15 件) のみ P1 期間中 (W25-W26) に先行着手する。理由: GSC 計測に 4 週を要し、P1 (広告配置) とは独立した workstream のため。**量産 (R2/R3) は R1 の effect 実証 + P1 ゲート通過の両方が条件**。

## 1. 診断: 「品質」の中身は層で違う

GSC 表示のある /ranking URL は **835 / 総ランキングキー 2,120 (39.4%)**。60.6% は表示ゼロ。出典: 2026-W23 snapshot。

| 層 | 範囲 | 件数 | imp | CTR | pos | 問題の本質 |
|---|---|---|---|---|---|---|
| Head (Tier A) | imp≥200 & pos4-15 | 15 | 7,623 (全体34.7%) | 2.81% (最低) | 7.43 | 順位・CTR の問題 |
| Head (Tier B) | imp50-199 | 78 | 7,433 | 3.51% | 7.73 | 順位・CTR の問題 |
| Torso (Tier C) | imp10-49 | 241 | 5,126 | 3.36% | 7.57 | 露出の問題 |
| Torso (Tier D) | imp<10 | 501 | 1,816 | 4.90% | 6.89 | 露出の問題 |
| Zero | imp=0 | 1,285 | 0 | — | — | インデックス以前 |
| 410 | 本番 410 | 122 | 0 | — | — | 公開パイプライン未配線 |

- Tier A 上位例: public-phone-count (1,323imp / pos4.68)、fresh-udon-soba (924 / 8.17)、mayonnaise (903 / 6.75)、dairy-cattle (831 / 10.32)、natto (789 / 8.69)。
- **含意**: imp の 68% が Head (A+B 93件) に集中し、しかも CTR が最低。全 2,120 ページ一律の「品質向上」は誤り。**層別処方**にする。

## 2. コンテンツ仕様 — 「データ表」から「解説付きリファレンス」へ

1 ページあたりの固定セクション仕様。

| # | セクション | 字数目安 | データ源 | 新設 |
|---|---|---|---|---|
| 1 | リード文 | 120-200字 | values.json (1位/最下位/格差倍率) + curiosity gap 1 文 | — |
| 2 | **構造解釈** | **300-500字** | 地理・産業・歴史で「なぜこの分布か」を説明 (blog archetype A の分析視点を移植) | ★最重要 |
| 3 | 時系列ハイライト | 100-200字 | R2 `app/stats/<key>/values.json` 全年から「N年で◯倍」「順位逆転」抽出 | △ |
| 4 | 相関の言語化 | 100-150字 | `app/correlation/by-ranking-key/<key>.json` の上位相関 + 相関≠因果 caveat | △ |
| 5 | FAQ 6 Q&A | 既存 | `ai-content.json` (Q-DESIGN-01)。効果計測後に拡縮判断 | — |
| 6 | 定義・出典 | — | metric config `description`/`note` 整備 (`validate:config` 準拠) | — |

- **CTR 側 (title 不変)**: `metric-config-standards.md` 準拠で **title は正準名のまま** (年・注釈の焼き込みは lint error)。改修は `seoTitle` に curiosity gap パターン (なぜ/意外/倍率/vs)、`seoDescription` に緊張感セットアップ。
- **品質フロア (決定的 gate)**: ①数値 factual 照合 (本文の数値が R2 values と一致) ②構造解釈 ≥300字 ③NG ワードなし (`evidence-based-judgment.md`) ④ですます調 (`blog-quality-standards.md` 準拠)。

## 3. パイプライン再建 (AICONTENT-02) — 前提インフラ

> 現状: AI 解説文の再生成パイプラインは DB レス移行で削除済み・破損 (improvement-backlog AICONTENT-001 blocked、`enhance-ranking-ai-content` SKILL.md が D1 参照で stale)。再設計が前提インフラとなる。

DB レス準拠の新設計:

```
R2 values.json + correlation + metric config
  → Sonnet 生成
  → 決定的 factual gate (生成文中の数値を R2 実値と照合)
  → critic (Opus) 監査 → review.md
  → R2 app/ranking/<key>/ai-content.json (CI push)
```

- blog の `quality-gate.mjs` / blog-critic / `review.md` モデルを流用 (実装パターン再利用、drift 防止)。
- 実装: Opus 担当。スクリプト配置は `.claude/scripts/ranking/` (`skill-code-placement.md` 準拠)。
- R2 書き込みは CI 専用 (`r2-storage-design.md`)。生成は develop push → CI で R2 反映。

## 4. 層別実行計画 (Wave 方式)

Wave 命名は `blog-data-schema.md` の wave 規約準拠 (`RANK-WAVE-YYYY-MM-DD`)。各 wave は improvement-backlog に section 登録。

| Wave | 期間 | 対象 | 手法 | 監査 |
|---|---|---|---|---|
| R1 (パイロット) | W25-W26 | Tier A 15 件 | §2 仕様フル適用。Sonnet 執筆 → critic PASS | Fable 抜き打ち 5/15 |
| R2 (量産) | W30-W34 | Tier B 78 件 | Sonnet 並列・critic batch | Fable 1/3 |
| R3 (テンプレ) | W34- | Tier C 241 件 | 構造解釈は短縮版 200字 | 決定的 gate 中心 |

- **対照群 (R1)**: Tier B から類似 imp の 15 件を無改修で固定。4 週 GSC 計測 (改修群 vs 対照群の clicks/CTR/pos diff)。
- **判定ゲート (W30)**: 改修群の clicks リフトが **対照群比 +20% 以上** → R2 へ。未達 → 仮説再構築 (例: CTR 側 seoTitle のみ先行)。

並走施策 (コンテンツと独立・即時着手可):

| ID | 内容 | 担当 |
|---|---|---|
| 122-publish | 本番 410 の 122 metric 解消 (KNOWN/SITEMAP 再生成)。**SSOT P0 の既存施策 — 担当 Opus・重複登録しない** | Opus |
| RANK-LINK-01 | Zero-imp 1,285 件の internal link 強化 (category/theme/area 導線監査) | Sonnet |
| RANK-THIN-01 | **[仮説]** 観測年 1 年のみ等の thin metric は noindex 候補。**検証方法**: GSC index 率と thin 該当の相関を URL Inspection で確認。**検証期日**: 2026-W28 | Fable (基準策定) |

## 5. Agent 分業 (SSOT §7 準拠)

| 工程 | 担当 | 成果物 | 監査 |
|---|---|---|---|
| 仕様・基準設計 / サンプル監査 / effect 判定 | Fable | 仕様書・判定 | — |
| パイプライン実装・factual gate・critic 監査 | Opus | スクリプト・review.md | — |
| 解説文量産・GSC 集計・内部リンク監査 | Sonnet | ai-content.json・集計 | critic |
| 数値照合・文字数床・リンク数 | 決定的スクリプト | gate 結果 | (モデル不使用) |

- トークン原則: 1 ページ生成 = Sonnet 1 call + critic batch (10 件単位)。Fable は抜き打ち 1/3 のみ。

## 6. リスクと対処

| リスク | 対処 |
|---|---|
| AI 量産文の thin/doorway 判定 | パイロット 15 件で順位悪化も監視。下落時は即 rollback (R2 旧 ai-content 上書き push) |
| BLOG-WAVE と計測期間が重複し効果分離不能 | ranking と blog は URL 種別が違うため GSC page filter で分離。`page` に `/ranking/` を含むものだけ集計 |
| Q-DESIGN-01 (FAQ) と効果混線 | 対照群も FAQ を持つため、差分は §2 新設分 (構造解釈・時系列・相関) に帰着できる |
| CTR 改修の seoTitle が検索意図とズレ pos 下落 | Tier A は 1 件ずつ query レポート確認後に改修 (一括禁止) |

## 7. 数値目標と検証

| 指標 | 現状 | W30 (パイロット判定) | W40 | 検証コマンド |
|---|---|---|---|---|
| ranking clicks/週 | 734 | 15 件で +20% lift 実証 | 1,400 | `/fetch-gsc-data last28d page` + `/ranking/` filter |
| Tier A CTR | 2.81% | パイロット群で改善観測 | — | 同上 (CTR 列) |
| /ranking index 率 | 43% | — | 70% | URL Inspection API |
| 公開キー (410 解消) | 122 件 410 | — | 0 | Googlebot UA curl で 200 確認 |

- 効果計測: `measure-gsc-impact.mjs` の wave_id 駆動を ranking 用に拡張 (Opus)。before/after diff を improvement-log に upsert。

## 8. improvement-backlog への登録項目

| ID | 内容 | 担当 | 期日 |
|---|---|---|---|
| AICONTENT-02 | DB レス準拠の ai-content 再生成パイプライン再建 (factual gate + critic) | Opus | W25 |
| RANK-WAVE-2026-06-xx | Tier A 15 件パイロット (§2 フル適用 + 対照群) | Sonnet | W26 着手 / W30 判定 |
| RANK-LINK-01 | Zero-imp 1,285 件の内部リンク監査・強化 | Sonnet | W28 |
| RANK-THIN-01 | thin metric の noindex 判定基準策定 | Fable | W28 |

## 9. 改訂履歴

| 日付 | 変更 |
|---|---|
| 2026-06-12 | 初版。monetization-master-plan P2 の従属計画として作成 |
