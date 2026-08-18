# affiliate-improvement 詳細ログ (agent 用・append-only)

agent 用詳細ログ。施策一覧 (簡易表) は `.claude/todo/improvements.md`。
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
- **設計の要点 (旧 docs/40_アフィリエイト管理 の AFF-03 設計文書を 2026-07-15 に統合・全文は git 履歴)**:
  - 案 A (採用): `AffiliateAdSlot` の解決優先順位を banner → text → AdSense に変更 (1 ファイルに閉じる外科的変更)。
    案 B (枠新設で imp 両取り) は在庫が薄いうちは同一案件の重複表示になるため不採用。
  - SSG 安全性: 既存 async RSC パターンの踏襲で `cookies()`/`headers()` を増やさない → force-dynamic 化なし。
    **受け入れ条件 = `next build` で `/ranking/[rankingKey]` が Static 区分を維持** (`.claude/rules/nextjs-ssg-preservation.md`)。
  - 本番検証: `curl -s -A "Googlebot" "https://stats47.jp/ranking/<banner在庫のあるkey>" | grep -c "affiliate\|a8.net"`

---

## [TRIAGE-2026-07-03] AFF-02 / AFF-03 期日到達の判定 (improvement-triage)

- **AFF-02 (広告ゼロ 8 軸の在庫補充) → pending 継続 (期日 2026-07-19 に再設定)**:
  - **実測 (2026-07-03)**: `.claude/state/ads/inventory-2026-06-28.json` の `coverage.gapCategories` = 8 軸のまま (agriculture / miningindustry / commercial / educationsports / safetyenvironment / international / infrastructure / ict)。active 68 枠 / 9 軸カバーで AFF-01 baseline (2026-06-04: 72 枠 / 9 軸) からゼロ軸は不変
  - 人間 (uruhayato373) の ASP 提携・banner 登録待ち
- **AFF-03 (ランキングページのバナー枠) → effect/pending 継続 (期日 2026-06-28 → 2026-07-26 に再設定)**:
  - **実測 (2026-07-03)**: `.claude/state/ads/ga4-affiliate-2026-06-28.json` = `dimensions: []`・`hasCategoryBreakdown: false` → GA4 custom dimension (`affiliate_category` / `link_position`) が**依然未登録**で ranking ページ帰属の実測不能
  - 総計 (28 日): ad_impression 8,637 / affiliate_click 11 / CTR 0.13% (ページ・枠の内訳なし)
  - **次アクション**: 人間が GA4 管理画面でイベントスコープ custom dimension 2 件を登録 → 翌週 `affiliate-ga4-weekly.yml` 実行で内訳確認 → ranking impression 発生を判定

---

## AFF-IMPRESSION-RENAME-01 `ad_impression` → `affiliate_impression` 改名後の計測確認

- **デプロイ日**: 2026-07-28 (イベント改名 + `AdImpressionTracker` の発火順バグ修正を同時投入)
- **想定効果**: 収益への直接効果は想定しない。**計測の回復**が目的。
  改名前の自前 impression は **実測 0 件**で、AdSense 連携が自動生成する同名 `ad_impression`
  (直近 7 日 3,346 件・`adSourceName` が全件 AdSense で総数と完全一致) と区別できず、
  **アフィリエイト CTR の分母が存在しなかった** (`.claude/rules/analytics-event-standards.md` §2)。
- **検証コマンド**:
  ```bash
  node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28   # 要 GHA 実行 or ローカル鍵
  # 生成物: .claude/state/ads/ga4-affiliate-<date>.json
  ```
- **実測 (snapshot `.claude/state/ads/ga4-affiliate-2026-08-02.json` / generatedAt 2026-08-02T14:28:55Z)**:

  | 項目 | 値 |
  |---|---|
  | `eventNames.impression` | `affiliate_impression` (`measurementEpoch: affiliate-impression-v1`) |
  | impressions / clicks / CTR | **3,400** / 5 / 0.147% |
  | `unsetVerticalImpressions` / `unsetVerticalRatio` | **0 / 0** (`(not set)` に潰れていない) |
  | `hasVerticalBreakdown` / `hasCategoryBreakdown` | **true** / true |
  | 取得できた dimension | `ad_id` / `affiliate_vertical` / `link_position` (行数 133) |
  | `measurementGate.status` | **ready** (`affiliate-operations-latest.json`) |

  vertical 別内訳 — **canonical 10 軸すべてに実データがある**:

  | vertical | imp | clicks |
  |---|---:|---:|
  | (other) | 2,089 | 4 |
  | economy | 633 | 1 |
  | population | 230 | 0 |
  | health | 99 | 0 |
  | furusato | 80 | 0 |
  | mobility | 60 | 0 |
  | education | 56 | 0 |
  | housing | 50 | 0 |
  | labor | 44 | 0 |
  | energy | 41 | 0 |
  | travel | 18 | 0 |

  **窓の読み方**: snapshot の窓は名目 28 日 (2026-07-06〜08-02) だが、`affiliate_impression` は
  **2026-07-28 の改名以降にしか存在しない**。したがって 3,400 imp は実質 6 日以内の蓄積で、
  日次では約 600 imp。28 日平均として読まない。

- **判定**: **完了**。行の完了条件「0 件でなく vertical 別に取得できるか確認する」を満たし、
  再監査の分岐 (「0 件または `(not set)` の場合」) は発火しない。effect ラベルは付けない
  (収益効果ではなく計測回復の施策のため)。
