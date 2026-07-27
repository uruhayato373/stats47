---
type: monthly-plan
month: 2026-07
date: 2026-07-12
status: active
focus_themes: ["ブログSEO拡充 (新規記事 月15-20本・topic-queue駆動)", "ai-content 生成完走 + CTR改修の効果実測"]
tags: []
---

# Monthly Plan 2026-07

> 月途中 (07-12) での導入。直近 3 週間は docs→.claude 運用 runbook 移設に集中し週次 cadence が停止していたため再開分として作成。

## 月
- **対象月**: 2026-07（2026-07-01 〜 2026-07-31）
- **含む ISO 週**: 2026-W27 〜 2026-W31
- **Sprint**: SEO 拡充フェーズ（需要ファースト・供給は制約でないと実証済）

## 予算前提（Pro 使用量）
- 重い実装（L タスク）は **週 1 テーマが上限**。cadence 停止中に運用基盤（topic-queue / remediation-queue / ai-content パイプライン）は整備済みのため、7 月は「基盤を回す」フェーズで L タスクは少ない。
- 方針: 重点 **2 テーマ**に集中。両テーブルとも実行エンジンが稼働済みなので、週次は「消化ペースの維持」が主。

## 前月の振り返り（2026-06）
| 領域 | 動き | 現況（backlog 実測） |
|---|---|---|
| ブログ品質是正 | W25 で 108 本フルリライト + 60 本 REVISE 解消 | remediation-queue: done 39 / pending 99 (must-fix 36)。ペース維持フェーズ |
| ランキング ai-content 再生成 | AICONTENT-02 が DBレス再建されパイプライン稼働 | 02_機能 AICONTENT-DBLESS-REBUILD: done 130 / 残 794。**役割は「完走」に変更** |
| AREA-PROFILE-FIX-01 | P1 bug | **effect/full 解消済 (2026-07-03 本番実測)**。慢性未達ではない |
| BLOG-WAVE effect 計測 | 4-5 週先送りだった | **判定完了 effect/none (2026-07-03)**。title reframe が既得 query 整合を崩した教訓を BLOG-SEO-TYPES-01 に反映済 |

## 現状サマリー（W27 メトリクス実測 2026-07-06）
| 指標 | 現在値 | 備考 |
|---|---|---|
| GSC clicks（28日 rolling）| 2,244 / +15.3% | 上昇基調継続（W23:1,349→W27:2,244）|
| GSC impressions | 80,868 / +9.8% | 平均順位 8.96 |
| GA4 Active Users | 1,700 / +11.1% | Sessions 2,022 / +11.3% |
| AdSense earnings | 128 / -7.9% | RPM 45.00 / -。PV は +9.4% |
| ブログ remediation-queue | done 39 / pending 99 (must-fix 36) | 是正エンジン稼働 |
| ブログ topic-queue（新規ネタ）| pending 164 / total 167 | B型偏重 (相関記事)。`/plan-article-queue` で払い出し |
| ai-content 完走 | done 130 / 残 794 | ローカル `npm run ai:gen` (haiku) が既定 |
| active NSM 実験 | 0 件 | experiments.json は EXP-001〜004 done・EXP-005 proposed のまま |

## 今月の重点テーマ（2 個）

### 重点1: ブログSEO拡充（新規記事 月 15-20 本・topic-queue 駆動）
- **なぜ今月これか**: GSC 12週実測で「供給は制約でない、需要とCTRがボトルネック」と判明（competitor benchmark memory）。是正（床上げ）は W25 で一段落し、7 月は **需要ギャップを新規記事で埋める天井上げ**フェーズ。GSC clicks は上昇基調（+15.3%/W27）でブログが主エンジン。真実源 = BLOG-SEO-PACE-01（Tier1・due 2026-08-31）。
- **今月のゴール（月末に検証可能）**: ① topic-queue から **月 15-20 本**を公開（型配分 B 5 / D2 4 / A 3-4 / F 3 / G 1-2）、② remediation must-fix pending を **週 3 本ペース**で消化し月内 +12 本 done、③ BLOG-SEO-TYPES-01 の新型記事 4 週後 clicks を既存 A 型と比較（due 2026-08-02）。
- **構成タスク**:
  - 新規記事 週 4-5 本 ×4-5 週 [M×週] — `/plan-article-queue` で払い出し → article-writer → factual/quality-gate → blog-critic PASS → publish
  - ブログ品質是正 週 3 本 [M×週] — `/brushup-blog --target queue --next 3` → critic PASS → publish
  - 型ポートフォリオが B 偏重にならないよう D2/F/G を混ぜる [S]（topic-queue は型別上限で偏重防止済だが払い出し時に確認）
- **依存・ブロッカー**: なし（トレンド発見 trend-scout / 記事生成 article-writer / チャート chart-author が分業で稼働）。
- **真実源リンク**: `01_改善バックログ.md#BLOG-SEO-PACE-01` / `.claude/agents/blog-seo-strategist.md` / `.claude/state/blog/topic-queue.json`

