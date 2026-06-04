# affiliate-improvement 詳細ログ (agent 用・append-only)

2 層構造の下層。人間向け要約は `docs/05_改善ログ/affiliate.md`。
記入は `.claude/rules/evidence-based-judgment.md` のテンプレに従う (想定値の根拠・検証コマンド・実測を必須)。

---

## AFF-01 在庫ベースライン棚卸し

- **デプロイ日**: 2026-06-04
- **想定効果**: なし (計測の起点)
- **検証コマンド**: `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts`
- **実測 (2026-06-04)**:
  - active 72 枠 / 実広告主 29 社
  - カテゴリ 17 軸中 9 軸カバー。ゼロ軸 8: agriculture / miningindustry / commercial / educationsports / safetyenvironment / international / infrastructure / ict
  - 手薄軸: landweather (2)
  - locationCode: blog-bottom 47 / sidebar-bottom 18 / area-sidebar 4 / sidebar-sticky 2 / sidebar-inline 1
  - adType: banner 54 / text 18
  - ページ描画: ranking は sidebar-bottom の text のみ (banner impression ゼロ)
- **判定**: ベースライン確定。effect ラベルなし。
- **未確定 / 仮説**:
  - **[仮説]** ゼロ 8 軸はトラフィックがあっても収益化ゼロ → AFF-02 で補充。
  - **[仮説]** ranking の banner 不在が impression の最大の取りこぼし → AFF-03 で枠追加検討。

### GA4 計測の前提メモ (observe モードを回す前に確認)

- `ad_impression` / `affiliate_click` は送出済み (`AdImpressionTracker` / `TrackedAffiliateLink`)。
- 内訳パラメータ `affiliate_category` / `link_position` を GA4 で **dimension として引くにはカスタム
  ディメンション登録が必要**。未登録だと `eventName` 単位の総数しか取れない。
  - **検証コマンド**: `/fetch-ga4-data last28d events` で `ad_impression` / `affiliate_click` が出るか確認。
  - **未登録時の next action**: GA4 管理画面でイベントスコープのカスタムディメンション
    `affiliate_category` / `link_position` を登録 → 数日後に内訳取得。
