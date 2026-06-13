# affiliate-improvement 詳細ログ (agent 用・append-only)

agent 用詳細ログ。施策一覧 (簡易表) は `docs/02_実装計画/03_改善バックログ.md`。
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

- **判定更新 (2026-06-06)**: ベースライン収集完了 → `effect/none` でクローズ (計測の起点タスク)。次アクション: AFF-02 (ゼロ軸補充・owner=uruhayato373) / AFF-03 deployed 後の GA4 計測。

### GA4 計測の前提メモ (observe モードを回す前に確認)

- `ad_impression` / `affiliate_click` は送出済み (`AdImpressionTracker` / `TrackedAffiliateLink`)。
- **実測経路は GitHub Actions** `.github/workflows/affiliate-ga4-weekly.yml` (週次 cron + dispatch)。
  既存 metrics workflow と同じ `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` シークレットを鍵ファイルに復元し、
  `fetch-affiliate-ga4.cjs` を実行 → snapshot `.claude/state/ads/ga4-affiliate-<date>.json` を develop に commit-back。
  - **検証コマンド (ローカルに鍵がある場合)**: `node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28`
- 内訳パラメータ `affiliate_category` / `link_position` を GA4 で **dimension として引くにはカスタム
  ディメンション登録が必要**。未登録だと `eventName` 単位の総数しか取れない。
  - **未登録時の next action**: GA4 管理画面でイベントスコープのカスタムディメンション
    `affiliate_category` / `link_position` を登録 → 翌週の workflow 実行で内訳取得。
  - **[仮説・未検証]** custom dimension が未登録の可能性が高い (新規イベントのため)。初回 workflow 実行の
    `hasCustomDimensions: false` で判明する。判明したら登録を依頼する。

---

## AFF-03 ランキングページのバナー枠追加 (案 A)

- **デプロイ日**: 2026-06-04 (commit `c8eb8a35`, merge `ce0bc431` PR #433, main 反映 ~2026-06-05)
- **想定効果**: ranking sidebar で banner impression を取り込む。AFF-01 baseline で「banner 54 枠あるが ranking page は sidebar-bottom text のみ (banner ゼロ)」と判明した改善。
- **実装内容**:
  - `AffiliateAdSlot.tsx` に priority 1 (banner > text > AdSense) のロジックを追加。
  - `resolveAffiliateBannersByCategoryKey(categoryKey, 1)` で ranking の categoryKey に対応するバナーを取得。
  - バナーが無い場合は従来どおり text → AdSense にフォールバック。
- **検証コマンド**: `node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28` (要 GHA 実行) → `ad_impression` イベントに `ranking` ページが現れることを確認
- **実測**: 未取得 (AFF-01 の GA4 custom dimension 登録が前提。`hasCustomDimensions` が true になった週次 workflow 実行後に確認)
- **判定**: `effect/pending` [2026-06-06 時点。検証期日: 2026-06-28。GA4 custom dimension 登録 + 週次 cron 実行後に impression/click 増加を実測して判定]
- **未確定 / 仮説**:
  - **[仮説]** ranking で impression が発生し始める。ただし categoryKey と登録 banner の一致率次第 (AFF-01 でゼロ 8 軸が確認済)。
  - **[次アクション]** GA4 管理画面でカスタムディメンション `affiliate_category` / `link_position` を登録 → `affiliate-ga4-weekly.yml` dispatch → `hasCustomDimensions: true` で内訳確認。