### 重点2: ai-content 生成完走 + CTR 改修の効果実測
- **なぜ今月これか**: AICONTENT-DBLESS-REBUILD は done 130 / 残 794 で、ランキングページ（全体 PV の大半）の品質を底上げする最大レバー。かつ RANKING-CTR-01（第1バッチ 13本適用済・未公開）と BLOG-WAVE effect/none の教訓を活かした CTR 改修の効果実測が 7-8 月に集中する。生成だけで止めず「公開→実測」まで回す。
- **今月のゴール**: ① ai-content 完走を **週 15-30 件**進め done 130→250+、② RANKING-CTR-01 第1バッチ公開 → GSC 2-4 週後に対象13本の CTR before/after 実測（due 2026-08-08）、③ effect/pending の期日到来分（COVERAGE-LOOP-01 / INDEXING-AUTO-01 due 2026-07-14 等）を weekly-review で判定。
- **構成タスク**:
  - ai-content 完走バッチ [M×週] — `build-ai-content-queue.mjs --next 15` → `ai:verify` → ranking-content-author 並列 → diff-push-r2 → 再構築
  - RANKING-CTR-01 第1バッチ公開 + GSC 計測段取り [S]（reflect は R2→CDN purge、UI デプロイと独立）
  - effect/pending 判定（期日到来分）[S] — improvement-triage が effect/* を確定
- **依存・ブロッカー**: 生成はローカル CLI `npm run ai:gen`（haiku 既定・TOKEN-AICONTENT-01）。R2 push は publish-ai-content.yml 配線済。
- **真実源リンク**: `02_機能バックログ.md#AICONTENT-DBLESS-REBUILD` / `01_改善バックログ.md#RANKING-CTR-01` / `.claude/rules/ranking-content-standards.md`

## 今月やらないこと（予算のため意図的に見送る）
- **NSM 実験の本格起票・運用** — 4 週以上 propose すら空だが、SEO 拡充の効果が指標に出るまで experiments.json は空で許容。running 化は 8 月候補（Could で propose のみ可）。
- **SNS cadence の本格復帰（X/IG）** — sns-content-standards の量産実験（IG 1日3本）は別オーナー（各 strategist）に委任。本計画では追わない。
- **e-Stat 全展開（指標量産）** — 17万 metric 換算で thin-content リスク。SSDS 未使用 cdCat01 の列挙は素材整備のみ、量産は見送り（03_指標バックログ 2026-07-11 結論）。
- **GIS / テーマダッシュボード強化** — 重点 2 テーマ完遂が優先。

## 週への配分（ガイド・週次計画が詳細化）
| 週 | 主に進める重点 | マイルストーン |
|---|---|---|
| W27（済）| メトリクス自動生成のみ | cadence 停止中 |
| W28 | 重点1 再開（新規+是正）+ 重点2 ai-content | 新規 4-5 本・是正 3 本・ai-content +15。effect/pending 期日判定準備 |
| W29 | 重点1 定常 + 重点2 完走ペース | AICONTENT-02 due 2026-W29（残 794 の消化ペース確認）|
| W30 | 重点1 定常 + RANK-WAVE 計測 | RANK-WAVE-2026-06-12 GSC 4週後判定（W30）|
| W31 | 重点1 定常 + 月末振り返り | 月内 新規 +15-20 / 是正 +12 / ai-content done 250+ |

## 批判的レビュー
1. **重点が 3 つ以上になっていないか**: 2 テーマに限定。NSM・SNS・指標量産・GIS は明示的に見送り。✓
2. **先月と同じテーマでまた未達では**: 6 月の慢性未達 4 件（BLOG-WAVE計測 / AICONTENT-02 / AREA-PROFILE-FIX-01 / NSM）は **backlog 実測で全て解消 or 役割変更済**（下記）。7 月は「基盤を回す消化ペース」に主眼を移し、L 着手バリアを排除した。
3. **予算内で終わるか**: L タスクは無し（パイプラインは全て構築済）。週次は M の積み上げ（新規記事・是正・ai-content バッチ）に分散。予算内で現実的。✓

### 6 月慢性未達の現況（実証ベース・「未達」と書かない）
| 6 月時点の未達 | backlog 実測での現況 | 7 月での扱い |
|---|---|---|
| BLOG-WAVE effect 計測（4-5週先送り）| **判定完了 effect/none（2026-07-03）**。教訓は BLOG-SEO-TYPES-01 に反映 | 完了。新型記事で天井上げ（重点1）|
| AICONTENT-02（4週連続未達・L）| **役割変更**: AICONTENT-DBLESS-REBUILD として稼働（done 130/残 794）| 重点2「完走」に転記 |
| AREA-PROFILE-FIX-01（P1 bug）| **effect/full 解消済（本番実測 2026-07-03）** | クローズ。転記不要 |
| NSM 実験起票（4週空）| experiments.json は EXP-005 proposed のまま空 | 意図的に見送り（Could で propose のみ可）|

## 関連ドキュメント
- 収益化マスタープラン: `../02_実装計画/01_収益化マスタープラン.md`
- ブログSEO戦略: `../../.claude/agents/blog-seo-strategist.md`
- 改善バックログ: `01_改善バックログ.md`
- 機能バックログ: `02_機能バックログ.md`
- 指標バックログ: `03_指標バックログ.md`
- 今週の計画: `current-week.md`
