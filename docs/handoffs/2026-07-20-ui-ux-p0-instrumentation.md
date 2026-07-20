---
type: handoff
date: 2026-07-20
topic: UI/UX P0-2 + 計測計装 (deploy 済 / GA4 登録・計測 待ち)
status: deployed-awaiting-measurement
---

# UI/UX P0-2 + 計測計装 — deploy 済・GA4 登録 + 効果判定 待ち

## 一文サマリ

UI/UX Phase 0 の P0 群は全決着し、**P0-2 (ランキングレール並べ替え) と nav_click/rail_click 計装は
2026-07-20 に本番デプロイ済 (PR #606 → main `eac7182c`・Cloudflare deploy success)**。本番 hydrated DOM で
P0-2 の視覚順 (関連 top=202px → AdSense 914px → survey 1542px) を実測確認。**残る人間タスクは GA4 カスタム
ディメンション登録と 1-2週後の効果判定のみ。**

## ✅ 完了 (2026-07-20 deploy)

- PR #606 (develop→main) マージ済・CI 10/10 green・Cloudflare deploy success・post-deploy smoke-test gate 通過。
- 本番実測: `/ranking/abandoned-cultivated-land-area` で右レール先頭=関連ランキング (202px)・AdSense スロット2 (914px)。og:image gate 緑。
- 併せて別セッションの ads 在庫 + consistency state も反映 (配信非影響)。

## デプロイ済の内容 (本番反映済)

- **P0-2** (`42016064`): `RankingPageSidebarSection.tsx` で関連ランキング (RankingItemsSidebar) を
  レール最上部へ繰り上げ、AdSense はスロット2 (依然 above-the-fold) に据え置き。full 版 (両広告を
  最下部) は RPM 実測が無いため不採用。本番 hydrated DOM で先頭=関連 (202px) を実測。CLS/sticky 不変。
- **計装** (`0aea3de9`): `events.ts` に `trackNavClick`/`trackRailClick` 追加 → HeaderClient /
  MobileNavDrawerClient の主要ナビ (surface 別) と RankingSidebarClient の関連ランキングレール
  (widget/slot) に配線。localhost で nav_click(都道府県/areas/desktop-header)・rail_click
  (related-rankings/slot1/ranking_key) 発火を実測。本番でも同コードが送信 (dev のみ gtag 未ロードで no-op)。

## 残る人間タスク (★これだけ)

1. **GA4 カスタムディメンション登録** (未実施): GA4 管理 → カスタム定義 → 「スコープ=イベント」で
   `nav_label` / `nav_surface` / `rail_widget` / `rail_slot` を登録。未登録の間は eventName 総数に落ちる
   (affiliate_vertical / home_featured と同手順)。反映 24-48h。**登録するまで内訳が取れない。**
2. **1-2 週後に効果判定** (evidence-based): 都道府県 nav の利用 (`nav_click`) / 関連レール `rail_click` /
   **AdSense sidebar RPM 大幅減なし** を実測 → P0-1/P0-2 を判定。悪化時は P0-2 を revert (1ファイルの sibling 入れ替え)。

## 残 follow-up (詳細は backlog へ移送済)

真実源 = `docs/todo/02_機能バックログ.md` の `[UI-CONSOLIDATION-RESIDUAL]` §UI/UX Phase 0 残:
- P0-5 systemic: ランタイム opengraph-image route (root / areas/[areaCode]) の静的化 or 削除 (再発の芽・
  機械検知は smoke-test の og:image gate で担保済)。font-loader のランタイム Google Fonts fetch をローカル
  同梱フォントに置換してから静的化 (`ogp-image-standards.md` §5.7)。
- stale city キャッシュ: 東京の一部 city が修正前 warm の stale ISR を配信中。`revalidate=86400` で ≤24h
  自然回復 or `gh workflow run purge-cdn.yml` で即 flush。
- INP を PSI バッチに追加 (guardrail)。
- P1 カード visual: blog 一覧サムネ差別化・theme/survey カードの data visual (image-audit P1・業務レバー低)。
- card_click / chart_interaction / article_progress は未計装 (P0 に紐付かず deferred)。

## 既 deploy 済 (参考・本 batch に含まない)

P0-1 (ヘッダー都道府県)・P0-4 (home hero SSOT)・P0-5 (OGP 4件是正)・P0-6 (dark SSOT) は PR #605 で
本番 live。P0-3 は不要確定 (No Image は baseThumbnailUrl 未使用で発火しない)。og:image status 検査は
`smoke-test-routes.sh` に追加し deploy gate に配線済 (再発防止・commit `eee8c9fc`)。

## この handoff の畳み方

上記「即時の次アクション」を消化したら本ファイルを削除する (follow-up は既に backlog にあるため二重に残さない)。
