---
type: improvement-backlog
created: 2026-06-06
updated: 2026-06-06
---

# 改善バックログ

SEO / 性能 / コスト / コンテンツ施策の TODO 一覧。旧 `docs/05_改善ログ/` から移行 (2026-06-06)。

検証コマンド・仮説・デプロイ詳細は `.claude/skills/analytics/<metric>-improvement/reference/improvement-log.md` を参照。

## Tier 1 (Must)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| AFF-01 | 在庫ベースライン棚卸し (2026-06-04) | effect/none | 2026-06-11 | claude | affiliate |
| INDEXING-AUTO-01 | Indexing API による問題 URL の自動再送信 (日次 200/day 稼働中) | effect/pending | 2026-06-20 | claude | indexing |
| SEO-TITLE-FIX-01 | タイトル double-suffix バグ修正 (31+3 ページ) | effect/pending | 2026-06-20 | claude | gsc |
| BLOG-WAVE-2026-05-25-auto | curiosity gap auto-brushup 53 記事 — deployed 2026-05-25。GSC 計測 4 週後 | effect/pending | 2026-06-22 | claude | gsc |
| BLOG-WAVE-2026-05-28-manual | GSC 駆動 上位 4 記事 手動 brushup — 全 4 記事 deployed (2026-06-06): dairy-cattle/habitable-area/food-trio/population-density。GSC 計測 4 週後 (2026-07-04) | effect/pending | 2026-07-04 | claude | gsc |
| BLOG-WAVE-2026-05-29-auto | GSC 改善余地上位 4 記事 auto-brushup — deployed 2026-05-29: manufacturing-aichi/manufacturing-shipment/agriculture-hokkaido/sewerage-water。GSC 計測 4 週後 | effect/pending | 2026-06-26 | claude | gsc |
| BLOG-WAVE-2026-06-07-manual | 是正キュー must-fix 上位 3 記事の品質是正 — deployed 2026-06-07: consumer-price-regional-gap(archetype D, 表3+inline svg→SVG3枚)/curry-roux-consumption-gap/doctor-income-prefecture-gap(表→上位5+下位5 SVG, 内部リンク補強, archetype A)。markdown表全廃+blog-critic PASS。GSC 計測 4 週後 | effect/pending | 2026-07-05 | claude | gsc |
| BLOG-WAVE-2026-06-07-manual-2 | 是正キュー 高流入 must-fix 3 記事の品質是正 — deployed 2026-06-07: price-index-high-low-prefecture(imp1003, 表2+inline svg→SVG2, 4象限→箇条書き, archetype D)/household-spending-prefecture-gap(imp635, findings図水増し除去, 散布図象限を実平均で補正)/local-government-debt-burden(imp536, source-link分散+データ出典追加, archetype B)。全 blog-critic PASS。GSC 計測 4 週後 | effect/pending | 2026-07-05 | claude | gsc |
| INDEXING-SITEMAP-02 | sitemap を「コンテンツ実体のある URL」に一致させ未登録を削減 — deployed 2026-06-06: KNOWN_RANKING_KEYS 追加で 948→2125 ranking URL (+1177)。GSC 計測 4-6 週後 | effect/pending | 2026-07-18 | claude | indexing |
| ADSENSE-RPM-01 | RPM ¥36 → ¥65 (Viewability 54%→70%+) — W23 実測 RPM ¥50 / Viewability 60.4%。deployed 2026-06-06: ranking sidebar 広告を先頭移動。GSC計測 4週後 | effect/pending | 2026-07-04 | claude | adsense |
| Q-DESIGN-01 | ranking/blog 問い設計の集客施策 (戦略 doc20 起点) — deployed 2026-06-07: FAQPage JSON-LD を全 /ranking ページに追加 (4Q&A: 1位/最下位/全国平均/格差)。PAA ボックス出現を GSC で計測 4 週後 | effect/pending | 2026-07-05 | claude | gsc |
| CWV-RANKING-LCP-01 | ranking mobile LCP — map tile preload を lg 以上に限定 — deployed (commit 1b09ae45): media="(min-width:1024px)" 適用済み。PSI 計測 4 週後 | effect/pending | 2026-07-01 | claude | psi |
| CWV-THEMES-CLS-01 | useSearchParams→useEffect 置換で ThemeDashboardTabbed Suspense fallback={null} CLS を除去 — deployed 2026-06-06 | effect/pending | 2026-07-01 | claude | psi |
| P0-RANKING-INDEX | /ranking インデックス率 43% → 70%+ 改善 (100x Phase 0 主軸) — KNOWN +128・all.json sync 完了(2026-06-06, active=2093)。sitemap は PR #447 デプロイ後に自動反映。GSC 計測は 4-6 週後 | effect/pending | 2026-07-06 | claude | gsc |
| P0-AREAS-01 | /areas/{prefCode} 47 ページの SEO 監査 + 内部リンク強化 — deployed 2026-06-06: AreaRelatedBlogArticles 追加 (strength/weakness rankingKey → tag → blog) + CategoryNavGrid の theme なし category → /category/{key} リンク修正。GSC 計測 4-6 週後 | effect/pending | 2026-07-18 | claude | indexing |

