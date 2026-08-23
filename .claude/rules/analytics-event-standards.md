# GA4 計装イベント標準 (analytics-event-standards)

サイトの GA4 カスタムイベントと、その「GA4 カスタムディメンション登録状況」を管理する**単一ソース (SSOT) 台帳**。
計装を追加・変更する agent (`ga4-analyst` ほか UI 系) / skill / 人間はこれに従う。

> **背景 (2026-07-20)**: イベント定義は `apps/web/src/lib/analytics/events.ts` にあるが、「どのパラメータが GA4
> カスタムディメンション登録を**必要とし**、今**登録済みか未登録か**」を一覧管理する場所が無く、登録待ちが
> code コメント・doc 28・handoff にバラけていた。UI 施策 (P0-1/P0-2) の効果判定が「登録したか不明」で滞る
> のを防ぐため、登録状況をこの 1 ファイルに集約する。方式は他 rule と同じ「rule に台帳、実装は参照のみ」。

---

## 0. 二層 SSOT (どこが真実源か)

| 層 | 場所 | 役割 |
|---|---|---|
| **イベント定義 (コード SSOT)** | `apps/web/src/lib/analytics/events.ts` | 送信するイベント名・パラメータ名の実装。**ここだけがイベントを送る** |
| **登録状況 (台帳 SSOT)** | 本ファイル §2 | 各パラメータが GA4 カスタムディメンション登録を要するか・登録済みか。**管理画面タスクの追跡はここ** |
| ドメイン別の詳細 (参照) | affiliate=`affiliate-ads-standards.md §6` / home-featured=`apps/web/src/features/ranking/components/FeaturedRankings/README.md` / buzz-map=`buzz-map-standards.md` | 各ドメインの登録手順・値の意味。本台帳はこれらを**再所有せず参照**する |

- **パラメータ名はコードと GA4 で完全一致が必須**（半角・小文字・`_`）。1 文字違うと永久に紐づかない。
- カスタムディメンションは**登録後のデータにのみ適用**（遡及しない）。集計反映は 24–48h。
- 無料枠の event-scoped カスタムディメンションは最大 50 個。

---

## 1. GA4 カスタムディメンション登録手順

GA4 → 管理（歯車）→ プロパティ列「データの表示」→「カスタム定義」→「カスタムディメンションを作成」。
各ディメンションで **範囲＝イベント**、**イベントパラメータ＝§2 の「パラメータ」を厳密一致入力**。

通常はオーナーが実施する。自動化経路は
`.claude/scripts/google-admin/README.md`の承認付きGA4 Admin APIだけとし、
`GOOGLE-ADMIN-AUTOMATION-01`完了前は新しい自動登録を行わない。
PlaywrightはGSC linkとLibrary collectionのAPI非提供操作だけに使う。
権限、既存dimension削除/置換、timezone、data retention等は常に対象外。

### 登録状況を機械で確定させる (❓要確認 の解消手順)

台帳 §2 の `❓要確認` は「コード上は登録前提だが GA4 実登録を確認していない」状態で、放置すると
効果判定の前提が未確定のまま残る。次のコマンドが台帳を機械的に読み、GA4 Admin API の
custom dimension 実データと突合して確定させる (API・browser 無し・read-only。CI でも実行できる)。

```bash
npm run google-admin:audit-api
```

出力の `custom dimension 突合:` 行が verdict 別件数を出す。判定の意味:

| verdict | 意味 | 次の行動 |
|---|---|---|
| `verified-registered` | ❓ だったが実際に登録済み | 台帳を `✅登録済 (日付)` に更新する |
| `verified-absent` | ❓ で実際は未登録 | 台帳を `⏳要登録` に更新し §1 の手順で登録する |
| `ledger-claims-registered-but-absent` | 台帳が登録済みと言うのに GA4 に無い | **台帳が誤っている**。実登録を確認して是正する |
| `confirmed-absent` | ⏳要登録 のとおり未登録 | §1 の手順で登録する |

突合ロジックは `.claude/scripts/google-admin/dimension-ledger.mjs` (pure・テスト付き)。
パラメータ名は単語境界で照合するので `ad_id` が `ad_idx` に誤マッチしない。
**推測で台帳の ❓ を ✅ に変えない** — このコマンドの実出力を根拠にする。

確認 (登録 24–48h 後): GA4「探索（自由形式）」で ディメンション＝当該パラメータ・指標＝イベント数・
フィルタ＝`eventName = <イベント>` → 値別に行が分かれれば成功（`(not set)` に潰れていれば名前ミス or 反映待ち）。

