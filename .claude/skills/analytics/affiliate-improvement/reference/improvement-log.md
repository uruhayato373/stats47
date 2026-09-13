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
- **デプロイ日**: 2026-09-13 14:02:32 JST（PR963 / deploy34739098468）
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
  1. 前後の重複しないfinalized 7日を明示日付で取得する。現行 `fetch-affiliate-ga4.cjs 7` は7daysAgo〜todayの8暦日・当日途中を含み、固定7日比較には使わない。
  2. 同じ日付範囲のGA4 pageviewsで `affiliate_impression/PV` を計算する。
  3. `ranking-incontent` / `ranking-sidebar` / `area-content` のimpression・click・CTRを確認する。
  4. page type別 engagement rateとASPの発生/確定成果を併記する。CTRやengagementが悪化した場合は
     枠追加を続けず、position単位で撤去/移設する。
- **判定**: `effect/pending`。公開後の確定した比較期間が未取得のため効果未判定。`variant_id` / `experiment_id` dimension欠落は
  position別集計を妨げないが、クリエイティブA/B判定は引き続き行わない。
- **訂正**: 過去ログの「`other`=vertical未解決ページ」という解釈は過大。最新ad_id/position内訳では
  fixed house bannerも意図的に`other`を送るため合成値である。`AFF-CATEGORY-MAP-01`は前提不成立として
  改善バックログから削除し、今後の写像漏れはplacement-mapの`unmapped.byReason`で判定する。