## Tier 2 (Should)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| GA4-BOT-02 | Cloudflare WAF rule で bot スキャナをブロック | pending | 2026-06-14 | uruhayato373 | ga4 |
| GA4-PIPELINE-01 | fetch-ga4-data snapshot に per-report try/catch を標準化 — deployed 2026-06-06 | effect/full | 2026-06-14 | claude | ga4 |
| AICONTENT-001 | wheat-flour-consumption-quantity ai_content リライト — **blocked**: DBless 移行で生成パイプライン削除済 (Phase D)。enhance-ranking-ai-content SKILL.md が D1 参照で stale。要パイプライン再設計 | pending | 2026-07-15 | claude | ai-content |
| BLOG-CTR-05 | Tier 3 brushup (3 記事) + /category description 差別化 — 全完了 (2026-06-06): child-height/manufacturing seoTitle + temperature-extremes-map full brushup + 17カテゴリ description (PR #448)。GSC 計測 4 週後 | effect/pending | 2026-06-20 | claude | gsc |
| AFF-02 | 広告ゼロ 8 軸の在庫補充 | pending | 2026-06-21 | uruhayato373 | affiliate |
| GA4-PIPELINE-02 | history.csv の pageviews をカレンダー週バケット + Japan-only に統一 — deployed 2026-06-06: fetch-ga4-snapshot に overview-clean.csv (Japan-only, calendar week) 追加、update-history-csv が preferする実装。W23 backfill済 (4264 pvs vs 旧17745)。W24〜が初の真値計測週 | effect/pending | 2026-07-12 | claude | ga4 |
| CTR-AUTO-01 | CTR 改善候補の月次自動抽出 (Phase 3 sprint) — 実装済み: ctr-improvement-monthly.yml (毎月5日 JST 09:00) + extract-low-ctr-queries.mjs。初回 Issue は 2026-07-05 に自動生成予定 | effect/pending | 2026-07-05 | claude | gsc |
| AFF-03 | ランキングページのバナー枠追加 (案 A 実装) | effect/pending | 2026-06-28 | claude | affiliate |
| CONTENT-DRAFT-01 | /draft-from-trend skill 実装 (Phase 2 → Phase 3 での稼働) — 実装完了: SKILL.md 6-step orchestrator (plan-blog-trends → fetch-article-data → article.md → generate-article-charts → factual-check)。初稼働は W24 以降 trend snapshot ★★★ 候補で検証 | effect/pending | 2026-07-12 | claude | content |
| AFF-06 | 公務員 AI 転職体験記で STRATEGY CAREER を訴求 — deployed 2026-06-04: koumuin-ai-tenshoku-1500man 公開済み (publishedAt: 2026-06-04, STRATEGY CAREER affiliate-banner 挿入済)。GA4 CV 計測 4 週後 | effect/pending | 2026-07-04 | claude | affiliate |