---

## 2. イベント × パラメータ × 登録状況 台帳 (★真実源)

凡例: **登録** = GA4 カスタムディメンション登録が必要 / **要否×** = GA4 標準パラメータ or 登録不要 /
状態 `✅登録済 (日付)` = 実登録を確認済 / `⏳要登録` = 登録が要るが未登録 / `❓要確認` = コード上は登録前提だが GA4 実登録を未確認。

| イベント | 関数 (events.ts) | 登録が要るパラメータ | 状態 | ドメイン所有 |
|---|---|---|---|---|
| `nav_click` | `trackNavClick` | `nav_label` / `nav_surface`（`nav_href` は任意） | ✅登録済 (2026-07-20) | UI (P0-1) |
| `rail_click` | `trackRailClick` | `rail_widget` / `rail_slot`（`rail_href` は任意） | ✅登録済 (2026-07-20) | UI (P0-2) |
| `affiliate_click` | `trackAffiliateClick` | `affiliate_vertical` / `affiliate_category` / `link_position` / `experiment_id` / `variant_id` / `creative_size` | **✅登録済 (2026-07-06)** | `affiliate-ads-standards.md §6` |
| `affiliate_click` (ad_id のみ) | `trackAffiliateClick` | `ad_id` | **✅登録済 (2026-07-28)** — google-admin Playwright runner で `Affiliate ad ID` (scope=Event, param=`ad_id`) を実登録・reload 後に画面 verify (最終変更日 2026年7月28日)。集計反映は 24-48h・非遡及のため、API で `customEvent:ad_id` が引けるのは反映後 | `affiliate-ads-standards.md §6` |
| `affiliate_impression` | `AdImpressionTracker` | `affiliate_vertical` / `affiliate_category` / `link_position` / `experiment_id` / `variant_id` / `creative_size` | **✅登録済 (2026-07-31 API確認)** — dimensionはparameter名に紐づき、イベント名改名後もlive定義に存在 | `affiliate-ads-standards.md §6` |

> **★2026-08-04: impression 計装の欠落を是正した (分母の系統的欠測)。** それまで
> `AdImpressionTracker` を通していたのは `BannerAd` と `AffiliateTextAdList` の 2 系統だけで、
> **`NativeAffiliateRow` / `FurusatoNozeiCard` / `RakutenItemsCard` の 3 つはクリック
> (`TrackedAffiliateLink`) だけを送り impression を送っていなかった**。native 枠は blog /
> ranking / category / survey / tag / themes / home / compare / 市区町村とほぼ全ページ種別に
> 出るため、**分子にクリックが入り分母に impression が入らない**状態で CTR が系統的に歪んでいた
> (2026-08-02 の 28 日実測では impression 3,400 に対し native 枠の行が 1 つも存在しない)。
> 3 コンポーネントを計装し、アフィリエイト広告を描画する全 9 コンポーネントが計測対象になった。
>
> 併せて **`affiliate_vertical` の汚染も是正した**。native 枠は `trackingCategory`
> (例 `category-landweather` / `survey-<key>` / `home`) を計測 category に渡しており、
> 10 軸外の値が `affiliate_vertical` に流れていた (実測で "other" バケットが imp の 61% を占有)。
> 解決層 `ResolvedAffiliateBanner` に `vertical` を持たせ、描画側はこれを送る。ページ文脈は
> `link_position` (例 `category-native`) が担うため情報は失われない。
>
> **この是正の前後で impression 数と CTR は不連続になる** (計装漏れが埋まるため impression は
> 増え、CTR は下がる)。2026-08-04 より前の窓と比較しないこと。効果判定は是正後 2 週間の
> 実測が揃ってから行う (`.claude/rules/evidence-based-judgment.md`)。
| `cta_click` | `trackCtaClick` | `link_position` | ✅登録済 (2026-07-31 API確認) | buzz-map §7.3 / ファネル |
| `cta_click` | `trackCtaClick` | `cta_id` / `content_id` / `target_type` / `target_key` | ⏳要登録 (2026-07-31 API確認) | buzz-map §7.3 / ファネル |
| `home_featured_impression` / `home_featured_click` | `trackHomeFeatured*` | `experiment_id` | ✅登録済 (2026-07-31 API確認) | `apps/web/src/features/ranking/components/FeaturedRankings/README.md` |
| `home_featured_impression` / `home_featured_click` | `trackHomeFeatured*` | `card_variant` / `slot` / `experiment_variant` | ⏳要登録 (2026-07-31 API確認) | `apps/web/src/features/ranking/components/FeaturedRankings/README.md` |
| `ranking_view` | `trackRankingView` | `ranking_key` / `category_key` / `area_type` / `year_code` | ✅登録済 (2026-07-31 API確認) | ranking |
| `file_download` | `trackCsvDownload` | `ranking_key` / `year_code`（`file_name`/`file_extension` は GA4 標準） | ✅登録済 (2026-07-31 API確認) | ranking |
| `year_change` / `area_type_change` | `trackYear*` / `trackAreaType*` | `ranking_key` ほか（分析頻度低・登録は任意） | 任意 | ranking |
| `search` | `trackSearch` | `search_term` は GA4 推奨イベント標準（要否×） | 要否× | 検索 |
| `share` | `trackShare` | `method` / `content_type` / `item_id` は GA4 標準（要否×） | 要否× | 共有 |
| `page_not_found` | `trackNotFound` | `page_path` / `page_referrer`（登録不要・レポート可） | 要否× | 監視 |

