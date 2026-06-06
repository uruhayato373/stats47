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
| BLOG-WAVE-2026-05-25-auto | curiosity gap auto-brushup 54 記事 | pending | 2026-06-22 | claude | gsc |
| BLOG-WAVE-2026-05-28-manual | GSC 駆動 上位 4 記事 手動 brushup | pending | 2026-06-25 | claude | gsc |
| BLOG-WAVE-2026-05-29-auto | GSC 改善余地上位 4 記事 auto-brushup | pending | 2026-06-26 | claude | gsc |
| INDEXING-SITEMAP-02 | sitemap を「コンテンツ実体のある URL」に一致させ未登録を削減 | pending | 2026-06-28 | claude | indexing |
| ADSENSE-RPM-01 | RPM ¥36 → ¥65 (Viewability 54%→70%+) | pending | 2026-06-30 | claude | adsense |
| Q-DESIGN-01 | ranking/blog 問い設計の集客施策 (戦略 doc20 起点) | pending | 2026-06-30 | claude | gsc |
| CWV-RANKING-LCP-01 | ranking mobile LCP — map tile preload を lg 以上に限定 | pending | 2026-07-01 | claude | psi |
| CWV-THEMES-CLS-01 | useSearchParams→useEffect 置換で ThemeDashboardTabbed Suspense fallback={null} CLS を除去 — deployed 2026-06-06 | effect/pending | 2026-07-01 | claude | psi |
| P0-RANKING-INDEX | /ranking インデックス率 43% → 70%+ 改善 (100x Phase 0 主軸) — KNOWN +128・all.json sync 完了(2026-06-06, active=2093)。sitemap は PR #447 デプロイ後に自動反映。GSC 計測は 4-6 週後 | effect/pending | 2026-07-06 | claude | gsc |
| P0-AREAS-01 | /areas/{prefCode} 47 ページの SEO 監査 + 内部リンク強化 | pending | 2026-07-06 | claude | indexing |

## Tier 2 (Should)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| GA4-BOT-02 | Cloudflare WAF rule で bot スキャナをブロック | pending | 2026-06-14 | uruhayato373 | ga4 |
| GA4-PIPELINE-01 | fetch-ga4-data snapshot に per-report try/catch を標準化 — deployed 2026-06-06 | effect/full | 2026-06-14 | claude | ga4 |
| AICONTENT-001 | wheat-flour-consumption-quantity ai_content リライト | pending | 2026-06-15 | claude | ai-content |
| BLOG-CTR-05 | Tier 3 brushup (3 記事) + /category description 差別化 | pending | 2026-06-20 | claude | gsc |
| AFF-02 | 広告ゼロ 8 軸の在庫補充 | pending | 2026-06-21 | uruhayato373 | affiliate |
| GA4-PIPELINE-02 | history.csv の pageviews をカレンダー週バケット + Japan-only に統一 | pending | 2026-06-21 | claude | ga4 |
| CTR-AUTO-01 | CTR 改善候補の月次自動抽出 (Phase 3 sprint) | in-progress | 2026-06-21 | claude | gsc |
| AFF-03 | ランキングページのバナー枠追加 (案 A 実装) | effect/pending | 2026-06-28 | claude | affiliate |
| CONTENT-DRAFT-01 | /draft-from-trend skill 実装 (Phase 2 → Phase 3 での稼働) | in-progress | 2026-06-28 | claude | content |
| AFF-06 | 公務員 AI 転職体験記で STRATEGY CAREER を訴求 | pending | 2026-07-04 | claude | affiliate |