- **副次的に解消したこと**:
  - 2026-06-28 snapshot の `dimensions: []` / `hasCategoryBreakdown: false` から、
    3 dimension すべてが引ける状態になった。AFF-03 が「GA4 custom dimension 未登録で
    ranking ページ帰属の実測不能」としてブロックされていた前提が解消した。
  - `.claude/rules/affiliate-ads-standards.md` §6 の「dimension はパラメータ名に紐づくため
    イベント改名でも再登録不要と考えているが**未検証**」を**実測で検証済**にした (再登録は不要だった)。
- **未確定 / 残る論点**:
  - **`other` が 61.4% (2,089/3,400) を占める。** これは計測の欠陥ではなく、
    `affiliateCategory ?? "other"` のフォールバック (`BannerAd` / `AffiliateAdSlot` /
    `AffiliateTextAdList` / `AreaBannerAd` の計 5 箇所) が返す値で、
    「**vertical を解決できなかったページで表示された**」ことを忠実に表している。
    `other` は `AffiliateVertical` の 10 軸に含まれない。
    → 写像カバレッジの問題として `AFF-CATEGORY-MAP-01` が扱う。本項目の範囲外。
  - `hasVariantBreakdown: false`。`variant_id` / `experiment_id` は今回の dimension に含まれず、
    クリエイティブ A/B (`/manage-affiliate-experiment`) の判定にはまだ使えない。
  - **CTR 0.147% は分母が 6 日分**なので、水準の評価には窓を伸ばした再取得が要る。
    改名日 (2026-07-28) より前に窓を伸ばすと 0 件が混ざるため、判定は 2026-08-25 以降に行う
    (`AFF-A8-REGISTER-01` / `AFF-BLOG-TEXTLINK-01` の due と整合)。

---

## AFF-IMPRESSION-ROUTING-01 AdSense停止枠への既存在庫配線

- **判断日**: 2026-08-16
- **デプロイ日**: 未デプロイ
- **目的**: AdSense停止後の空き位置を使い、無関係な案件や新規在庫を増やさず、文脈一致バナーの
  viewable impression を増やす。50%以上を1秒という計測閾値は変更しない。
- **事前証拠**:
  - 在庫: `.claude/state/ads/inventory-latest.json` (generated 2026-08-09) は active **260**、
    unique advertisers **160**、10 verticalすべて banner/text在庫あり、gap/thin verticalともに0。
    したがってボトルネックは在庫不足ではなく配置と到達率。
  - affiliate: `ga4-affiliate-2026-08-02.json` **3,400 imp** →
    `ga4-affiliate-2026-08-09.json` **7,699 imp**。計測epochは2026-07-28開始で両28日窓に
    失効分がまだ無いため、差分 **4,299 imp** を追加週の近似値として使う。
  - site: `.claude/state/metrics/ga4/LATEST.md` の finalized 2026-08-02〜08-08 は **6,055 PV**。
    基準値は **4,299 / 6,055 = 0.710 affiliate_impression/PV**。期間境界が完全一致する
    日次rawではないため近似 baseline と明記し、効果判定はデプロイ後の同一期間定義で取り直す。
  - 2026-08-09 position内訳は sidebar 2,852、article-inline 1,780、ranking-sidebar 1,163に対し、
    area-sidebar 69、ranking-end 45。ranking/areaの本文・上段レールに到達余地がある。
- **実装内容**:
  - ranking本文: 解決済み横長バナー先頭1件を停止中の本文中段へ移し、末尾配列から除外して重複防止
    (`position=ranking-incontent`)。AdSense再開時は元の末尾配列へ戻す。
  - ranking右レール: 最大2件という既存上限を維持し、停止中だけ旧AdSense上段位置へ移す。
  - area県ページ: `furusato` verticalを1件解決し、停止中の本文枠へ表示
    (`position=area-content`)。在庫ゼロ/取得失敗なら空枠なし。
  - 固定・文脈バナーのSurface/Cardを外し、PR見出し・説明なしのASPバナー画像だけに統一。
- **想定効果**: 増加幅は未確定。主指標 `affiliate_impression/PV` が baseline 0.710を上回るかを検証する。
  収益効果はCTR/CV/確定成果が揃うまで主張しない。
- **検証手順 (デプロイ後14日)**:
  1. `node .claude/scripts/ads/fetch-affiliate-ga4.cjs 7` を前後の重複しないfinalized 7日で実行する。
  2. 同じ日付範囲のGA4 pageviewsで `affiliate_impression/PV` を計算する。
  3. `ranking-incontent` / `ranking-sidebar` / `area-content` のimpression・click・CTRを確認する。
  4. page type別 engagement rateとASPの発生/確定成果を併記する。CTRやengagementが悪化した場合は
     枠追加を続けず、position単位で撤去/移設する。
- **判定**: `effect/pending`。デプロイ前のため効果未判定。`variant_id` / `experiment_id` dimension欠落は
  position別集計を妨げないが、クリエイティブA/B判定は引き続き行わない。
- **訂正**: 過去ログの「`other`=vertical未解決ページ」という解釈は過大。最新ad_id/position内訳では
  fixed house bannerも意図的に`other`を送るため合成値である。`AFF-CATEGORY-MAP-01`は前提不成立として
  改善バックログから削除し、今後の写像漏れはplacement-mapの`unmapped.byReason`で判定する。