> `❓要確認` は「code コメントで登録前提と書かれているが、GA4 管理画面での実登録を確認していない」状態。
> `.claude/rules/evidence-based-judgment.md` に従い、GA4 で実登録を確認したら `✅登録済 (日付)` に更新する。
> 推測で `✅` にしない。
>
> **2026-07-31 API監査**: GA4 Admin API `properties.customDimensions.list`を
> `GOOGLE_SERVICE_ACCOUNT_KEY_JSON`のread-only認証で実行し、live custom dimension 16件を取得した。
> 台帳とのexact parameter突合で上表の7 parameterが未登録、その他の`❓要確認`は登録済みと確定した。
> 実行層の恒久API化は`GOOGLE-ADMIN-AUTOMATION-01`で追跡する。
>
> ## ✅ 解消: `ad_impression` の衝突 → `affiliate_impression` へ改名 (2026-07-28)
>
> **改名日: 2026-07-28。** 以下は改名前の実測記録 (経緯として保持する)。改名後は
> `affiliate_impression` が自前 impression の唯一のイベント名で、AdSense が生成する
> `ad_impression` とは名前空間が分かれている。**改名日より前の窓では `affiliate_impression` は
> 0 件になるのが正しい**ので、`fetch-affiliate-ga4.cjs` は 2026-07-28 以降に絞って読むこと。
>
> ---
>
> **(改名前の記録) 自前のアフィリエイト impression 計測 (`AdImpressionTracker`) が使っていた
> `ad_impression` は、GA4 の AdSense 連携が自動生成するイベント名と同じ**だった。実測で衝突が確定した:
>
> ```
> ad_impression × adSourceName (直近7日) → "Google AdSense account (pub-7995274743017484)" = 3,346 件 (総数と完全一致)
> ad_impression × adUnitName             → サイドバー右上 1,148 / stats47-ranking 738 / 広告 351 …
> ad_impression × adFormat               → ON_PAGE 2,362 / INTERSTITIAL 807 / SHOPPING_LINK 53 …
> ```
>
> - **自前イベントは 1 件も記録されていない** (AdSense 分の 3,346 が総数と一致するため残余ゼロ)。
>
> **原因は 2 つある (2026-07-27 に切り分け済)。**
>
> **原因① `AdImpressionTracker` の発火順バグ (これが 0 件の主因) — ✅ 2026-07-28 修正済** —
> `apps/web/src/features/ads/components/AdImpressionTracker.tsx` の timer で
> **`firedRef.current = true` を `if (window.gtag)` ガードより前に実行**している。gtag は
> `GoogleAnalytics.tsx` で `strategy="afterInteractive"` 遅延読み込みなので、初期表示から画面内にある
> 広告 (サイドバー等) は交差後 1 秒で発火し、その時点で gtag 未定義だと**送信されないまま「発火済み」に
> なり永久に失われる** (再試行なし)。`nav_click` が正常なのはユーザー操作 = gtag 読込後だから。
> **修正 (実施済)**: `send()` が gtag 送信に成功したときだけ `firedRef` を立て、未準備なら
> 500ms 間隔で最大 10 回リトライする (合計 ~5 秒)。**ガードの単純撤去は不可** (gtag 未定義で例外になる)。
>
> **原因② イベント名が GA4 予約名** — `ad_impression` は公式の reserved event names に含まれる
> ([Reserved event names](https://support.google.com/analytics/answer/13316687)、アクセス 2026-07-27)。
> ただし**予約名でも送信が通る場合はある**: 同じ予約名の `file_download` は自前パラメータ `ranking_key`
> ごと正常に届いている (28日で 273 件・内訳取得可)。よって「予約名だから破棄」とは**断定できない**。
> それでも改名は必要で、理由は破棄ではなく**AdSense 連携が同名イベントを大量生成するため自前分と
> 区別できず分析不能**になること (`adSourceName` で分離しようとしても残余ゼロで検証不能)。
> `affiliate_click` は予約名でなく正常に動いているので `affiliate_impression` への改名が安全。
> - 改名前は **affiliate の CTR は分母が存在せず計測不能**だった。当時「CTR 0.079%」等と報告された値は
>   **アフィリエイトの click を AdSense の impression で割った無意味な数字**なので採用してはならない。
> - **対処 (✅ 2026-07-28 実施)**: 自前イベントを `affiliate_impression` へ改名して名前空間を分離し、
>   `fetch-affiliate-ga4.cjs` の `EVENTS` も追従した。**履歴の分断は実質ゼロ** — 自前 `ad_impression` は
>   0 件だったため失う時系列が無い。**デプロイ 24-48h 後に `fetch-affiliate-ga4.cjs 7` で
>   `affiliate_impression` が 0 件でなく `affiliate_vertical` 別に内訳が割れることを確認する**
>   (割れなければ dimension 再登録が必要 = 下記の想定が誤り)。
> - `affiliate_vertical` / `affiliate_category` / `link_position` / `creative_size` / `experiment_id` /
>   `variant_id` は **2026-07-06 に登録済** (GA4 管理画面で確認)。**未登録は `ad_id` のみ** — GA4 API が
>   `customEvent:ad_id` を invalid dimension として拒否するため、案件別 CTR は登録するまで取れない。
>   カスタムディメンションは**イベント名ではなくパラメータ名**に紐づくため、イベント改名では
>   再登録不要と考えている (未検証・上記の確認で判定する)。
> - 取得コマンド: `node .claude/scripts/ads/fetch-affiliate-ga4.cjs [days]`。
>   **窓が登録日 (2026-07-06) または改名日 (2026-07-28) より前に伸びると (not set) / 0 件が混ざる**ので、
>   それ以降に絞って読むこと。
>
> **nav_label の値変更 (2026-07-20)**: R1 (ヘッダー IA 再編) で mobile drawer のラベルを
> desktop に統一した (「地域の特徴」→「都道府県」/「ブログ」→「統計ブログ」)。`nav_label` は
> 表示ラベルをそのまま送るため、この日以降 surface 間で値が揃う。効果判定で 2026-07-20 前後の
> `nav_label` 値の連続性が切れる点に注意 (旧値は drawer のみに存在)。
>
> **nav_surface の値追加 (2026-07-23・AREAS-DIRECTORY-UX-01)**: `/areas` の県選択導線に
> `areas_search` / `areas_list` / `areas_map` を追加した。既存 GA4 custom dimension `nav_surface`
> の**値追加**であり新しい dimension は増やしていない (登録済 dimension のまま内訳が増える)。
> `/areas` の選択率を導線別 (検索/一覧/地図) に判定する際はこの 3 値を使う。県名は `nav_label`、
> 遷移先は `nav_href` (`/areas/<5桁code>`)。`trackNavClick` の呼び出し元は `AreaSearch` /
> `AreaSelectionPanels` (`apps/web/src/features/area-profile/`)。
>
> **theme_kpi_switcher の送信条件変更 (2026-08-06)**: テーマページの指標カードを
> 単一選択 (タブ) から複数チェックへ変えた。`nav_click` は**チェック ON のときだけ**送る
> (OFF は関心の表明ではなく、送ると ON/OFF が相殺されて「どの指標が見られたか」が読めない)。
> 既存 dimension の値追加ですらない (surface 値は不変) が、**同一セッション内の送信回数が
> 増える** — 1 カードで複数指標をチェックできるようになったため。2026-08-06 前後で
> `theme_kpi_switcher` の件数を単純比較しないこと。

> **nav_surface の値追加 (2026-08-05)**: category ページ左のカテゴリナビに
> `category_sidebar` を追加した (既存 `nav_surface` dimension の**値追加**・新 dimension なし)。
> home の左ペインと同じ `PortalCategoryGrid` を別配置で使うため、既定の `home_category` の
> ままだと **home の click と混ざって導線別の内訳が取れなくなる**。`TrackedPortalCategoryLink`
> に `surface` prop を足し、home 側は未指定で挙動不変。値は `trackNavClick` の union で縛る。
>
> **nav_surface の値追加 (2026-08-22)**: category ページ本文の関連記事カードに
> `category_blog` を追加した。home と共通の `PortalBlogCard` を使う一方、home のブログ導線と
> category 内の関連記事導線を混在させずに内部 CTR を比較するための値追加である。
>
> **nav_surface の値追加 (2026-08-22・survey taxonomy)**: ranking / category / theme / blog から
> 調査ハブへ向かう `ranking_survey` / `category_survey` / `theme_survey` / `blog_survey` と、
> 調査ハブからコンテンツへ戻る `survey_ranking` / `survey_theme` / `survey_blog` を追加した。
> いずれも登録済み `nav_surface` / `nav_label` の値追加で、新しい custom dimension は無い。
> 週次 GA4 snapshot は Japan-only の `survey_ranking` を `survey-navigation.csv` に保存し、
> survey portfolio の `metrics.internalNav.rankingOutboundClicks` を非重複56日で集計する。
>
> **nav_surface の値変更 (2026-08-22)**: home / category / `/areas` の県選択UIを共通の
> `PrefectureNavigator` へ統合した。home の旧単一入口 `home_area` は送信を終了し、直接選択を
> `home_area_map` / `home_area_list` で送る。category は `category_area_map` /
> `category_area_list` を追加した。`areas_search` / `areas_map` / `areas_list` は変更しない。
>
> **nav_surface の値追加 (2026-07-23)**: ポータル型 home の発見セクションに
> `home_category` / `home_use_case` / `home_area` / `home_blog` を追加した
> (既存 `nav_surface` dimension の**値追加**・新 dimension なし)。home → カテゴリ/テーマ/都道府県/
> ブログのclick内訳を導線別に判定するのに使う。呼び出し元は
> `apps/web/src/features/home-portal/`。検索はHeaderの`trackSearch`
> (GA4標準`search`)を使う。なお `home_area` は 2026-08-22 に上記の map/list 2値へ置換した。

---

## 3. 新しい計装を追加するときの手順

1. `events.ts` に関数・パラメータを追加（既存の `sendEvent` 経由）。
2. **本ファイル §2 に 1 行追加**し、登録要否と状態 (`⏳要登録`) を記す。
3. 登録が要るなら §1 の手順をオーナー、または明示承認済みallowlist runnerが実施
   → 実登録を確認して `✅登録済 (日付)` に更新。
4. 効果判定 (effect/*) は、そのイベントの内訳が `(not set)` に潰れず取れることを確認してから行う
   （`.claude/rules/evidence-based-judgment.md`）。未登録の間は eventName 総数のみで判定しない。

## 4. 禁止事項

| NG | OK |
|---|---|
| パラメータ名を events.ts と GA4 で不一致にする | 完全一致（半角小文字 `_`） |
| 未登録のまま内訳ベースで effect/* を断定 | 登録・反映を確認してから内訳判定（総数のみなら明記） |
| 登録状況をコメント/handoff に散らす | 本ファイル §2 の台帳に集約 |
| ドメイン詳細（affiliate 等）を本台帳に二重定義 | ドメイン SSOT を参照（§0） |

## 5. 役割分担

| 工程 | 担当 |
|---|---|
| イベント定義 (events.ts) の実装・パラメータ設計 | 各 UI/機能オーナー agent（横断 UX 計装配線 = `site-ux-manager`、ページ内 = `ranking-ui-manager` / `theme-ui-manager`、広告 = `affiliate-manager` ほか） |
| **本台帳 §2 の維持・登録状況の追跡・実登録の確認** | `ga4-analyst`（GA4 計測の所有者） |
| カスタムディメンション登録 | 人間（オーナー）、または`google-admin`の明示承認済みAdmin API（Playwrightは使わない） |
| effect/* 判定 | `improvement-triage`（登録・反映確認を前提に） |

## 関連

- コード SSOT: `apps/web/src/lib/analytics/events.ts`
- 実証判定: `.claude/rules/evidence-based-judgment.md`
- ドメイン別: `.claude/rules/affiliate-ads-standards.md §6`（affiliate）/ `apps/web/src/features/ranking/components/FeaturedRankings/README.md`（home-featured）/ `.claude/rules/buzz-map-standards.md`（cta/buzz-map）
- UI 施策の効果判定: `.claude/todo/backlog.md` `[UI-CONSOLIDATION-RESIDUAL]`
- agent: `.claude/agents/ga4-analyst.md`
