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
| **登録状況 (台帳 SSOT)** | 本ファイル §2 | 各パラメータが GA4 カスタムディメンション登録を要するか・登録済みか。**人間タスクの追跡はここ** |
| ドメイン別の詳細 (参照) | affiliate=`affiliate-ads-standards.md §6` / home-featured=`docs/02_実装計画/28` / buzz-map=`buzz-map-standards.md` | 各ドメインの登録手順・値の意味。本台帳はこれらを**再所有せず参照**する |

- **パラメータ名はコードと GA4 で完全一致が必須**（半角・小文字・`_`）。1 文字違うと永久に紐づかない。
- カスタムディメンションは**登録後のデータにのみ適用**（遡及しない）。集計反映は 24–48h。
- 無料枠の event-scoped カスタムディメンションは最大 50 個。

---

## 1. GA4 カスタムディメンション登録手順 (人間タスク)

GA4 → 管理（歯車）→ プロパティ列「データの表示」→「カスタム定義」→「カスタムディメンションを作成」。
各ディメンションで **範囲＝イベント**、**イベントパラメータ＝§2 の「パラメータ」を厳密一致入力**。

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
| `affiliate_click` | `trackAffiliateClick` | `affiliate_vertical` / `affiliate_category` / `link_position` / `ad_id` / `experiment_id` / `variant_id` / `creative_size` | ❓要確認 | `affiliate-ads-standards.md §6` |
| `cta_click` | `trackCtaClick` | `cta_id` / `link_position` / `content_id` / `target_type` / `target_key` | ❓要確認 | buzz-map §7.3 / ファネル |
| `home_featured_impression` / `home_featured_click` | `trackHomeFeatured*` | `card_variant` / `slot` / `experiment_id` / `experiment_variant` | ❓要確認 | `docs/02_実装計画/28 §9.3` |
| `ranking_view` | `trackRankingView` | `ranking_key` / `category_key` / `area_type` / `year_code` | ❓要確認 | ranking |
| `file_download` | `trackCsvDownload` | `ranking_key` / `year_code`（`file_name`/`file_extension` は GA4 標準） | ❓要確認 | ranking |
| `year_change` / `area_type_change` | `trackYear*` / `trackAreaType*` | `ranking_key` ほか（分析頻度低・登録は任意） | 任意 | ranking |
| `search` | `trackSearch` | `search_term` は GA4 推奨イベント標準（要否×） | 要否× | 検索 |
| `share` | `trackShare` | `method` / `content_type` / `item_id` は GA4 標準（要否×） | 要否× | 共有 |
| `page_not_found` | `trackNotFound` | `page_path` / `page_referrer`（登録不要・レポート可） | 要否× | 監視 |

> `❓要確認` は「code コメントで登録前提と書かれているが、GA4 管理画面での実登録を確認していない」状態。
> `.claude/rules/evidence-based-judgment.md` に従い、GA4 で実登録を確認したら `✅登録済 (日付)` に更新する。
> 推測で `✅` にしない。
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
> **nav_surface の値追加 (2026-07-23・HOME-PORTAL-REDESIGN-01)**: ポータル型 home の発見セクションに
> `home_category` / `home_use_case` / `home_area` / `home_buzz_map` / `home_blog` を追加した
> (既存 `nav_surface` dimension の**値追加**・新 dimension なし)。home → カテゴリ/テーマ/都道府県/
> バズマップ/ブログの click 内訳を導線別に判定するのに使う。呼び出し元は `PortalNavCard`
> (`apps/web/src/features/home-portal/`)。home 検索は `trackSearch` (GA4 標準 `search`) を使う
> (`HomeSearch` / Header `HeaderClient` の submit)。現状 `home_buzz_map` (バズ section 未実装) と
> `home_blog` (blog カード未計装) は値予約のみで未送出。

---

## 3. 新しい計装を追加するときの手順

1. `events.ts` に関数・パラメータを追加（既存の `sendEvent` 経由）。
2. **本ファイル §2 に 1 行追加**し、登録要否と状態 (`⏳要登録`) を記す。
3. 登録が要るなら §1 の手順を人間（オーナー）が実施 → 実登録を確認して `✅登録済 (日付)` に更新。
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
| カスタムディメンション登録（GA4 管理画面操作） | 人間（オーナー） |
| effect/* 判定 | `improvement-triage`（登録・反映確認を前提に） |

## 関連

- コード SSOT: `apps/web/src/lib/analytics/events.ts`
- 実証判定: `.claude/rules/evidence-based-judgment.md`
- ドメイン別: `.claude/rules/affiliate-ads-standards.md §6`（affiliate）/ `docs/02_実装計画/28`（home-featured）/ `.claude/rules/buzz-map-standards.md`（cta/buzz-map）
- UI 施策の効果判定: `docs/todo/02_機能バックログ.md` `[UI-CONSOLIDATION-RESIDUAL]`
- agent: `.claude/agents/ga4-analyst.md`
