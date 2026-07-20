---
type: handoff
date: 2026-07-20
topic: UI/UX P0-2 + 計測計装 (deploy 待ち batch)
status: pending-deploy
---

# UI/UX P0-2 + 計測計装 — deploy 待ち引き継ぎ

## 一文サマリ

UI/UX Phase 0 の P0 群は全決着し、**P0-2 (ランキングレール並べ替え) と nav_click/rail_click 計装が
develop にローカルコミット済 (未 push・未 deploy)**。次セッションは「push → develop→main PR → deploy →
GA4 カスタムディメンション登録 → 1-2週後に効果判定」を進める。

## 未 deploy の状態 (★最重要)

develop に **5 コミットがローカルのみ (origin/develop にも未 push)**。git にあり失われないが、
本番反映はまだ。まとめて 1 回デプロイする想定 (デプロイ規律)。

```
f3a3345f docs(backlog): 計測計装 完了を記録 + GA4 custom dimension 登録を人間タスク明記
0aea3de9 feat(analytics): nav_click / rail_click を計装 (P0-1/P0-2 効果判定の前提)
ba0bba3f docs: UI/UX Phase 0 handoff を畳み follow-up を機能バックログへ移送
4c0b2497 docs(handoff): P0-2 実装済・未deploy に更新
42016064 feat(ranking): P0-2 レール先頭を関連ランキングに (回遊優先)
```

- **P0-2** (`42016064`): `RankingPageSidebarSection.tsx` で関連ランキング (RankingItemsSidebar) を
  レール最上部へ繰り上げ、AdSense はスロット2 (依然 above-the-fold) に据え置き。full 版 (両広告を
  最下部) は RPM 実測が無いため不採用。localhost で先頭=関連→広告の DOM 順を実測。tsc 0・CLS/sticky 不変。
- **計装** (`0aea3de9`): `events.ts` に `trackNavClick`/`trackRailClick` 追加 → HeaderClient /
  MobileNavDrawerClient の主要ナビ (surface 別) と RankingSidebarClient の関連ランキングレール
  (widget/slot) に配線。localhost で nav_click(都道府県/areas/desktop-header)・rail_click
  (related-rankings/slot1/ranking_key) 発火を sessionStorage stub で実測。dev は gtag 未ロードで no-op。

## 即時の次アクション (順序厳守)

1. **push**: `git push origin develop` (git-race 注意 — 別セッションが同一作業ツリーで ads 作業中。
   push 前に `git fetch` + 明示確認。自分の 5 コミットのみが対象)。
2. **デプロイ** (outward-facing・要ユーザー明示承認): `gh pr create --base main --head develop` →
   CI green → merge → Cloudflare 自動デプロイ。
3. **GA4 カスタムディメンション登録** (★人間タスク・未実施): GA4 管理 → カスタム定義 → 「スコープ=イベント」で
   `nav_label` / `nav_surface` / `rail_widget` / `rail_slot` を登録。未登録の間は eventName 総数に落ちる
   (affiliate_vertical / home_featured と同手順)。反映 24-48h。
4. **デプロイ後検証**: 本番でヘッダー「都道府県」クリック → GA4 リアルタイムで `nav_click` 着弾を確認 /
   ランキング詳細で関連レールが先頭に出ているか目視 / `smoke-test-routes.sh` (og:image gate) が緑。
5. **1-2 週後に効果判定** (evidence-based): 都道府県 nav の利用 / 関連レール rail_click / **AdSense
   sidebar RPM 大幅減なし** を実測 → P0-1/P0-2 を判定。悪化時は P0-2 を revert (1ファイルの sibling 入れ替え)。

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