- **2026-09-13公開確認**: [deploy34739098468](https://github.com/uruhayato373/stats47/actions/runs/34739098468) は本番公開・route smoke・sitemap検査が成功。計測定義の切替は14:02:32 JST。9/15にpage/device/placement別の到達を確認し、9/27に確定した非重複期間の比較可否を判定する。同時施策・click定義変更はconfoundedとして扱う。新しいGA4取得9472 placement行は公開前baselineであり、効果の根拠にしない。

---

## blog-inbody-format 本文広告形式実験

- **開始日**: 2026-08-04
- **終了判断日**: 2026-08-28
- **検証コマンド**: `npx tsx .claude/scripts/ads/build-affiliate-operations-state.ts`
- **実測**: `.claude/state/ads/ga4-affiliate-2026-08-28.json`（generatedAt 2026-08-28T06:28:33.210Z）

  | variant | viewable impression | click | CTR |
  |---|---:|---:|---:|
  | text | 2,683 | 0 | 0% |
  | banner | 821 | 1 | 0.1218% |

- **ガード**: 各variant 500 impression以上、24日経過（最小14日）、freshness/同時施策confoundなし。
- **判定**: `ready-to-decide` の比較値を提示し、2026-08-28にオーナーが `banner` を採用。effectラベルは
  本ログでは更新しない。code実験なので広告weightを変更せず、本文のslugハッシュ分岐と実験ID送信を撤去して
  全記事をバナー固定へ変更した。

---

## AFF-PLACEMENT-RELEASE-01 配置・楽天品質・計測のローカル安全化

- **検証日**: 2026-09-08。**デプロイ日**: 2026-09-13 14:02:32 JST（後続の全セッション統合・公開指示によりPR963で公開）。
- **想定効果**: 収益増分は未推定。目的は未提携3案件の配信停止、同一案件の重複抑止、人口/医療分類からの無関係な広告の除外、楽天の品目・県帰属の品質確保、連続50%×1秒の計測回復。
- **実装**: 停止・allowlist・programRef/URL重複を共有ポリシーへ集約。ランキング本文とレール、県本文とレール、home、実験・固定枠に適用。カテゴリ一覧は17軸の明示方針。楽天は取得/表示の双方で品質検査し、認証不足と正常0件を分離。GA4の既存3reportを保ち、ページ×端末×広告×枠の内訳を追加した。
- **再現コマンド**:
  - apps/webから `node ../../node_modules/vitest/vitest.mjs run src/features/ads scripts/lib/__tests__/rakuten-catalog-cli.test.ts --testTimeout=90000 --maxWorkers=1`。
  - `node --test .claude/scripts/ads/__tests__/placement-map-core.test.mjs .claude/scripts/ads/__tests__/fetch-affiliate-ga4.test.cjs`。
  - `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts --json --check-size`、`npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --check`。
  - 楽天は `audit-rakuten-catalog.ts --input-dir <取得済みsnapshot> --output-dir .local/<別directory> --terms さんま,コーヒー`。最新再取得ではない。
- **実測と境界**:
  - 広告263件を削除せず保持し260件active、128 programRef。activeな旧snapshotでも停止3案件はruntimeで除外する。広告主数はタイトル数と同義ではない。
  - 公開メタに基づく2,166ランキングの候補判定は1,680 eligible / 486 none / unavailable 0。停止案件・同一programの候補重複0。これは実表示数や広告を置くべきページ数ではない。
  - サイトマップ4,524URLの候補判定は3,231 eligible / 928 none / 365 unavailable。タグ未写像・未取得調査メタ・モデル外ルートを広告表示0や機会損失に置換しない。全URLの画面確認済みではない。
  - 楽天49snapshotの旧データを再検証。47県の162項目中、送料7・地域不明25を除外し130項目を商品名根拠で保持。ショップ検証済みではない。食品文脈の券類は別途除外し、該当商品が無い場合は同県一覧へ戻す。さんま4→2、コーヒー4→4。generatedAtは原本のまま。
  - 楽天API認証2項目がこのPCに無く、最新取得49対象はnotAttempted。GA4実測も未更新。CTR/CV改善の判定は行わず、計測定義の切替日を公開時に確定する。

### Verification Loop 結果（広告の変更範囲）

| Phase | 項目 | 結果 | 詳細 |
|---|---|---|---|
| 0 | 既知問題 | CHECKED | 在庫/実表示の区別、旧楽天分類、Windowsの同期ファイル走査timeout |
| 1 | ビルド | PASS | 分離worktreeでwebをビルドし1,604ページ生成。初回の公開URL経由JSON読込エラー後、同一sha256の検証済み原本とlocal広告snapshotを読み取り専用gatewayで供給して成功。本番通信の実測ではない |
| 2 | 型 | PASS / 全体WARN | mainのweb型検査PASS。全体コマンドはWindows shell依存、管理画面の生成型、別作業のGeoスクリプト/依存で停止。未修正の他作業を含めてPASSとはしない |
| 3 | Lint | PASS / 対象範囲 | 広告変更の5違反（import順/テストのthis alias）を是正し、ads全域と変更した登録/楽天スクリプトをmax-warnings 0で再検証。全web一括では変更範囲外の違反も残る |
| 4 | テスト | PASS | 広告/楽天CLI 246/246、配置map 41/41、GA4 fixture 8/8。最終テスト補助修正後も対象23/23。Windows走査の制限を90秒に明示しassertionは維持 |
| 5 | 安全性 | PASS / 限定 | 自動配置サイズの新規違反0、直接配置構造error0。既存サイズ警告は保持。広告srcにserver秘密env/秘密ログの追加なし。秘密値をmanifestへ出さない。外部クリック・新規申請・公開操作なし |
| 6 | Diff/docs | CHECKED | 差分空白検査PASS、docsゲートerror0・リンク悪化0（既存TODO警告3）。他作業の変更は維持 |

- **画面の最終確認**: localhostのコーヒー、高齢化、秋田食文化、沖縄県ページはdesktop/mobileともHTTP 200・重複href 0・横はみ出し0。転職ランキングは先行確認で同条件を満たしたが、読み込み待機を強化した最終再試行は同ページでブラウザが無応答となり中止（4/6完了）。経済カテゴリは先行試行で45秒timeout。確認用headlessブラウザだけを終了し、ユーザーのブラウザ/dev serverは操作していない。ASP画像・ピクセル・計測通信を遮断したDOM検査であり、画像意匠/収益の実測ではない。
- **PR Ready: NO**。分離ビルドの確認サーバー起動は実行ポリシーで拒否。上記の残る画面確認と全体型検査が未通過。機械テストとブラウザ実測を分ける。
- **証拠**: `.local/affiliate-status/placement-audit-20260908/` の `postfix-coverage.json`、`verification-tests-final.json`、`verification-refinement-tests.json`、`rakuten-quality-verification.json`、`rakuten-refresh-blocker.json`、`build-data-probe.json`、`local-verification*.json`。作業中の長文監査をdocsへ新規保存しない。
- **残工程・停止/完了条件の正典**: `.claude/todo/backlog.md` の同IDと `AFF-STOCKTAKE-RECONCILE-01`。effectラベルは変更しない。

### 同日追検証（残作業の継続依頼）

- **画面ゲート解消**: `/ranking/software-engineer-annual-income` と `/category/economy` はdesktop 1440px / mobile 390pxでHTTP 200、同一href重複0、横はみ出し0、pageerror 0。転職の表示広告リンクは7/5、経済は4/4。前回の4ページと合わせて代表6ページのDOM配置検証を完了した。各ページの全処理に上限時間と完了件数検査を付け、失敗時は非0で終了する検証に変更。検証用ブラウザだけを終了し、既存dev・ユーザーブラウザを維持した。ASP画像・計測通信は遮断、外部リンクはクリックしていない。
- **型・被覆修正**: estat-apiのPOSIX環境変数前置を既存cross-envへ変更。adminの削除済みAPIを参照する古い生成型は `next typegen` で再生成し、型チェックの除外や生成ファイルの手編集はしていない。Geo監査の `GeometryObject<GeoJsonProperties>` だけ型を整合。別worktreeでのみ発生したstream-jsonエラーは、現作業ツリーでは3.6.0が正しく解決され、ソース修正不要。被覆テストは別checkoutの残骸を走査しないfixtureを追加し、そこで判明した既存note生成スクリプトの型検査漏れを専用configとrootコマンドへ追加。回帰テスト6/6およびnote単体型検査PASS。
- **全体ゲート**: `npm run type-check` 最終実行exit 0。25 workspaceと9つのscripts用configをすべて完走した。同時進行中のGeoタスクによる `geo-source-policy-pages.ts` 追加後に再検証し、未作成だった参照を削除して通していない。
- **楽天認証の訂正**: GitHub Secretsに `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` が登録済み。2026-09-08朝の[定期同期run 34164602156](https://github.com/uruhayato373/stats47/actions/runs/34164602156)も成功（459品目・47県、0件は74品目・1県、affiliateUrlを含む応答431）。今回新たなCI起動はしていない。ローカル未設定はCIの認証不足を意味せず、Secretsの値を取得・出力・ローカル転記しない。
- **楽天データ確認**: 取得済み49snapshotはすべてgeneratedAt `2026-09-07T21:53:30.854Z`。現在の品質処理で49/49再検証し、unavailable 0、県別fallback5、食品文脈fallback47。APIの旧検索条件由来であり、ショップ情報付きの新検索条件を実APIへ適用した検証ではない。その再取得・公開は上記backlogの承認境界へ残す。
- **最終テスト**: 広告/楽天CLI 246/246、配置map・GA4 fixture 49/49、型検査被覆6/6の計301件PASS。長時間無出力だった広告runも最終JSONのsuccess=true・failed 0・pending 0とコマンドexit 0を確認した。CJS検査は `node --check` と契約テストで検証（repo rootにESLint configは無いのでroot単独ESLintを成功扱いしない）。docs fix/checkはerror 0・リンク悪化0、既存TODO警告3。
- **範囲**: フルwebビルドは前回PASSを継承し、今回の型・検査設定修正では再実行しない。表示UIのソースは今回未変更。全webの無関係なlint課題・Geo新規機能の品質は別タスク。deploy・R2 push・CI dispatch・ASP申請は未実行。ローカルの型・代表画面ゲートは解消し、新検索条件の実API検証と本番反映は承認待ちとして残す。
- **追加証拠**: `.local/affiliate-status/placement-audit-20260908/residual-verification-summary.json`、同ディレクトリの `residual-ui.json`・`residual-ads-tests.json`・`residual-*.png`、`.local/rakuten-ci-revalidated-residual-20260908/audit.json`。

### 同日コミット・push準備

- **承認境界**: ユーザーから「別セッションの変更もすべてコミットしてpush」の追加指示あり。広告SSOTをdevelopへpushすると自動公開が発火するため、Geoを含む全変更を公開を伴わない専用ブランチ `codex/workspace-updates-20260908` で保存する。develop/mainへの反映・CI dispatch・R2更新・デプロイは未承認のまま。
- **先行検証**: 追加指示前にorigin/develop `58a9aacbc` 基点の別worktreeで広告だけを分離検証し、`npm run type-check` は25 workspace・9 scripts configともexit 0。その分離案ではcommit・pushしていない。追加指示後はGeo側の編集停止を確認し、共有作業ツリーの現HEAD `5aee9b322` から全変更を保存する。Geoの未完了・未検証点はbacklogと `.claude/state/geo/source-pages.json` を維持し、本番公開可能とは判定しない。
- **変更の差分**: コミット前検査で見つかった旧楽天snapshotの互換処理3か所へ削除条件を追記した（検証済み新データへの移行と旧キャッシュ失効）。動作変更はなく、広告301件のテスト・代表6ページ・フルwebビルドは上記PASSを継承し、この準備では再実行しない。

### 2026-09-13 統合公開と計測引渡し

- **公開**: PR963、main `f09ac2ca978e501b29b9f8c9d1c81b9872601d98`。アプリrun34739098468は全工程成功。過去のWindows制限・旧snapshot再検証・ローカル認証不足は上記の当時の履歴として保持する。
- **楽天の新規取得と公開**: run34726845212で510検索（463品目・47県）、有品373・正常空137・失敗0。品質監査49/49、公開先510canonical GETは200・内容・新規取得epochがすべて一致。商品存在と収益効果は別に扱う。
- **計測境界**: 2026-09-08固定baselineとafter=nullを維持。T48h=9/15 14:02:32 JSTは在庫・DOM・GA4送信の確認、T14d=9/27は明示日付・確定期間・同一cohort/placement・期間とサイトが一致するASP成果を確認する。現行CIのdays=28は29暦日で当日を含む。収益・CTR改善は未判定。
- **証拠**: `.claude/state/metrics/releases/2026-09-13-all-sessions.json` と `.local/verification/release/2026-09-13-all-sessions/` のapp-deployment・rakuten-publication・affiliate-ga4。代表DOMの実施結果は公開確認後に追記する。
