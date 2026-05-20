---
type: improvement-log
metric: adsense
created: 2026-05-20
updated: 2026-05-20
---

# AdSense 改善ログ

AdSense 広告収益・RPM・CTR・ビューアビリティの改善施策。施策ベースで append-only。新しい施策を上に追加し、判定が変わったら section 末尾に追記する。

このログに記録する対象:
- 広告配置・フォーマット変更（モバイル/デスクトップ別）
- RPM / CTR / Viewability 改善
- 自動広告・Anchor 広告の試行
- AdSense データ収集パイプラインの保守

このログに記録しない対象:
- アフィリエイト収益 → `docs/00_プロジェクト管理/02_収益化戦略.md`
- 流入増加（organic）→ `gsc.md`
- LCP / CLS 改善 → `psi.md`（AdSense の天井だが施策は psi 側）

## ベースライン (2026-W21, 05/13–05/19)

| 指標 | 全体 | Desktop | Mobile | Tablet |
|---|---|---|---|---|
| PV | 1,711 | 1,072 | 630 | 9 |
| Impressions | 1,588 | 1,385 | 199 | 4 |
| Impressions/PV | 0.93 | 1.29 | **0.32** | — |
| RPM | ¥36 | ¥45 | **¥20** | ¥6 |
| CTR | 0.44% | 0.29% | **1.51%** | — |
| Earnings | ¥61 | ¥48 | ¥13 | ¥0 |

出典: `.claude/skills/analytics/adsense-improvement/reference/snapshots/2026-W21/`

100x 分解の詳細: `docs/04_レビュー/critical-review/2026-05-20-monetization.md`

---

## [ADSENSE-MOBILE-01] モバイル広告の位置改善（深すぎる配置の是正）

- **status**: in-progress
- **tier**: 1
- **target_metric**: adsense-rpm
- **owner**: claude
- **deployed_at**: -
- **due**: 2026-06-08
- **verification_command**: `node .claude/scripts/metrics/fetch-adsense-snapshot.mjs 2026-W23 && cat .claude/skills/analytics/adsense-improvement/reference/snapshots/2026-W23/devices.csv`
- **plan**: `/Users/minamidaisuke/.claude/plans/stats47-swift-thacker.md`

### 現状 (2026-05-20)

W21 データでモバイルが構造的に undermonetized:

- モバイルは流入の 37%（630 PV）だが収益は 21%（¥13）。RPM ¥20 は Desktop ¥45 の 44%
- モバイルの Impressions/PV は **0.32**（Desktop 1.29 の 1/4）
- 一方モバイル CTR は **1.51%**（Desktop 0.29% の 5 倍）→ 広告を見せれば最も成約する層

**原因（コード確定）**: `RankingKeyPageClient.tsx` L527 でサイドバー広告は `hidden lg:block`（モバイル非表示）。モバイルではサイドバー内容が L540 `lg:hidden` で**ページ最下部**（解析・相関・カード・定義・出典の全セクションの後）に再描画される。Mobile LCP 5〜19 秒 + 直帰により、そこまでスクロールされず広告リクエストが発火しない。設置漏れではなく**配置が深すぎる**。

### 施策

1. **モバイル Anchor 広告の有効化**（console 側）— ✅ 2026-05-20 実施済み
   - スクロール深度に依存しない sticky 広告。ファーストビュー離脱でも 1 impression を確保
   - AdSense 自動広告でモバイル Anchor を ON
2. **`/ranking/[key]` モバイル in-content 広告**（code 側）— ✅ 2026-05-20 実装（PR 未マージ）
   - サイト全 route 棚卸しの結果、最大流入は `/ranking/[key]`（46% PV）。本プラン Phase 1。
   - `RankingKeyPageClient.tsx` の相関分析セクション直後（解析中盤）に `lg:hidden` でモバイル専用 1 枠を追加。フッター広告とはスタッキングを避けて離した。
   - 新規スロット `RANKING_INCONTENT_MOBILE`（slotId `5555350674`、記事内/fluid）を `constants.ts` に追加。
   - branch: `feature/adsense-placement-optimization`
3. **Phase 2: `/blog/[slug]` 記事中盤広告**（code 側）— ✅ 2026-05-20 実装（PR #321）
   - 192 記事中 51 記事が手動 `<ad-slot>` 未設置（全 51 記事とも h2 見出し 6 個以上）。
   - `md-content.tsx` の `injectAdSlots` で、未設置記事の h2 見出し 2 番目・中盤の直前に `<ad-slot>`（→ `BLOG_ARTICLE_INLINE`）を 2 枠自動注入。手動配置記事の ~2 枠パターンに合わせた。
   - 当初実装は記事末尾 1 枠だったが「末尾は読了者しか見ず viewability が低い」ため記事中盤 2 枠に変更。コードフェンス内 `## ` の誤検出ガード付き。
4. **Phase 3: `/themes/[key]` 穴埋め**（code 側）— ✅ 2026-05-20 実装（PR 未マージ）
   - 17 テーマページ共通 `ThemePageLayout` のダッシュボード直後に `THEMES_CONTENT`（新規スロット）を追加。
5. **全ページ網羅**（code 側、ユーザー指示で Phase 2/3 と一括実施）— ✅ 2026-05-20 実装（PR 未マージ）
   - 広告ゼロだった 11 ページ型（地域別カテゴリ・市区町村 ×2・各一覧 /blog /blog/tags /tag /survey /ports /fishing-ports /themes・/search）にメインコンテンツ最下部 footer 広告（`CONTENT_FOOTER` 新規スロット）を追加。
   - `/search` は AdSense ポリシー考慮で「検索結果 1 件以上 & 非検索中」の時のみ条件付き表示。
   - branch: `feature/adsense-all-pages`
   - 注: 段階リリースをやめ一括デプロイのため、ページ型別の効果切り分けは粗くなる。`units.csv`（スロット別）と GA4 ページ型別 RPM・直帰率で事後評価する。

### 想定効果

- モバイル RPM ¥20 → ¥30（+50%）想定 [根拠: Anchor は viewability が高くスクロール非依存。控えめに Desktop ¥45 の 2/3 まで]
- 全体 Earnings ¥61/週 → ¥70/週 程度（モバイル 630 PV × RPM +¥10 ≒ +¥6/週）
- **要実証**: W23 devices.csv の Mobile RPM / Impressions で判定。想定の 80% 未満なら配置・フォーマットを再考

### リスク

- Anchor 広告は UX 毀損リスク。直帰率（GA4）と滞在時間を施策後 2 週で監視
- LCP がさらに悪化する可能性 → PSI 日次計測で施策前後を比較
