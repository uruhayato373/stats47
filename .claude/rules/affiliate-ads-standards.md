# アフィリエイト広告 標準 (SSOT + 意図ハブ + 共通ルール)

`apps/web/scripts/affiliate-ads-data.ts` (`AFFILIATE_ADS: AffiliateAd[]`) を SSOT とする、
アフィリエイト広告の **意図軸 (vertical)・利用プログラム・サイズ・配置/priority・計測** の**単一ソース**。
`affiliate-manager` agent / `/register-affiliate-banner` / `/affiliate-improvement` / 人間はこれに従う。

> 背景: (1) マルチカテゴリ案件を categoryKey ごとに 8-9 件複製し 74 エントリ=実質34広告主に膨張、
> (2) theme(20軸)→広告の写像が無く /themes に在庫が出ない、(3) `tourism` 枠に転職・研修広告が混在し
> 旅行ページに旅行広告が出ない、(4) GA4 custom dimension 未登録で枠別 CTR が取れない、という不統一があった。
> **「意図ハブ」設計**でこれを是正する: コンテンツ分類 (category 17 / theme 20 / tag) は SEO/UX 用として
> 統合せず、**広告意図軸 `AffiliateVertical` (10 軸) を単一ハブ**とし、全分類 → vertical の写像を
> `affiliate-category.ts` に集約する。広告は `vertical` を正として持ち、解決は **ページ → vertical → 広告**。
> 完全DBレス: SSOT は git TS、配信は R2 (永続 DB を持たない)。

## 0. 意図軸 (10 vertical) — 広告解決の実軸

`AffiliateVertical` (`apps/web/src/features/ads/constants/affiliate-category.ts`):

`labor` / `housing` / `population` / `economy` / `health` / `energy` / `travel` / `furusato` / `education` / `mobility`

全コンテンツ分類はこの 10 軸へ写像する (ハブは `affiliate-category.ts` の 3 map):

| 写像 | 定義 | 用途 |
|---|---|---|
| `CATEGORY_AFFILIATE_MAP` | e-Stat 17 categoryKey → vertical | ranking / category ページ |
| `THEME_AFFILIATE_MAP` | theme 20 スラッグ → vertical | テーマページ (`/themes/*`) |
| `TAG_AFFILIATE_MAP` | blog tagKey (英/日) → vertical | blog 記事サイドバー / ネイティブ |

- vertical の追加・写像変更は **`affiliate-category.ts` だけ**で行う (skill/agent は参照のみ)。
- `AffiliateCategory` は `AffiliateVertical` の `@deprecated` 型 alias (段階移行の互換)。

## 1. SSOT とデータフロー

```
apps/web/scripts/affiliate-ads-data.ts (AFFILIATE_ADS = git TS SSOT・広告は vertical を持つ)
  → export-affiliate-ads-snapshot.ts (vertical∈10軸 を検証) → R2 app/affiliate-ads/all.json
  → resolve-affiliate-ad.ts (配信時に ページ→vertical→広告 で解決・priority 降順)
  → apps/web/src/features/ads/ コンポーネントが描画
```

- 解決は `adVertical(ad) = ad.vertical ?? CATEGORY_AFFILIATE_MAP[ad.categoryKey]`。移行期は categoryKey フォールバック、Step B で `vertical` 必須化。
- **反映 (公開) は develop への push で `publish-affiliate-ads.yml` が自動発火** (workflow_dispatch ではない)。ローカルからの R2 push は不可。
- **手編集 JSON を SSOT にしない。** 必ず git TS を編集 → CI が R2 を生成。

## 2. 利用プログラム表 (vertical → 提携状況 → 送客ページ)

| vertical | 主プログラム | 提携 | 主な送客ページ |
|---|---|---|---|
| `travel` (旅行・宿泊) | じゃらん / OZmall / TravelWest ✅ ・ **国内OTA (楽天トラベル/一休/Booking) 要提携** | 一部✅ | `/ranking/travel-participation-rate-overnight` (note #1 ファネル)・観光系 ranking・`/themes/tourism` |
| `labor` (転職・年収) | STRATEGY CAREER / 就職エージェントneo / AI就労支援 / IT求人 ✅ | ✅ | 年収・所得・職業別 ranking・`/themes/{labor-wages,occupation-salary}` |
| `housing` (住宅・引越し) | 不動産・住宅バナー / ビルドジョブ(施工管理) ✅ ・ **引越し比較 (引越し侍等) 要提携** | 一部✅ | `/areas`・住宅・地価・建設 ranking・`/themes/living-housing` |
| `economy` (投資・保険・家計) | FP無料相談 / SBI証券 / 未来保険 / ConoHa ✅ | ✅ | 県民所得・貯蓄率・物価 ranking・`/themes/{consumer-prices,real-income}` |
| `health` (健康・医療) | RIZAP / ClassPass / マカエンペラー / Repilates ✅ | ✅ | 医療・社会保障・健康 ranking・`/themes/{healthcare,aging-society}` |
| `energy` (通信・エネルギー) | ahamo / SoftBank Air ✅ | ✅ | エネルギー・通信 ranking |
| `population` (人口・子育て) | 汎用バナー ✅ | ✅ | 人口・世帯・子育て ranking・`/themes/population-dynamics` |
| `furusato` (ふるさと納税) | イオン九州 ✅ ・ **さとふる/楽天ふるさと納税 要提携** | 一部✅ | `/areas`・財政・地域 ranking・`/themes/local-finance` |
| `education` (通信教育・資格) | LEC東京リーガルマインド / AI Agent Camp ✅ ・ スタディサプリ等 要提携 | ✅ | 教育 ranking・`/themes/education-culture` |
| `mobility` (自動車・交通) | 保険スクエアbang! (自動車保険一括見積) / ユーカーパック (車査定) ✅ | ✅ | 交通事故・交通安全 ranking・`/themes/{roads,railway,ports,safety}` |

- 提携状況 (提携済/申請中/要提携) の真実源は本表。`/register-affiliate-banner status` はこれを読む。
- **在庫数・ゼロ/手薄軸は本表に書かない** (変動値)。必ず `.claude/state/ads/inventory-latest.json` の
  `coverage.gapVerticals` / `thinVerticals` (または集約 state `affiliate-operations-latest.json`) から読む。

## 3. フォーマット & サイズ規約 (canonical 4 種・lint enforced)

新規登録は下記 **4 種のみ**。lint (`audit-affiliate-inventory.ts --check-size`・pre-commit) が canonical/legacy 以外を弾く。

| フォーマット | サイズ | 用途 | 主な locationCode |
|---|---|---|---|
| レクタングル (主) | **300×250** | 既定。blog 本文下 / ranking / sidebar | `blog-bottom` / `sidebar-sticky` |
| スクエア | **250×250** | 正方形クリエイティブ (じゃらん等) | `blog-bottom` |
| モバイル横長 | **320×100** | モバイル枠 | `blog-bottom` |
| テキスト | (サイズなし) | sidebar テキストリンク | `sidebar-bottom` |

**legacy 一点物** (grandfathering・新規禁止・段階移行): `160×600` / `120×600` / `165×120` / `320×250` / `336×280` / `300×300`
→ 再取得時に 300×250 か text へ寄せる。`KNOWN_LEGACY_SIZES` (audit script) で許容中。**新規はこれらも不可** (canonical のみ)。

- **サイズがコードに明記されない ASP** (ValueCommerce の gifbanner / 楽天の pict) は `inspect-banner.mjs` で
  **画像を fetch して実測**する (2x 高解像度素材は表示サイズ=実寸/2)。A8 は `<img width/height>` で明記される。
- **A8 以外は別インプレッションピクセルを持たない** → `trackingPixelUrl: null` (解決層は imageUrl のみ必須)。

## 4. 配置 & priority 規約

### 解決 (`resolve-affiliate-ad.ts`)

| ページ種別 | 解決キー |
|---|---|
| ranking / category | `categoryKey` → vertical の banner (priority 上位) → text → AdSense fallback |
| blog | 記事 `tags` → vertical の banner/text |
| theme | `relatedArticleTagKeys` → vertical、空なら `THEME_AFFILIATE_MAP[themeKey]` → vertical (フォールバック) |
| area | `locationCode="area-sidebar"` の banner |

### priority 規約

- **ページ意図に合致するプログラムを上位**にする。例: 旅行ランキング → じゃらん `priority: 100` (travel 最上位)。
- 意図不一致の汎用広告 (研修 / 汎用キャリア等) を**意図特化ページの上位に置かない**。
- **1 案件 = 1 エントリ** (vertical + placement)。同一プログラムを categoryKey ごとに複製しない (旧方式の廃止)。
  複数 placement (blog-bottom + area-sidebar 等) が要る場合のみ placement 別に分ける。

## 5. 禁止事項

| NG | OK |
|---|---|
| `affiliate-ads-data.ts` 以外 (R2 JSON 等) を手編集して真実源化 | git TS を編集 → CI が R2 生成 |
| 同一プログラムを categoryKey ごとに 8-9 件複製 | vertical を 1 つ持たせ 1 エントリ (ページ→vertical で解決) |
| canonical 4 種以外のサイズで新規登録 | 300×250 / 250×250 / 320×100 / text |
| 意図不一致の汎用広告を特化ページ上位に置く | ページ意図適合プログラムを上位 priority |
| `vertical` を 10 軸外の値にする | `AffiliateVertical` の 10 軸から選ぶ (export validation が弾く) |

## 6. GA4 計測 (custom dimension 登録) ★ユーザー操作が必要

イベントは実装済 (`ad_impression` / `affiliate_click`)。だが **GA4 管理画面で custom dimension を登録しないと
枠別・意図軸別の内訳が取れず eventName 総数に落ちる** (P1-AFF-01 ゲート)。以下を **ユーザーが GA4 で登録**する:

**登録手順**: GA4 管理画面 → 管理 → データの表示 → **カスタム定義** → カスタムディメンションを作成。
下表の各行を「スコープ=イベント」で作成する (反映に 24-48h)。

| ディメンション名 | イベントパラメータ | 用途 |
|---|---|---|
| Affiliate Vertical | `affiliate_vertical` | ★canonical 意図軸 (10 軸)。枠がどの意図で効くか |
| Affiliate Category | `affiliate_category` | 後方互換 (旧 8 軸時代の時系列連続性) |
| Link Position | `link_position` | 配置別 (sidebar / blog-bottom 等) |
| Experiment ID | `experiment_id` | A/B (AFF-05) |
| Variant ID | `variant_id` | A/B クリエイティブ別 |
| Creative Size | `creative_size` | サイズ別 CTR |

**ゲート解除条件**: 登録 48h 後に `node .claude/scripts/ads/fetch-affiliate-ga4.cjs` を実行し、
`affiliate_vertical` 内訳 (行が vertical 別に分かれる) が取れること。取れたら effect 判定を意図軸ベースで行える。
それまで `/affiliate-improvement` の効果判定は総数ベースと明記する (`.claude/rules/evidence-based-judgment.md`)。

## 7. 登録フロー (`/register-affiliate-banner` — 対話式ループ)

`affiliate-manager` がユーザーと 1 件ずつ対話しながら在庫を増やす。mode: `propose`(既定) / `register` / `direct` / `status`。

- **`propose`**: audit (`audit-affiliate-inventory.ts`) の vertical カバレッジ + GA4/GSC トラフィックを突合し、
  「在庫ゼロ/手薄 × 高トラフィック」の vertical を特定 → §2 表と照合し **次に提携すべき 1 プログラム**を根拠
  (想定 imp 機会・単価帯・送客ページ) つきで提示 → ユーザーが ASP (A8 等) で提携申請。**1 回 1 件**。
- **`register`**: ユーザーが承認済みプログラムの HTML コードを貼付 → ASP 別に href/imageUrl/pixel/size 抽出
  (A8=pixel あり / **ValueCommerce・楽天アフィリエイトは別ピクセル無し → `trackingPixelUrl: null`**、サイズもコードに出ない)
  → **`inspect-banner.mjs` で画像を fetch しサイズ実測 + canonical 判定 + Read で広告主目視判別**
  (canonical 以外は登録拒否・正サイズ素材の再取得を案内) → **vertical 判定** (§2 表 + ユーザー確認)
  → `AFFILIATE_ADS[]` に **1 エントリ**追記 (categoryKey 複製しない) → tsc + audit + export dry-run
  → commit 準備 (push はユーザー判断・develop push で R2 反映) → 次の `propose` へループ。
- **`direct`**: 直接属性方式 (記事本文へのピンポイント配置) の台帳登録。**配置と台帳
  (`apps/web/scripts/affiliate-direct-placements-data.ts`) の追記は必ずセット** — 台帳に無い本文タグは
  `/audit-affiliate-compliance` が「台帳未登録タグ」として弾く。PR 表記 (景表法 2023-10): blog は
  記事冒頭の PR 宣言 + リンク直前 `※PR：` の両方、note は `#PR`/`#広告` を含める。

## 8. 運用フロー (役割分担)

| 工程 | 担当 |
|---|---|
| vertical ハブ (`affiliate-category.ts` の 3 map) の保守 | `affiliate-manager` (本ルール) |
| バナー / テキスト登録 (propose/register/direct) | `affiliate-manager` (skill `/register-affiliate-banner`) |
| 在庫整理・監査・dashboard (`/tmp` 生成・git 管理しない) | `affiliate-manager` (skill `/affiliate-improvement`) |
| compliance 監査 (孤立配置 / PR 表記 / 台帳未登録タグ) | `affiliate-manager` (skill `/audit-affiliate-compliance`、週次 CI `affiliate-dashboard-refresh.yml`) |
| クリエイティブ A/B 実験 (plan/start/observe/decide/close) | `affiliate-manager` (skill `/manage-affiliate-experiment`。勝者の自動反映は禁止) |
| 集約状態 (`affiliate-operations-latest.json`) の生成・計測ゲート判定 | 決定的スクリプト `build-affiliate-operations-state.ts` (週次 CI `affiliate-ga4-weekly.yml`) |
| サイズ / vertical 規約の enforcement | `affiliate-manager` (audit `--check-size` + export validation + pre-commit §6.7/6.8) |
| imp / click / CTR の実測値取得 | `ga4-analyst` / `adsense-analyst` |
| effect/* 判定・改善ログ status | `improvement-triage` |
| R2 公開 | develop push → `publish-affiliate-ads.yml` (CI 自動) |
| 記事内手動配置 (`<affiliate-banner>` タグ) | `blog-editor` / `article-writer` (台帳登録は affiliate-manager) |

## 10. 自動 scout パイプライン (A8 高単価案件)

A8.net の高単価案件を **scout → 提携申請 → 広告コード取得 → SSOT 登録 → R2 公開** まで週次全自動で回す
(skill `/scout-asp`・agent `asp-scout` + `affiliate-manager`)。§7 の手動貼付 (`/register-affiliate-banner`) と
抽出仕様 (`a8-code-core.mjs`) を共有し、案件発見〜申請を自動化した上位互換。判定は全て決定的コード、agent の
意味判断は「pending-vertical の 10 軸解決」と「A8 UI 変化の診断」の 2 点のみ。

### 状態機械 (a8-catalog.json)

```
candidate → applied → approved → harvested → registered → published
既存提携の取り込み: import-partnered が A8 の提携中プログラムを直接 approved で登録 (candidate/applied を経ない)
分岐: rejected(審査落ち・再申請しない) / blocked(blocklist) / pending-vertical(map未解決・register不可) / error(step+screenshot)
```

- **既存提携の活用 (`import-partnered`)**: A8 で既に提携済みのプログラムは申請不要で harvest → register → 公開へ
  直行できる。`upsertApproved` が全ページ巡回で catalog に approved 登録 (既存 registered/published は巻き戻さない)。
- **apply は 1 クリックで送信確定** (A8 新コンソール仕様)。ボタンを押せた時点で申請済みとして扱い、週上限は
  「送信回数」で機械強制する (成功文言の検出に依存させない = 上限すり抜けの再発防止・2026-07-20 の 16/10 超過を是正)。

- 状態と遷移の検証は `a8-scout-core.mjs` (不正遷移は throw)。catalog は状態を巻き戻さない upsert。
- **審査あり案件は applied で待ち、check-approval が毎週 applied 全件を再走査**して approved に昇格 (再入設計)。

### スコアリング (curated 値・ハードコードしない)

`score = 0.40·rewardNorm + 0.25·epcNorm + 0.15·confirmNorm + 0.20·gapBonus`
(gapBonus: `inventory-latest.json` の gapVertical=1.0 / thinVertical=0.7 / 他=0.2)。係数・上限・blocklist・
vertical 写像・`weeklyApplyMax`・`minScore` の SSOT は `.claude/scripts/ads/data/a8-curated.json`。

### 規律 (機械強制)

| 規律 | 手段 |
|---|---|
| **申請は週 `weeklyApplyMax` 件まで** (A8 スパム判定回避) | `check-a8-apply-budget.cjs` が apply 前に exit 1 で強制 |
| **申請対象は programId で明示指定する** (2026-07-28) | `apply --id <id1,id2>`。指定 ID が candidate に無ければ**中止**。指定しないと candidate を出現順に申請するため、スコアは高いがブランド不適な案件 (美容医療・探偵・高リスク金融等) に送信してしまう。**スコア式は単価と EPC で並べるだけでブランド適合を見ない**ので、対象選定は人/agent の意味判断 |
| **単価・EPC・確定率を catalog に保存する** (2026-07-28) | `upsertCandidates` の `pickEconomics`。欠損 (A8 が `-` 表示) で既存の実測を潰さない。これが無いと「高単価/高確定率で選ぶ」ができず `confirmedEpc`/`computePriority` が常に 0 を見る。**A8 は未提携でも EPC・確定率を開示する** (実測: カード 22 件中 16 件に実値) |
| **NG ジャンル (アダルト/出会い/情報商材/高リスク金融 等) は申請しない** | curated `blocklistKeywords` → status=blocked |
| **既存在庫と重複する案件は候補にしない** | `isDuplicate` (a8mat / title 一致) |
| **canonical 4 種以外のサイズは登録しない** | harvest 時 `parseA8Code` が non-canonical を弾く (§3 と一致) |
| **SSOT 追記は 4 ゲート通過必須** | `append-affiliate-ads.ts` が tsc → audit `--check-size` → export `--validate-only` → compliance `--check`。1 つでも fail で `git checkout` 復元 |
| **セッション失効で cron を壊さない** | isLoggedIn 失敗は catalog に error 記録して正常終了 (exit 0)。再ログインは人間 |

### 実行形態 (★ローカル限定・Mac / Windows 両対応)

- Playwright プロファイル (`.local/playwright-a8-profile`) がローカルにあるため **GitHub Actions では動かない**。
  週次 cron は launchd (`scripts/scheduled/scout-asp-weekly.sh` + `com.stats47.scout-asp-weekly.plist`、日曜 07:00 JST。
  launchd は Mac のみ。Windows では手動または skill 経由で実行する)。
- **プロファイルのパス解決は Mac / Windows 両対応** (2026-07-28)。`process.platform` で分岐せず
  「Mac 本体チェックアウトが実在すればそこ、無ければ**このファイルから解決したリポジトリ root**」の
  フォールバック 1 本で決める (`a8-browser.ts` / `login.mjs` / `asp-browser-base.mjs` で同一規約)。
  Mac パスを直書きすると Windows で別ドライブ配下に空プロファイルを掘り、
  **「ログイン済みなのに未ログイン」**になる (doboku-note で実際に発生)。`process.cwd()` も使わない
  (実行ディレクトリ次第でプロファイルが分裂するため)。
- **申請サイト assert** (誤サイト提携の防止): この A8 口座は stats47 と doboku-note を登録している。
  apply は detail の `<select name="webSiteId">`、harvest は `<select name="websiteId">` (小文字 w・別名) を
  stats47 側に選んでから進み、**選べなければ中止する** (`pickTargetSiteOption`)。ラベル表記ゆれは
  候補配列 + 部分一致で吸収する。
- **初回のみ人間**: `login.mjs` で A8 手動ログイン (credential は env に置かない) → `scout --dry-run` で A8 の
  DOM をダンプしてセレクタ実機調整。これが済むまで cron を load しない。
- A8 の自動操作は会員規約上のリスクがあるため件数を保守的に開始する (`weeklyApplyMax` 初期 10)。

**★週次 cron の中身 (2026-07-27 実測に基づく改訂)**: シェルは `/scout-asp full` を LLM 経由で呼ぶのを止め、
**決定的スクリプトだけ**を順に回す (`check-approval` → `select-for-register --apply` → `harvest --limit 12`
→ `append-affiliate-ads` **dry-run** → catalog サマリ)。トークン消費ゼロで、意味判断が要る pending-vertical は
報告に留めて人間/agent に渡す。

- **`scout` / `apply` (新規申請) は既定で無効** (`APPLY_NEW=0`)。理由は在庫が制約でないことが実測で確定した
  ため: 提携済みで軸解決済みの 49 件のうち**配信中トップを確定EPC で上回るものは 0 件**、かつ GA4 は 28 日で
  clicks 9 件・CTR 0.079%。在庫を週 10 件増やしても収益は動かず A8 への申請リスクだけが増える。
  **再開条件** = GA4 の `affiliate_vertical` dimension が登録され軸別 CTR が読めること (§6)。再開は `APPLY_NEW=1`。
- **cron は SSOT (`affiliate-ads-data.ts`) を書き換えない / develop に push しない**。アプリコードの無人書き換えは
  並行セッションとの git 競合を招き、push は R2 公開 = outward-facing になる。cron は catalog (機械 state) を
  進めるところまでで、実追記と push は `affiliate-manager` + 人間承認。

### 既存提携の配置と priority (収益最大化)

134 件の既存提携から「高 EPC×高確定率」を精選して配置する。同 vertical×枠は priority 上位 1 banner +
text 2 しか出ないため**全登録は無意味** (`select-for-register.mjs` で vertical 別上位 N=4 を精選)。

- **priority = 確定EPC バンド式** (`computePriority` / curated `priorityBands`): 確定EPC = EPC×確定率。
  80(≥1000)/60(≥300)/40(≥100)/20(≥30)/10(欠損)。targetRankingKeys 付与で +5。register 時に catalog
  entry の数値から決定的算出し、buildAdDraft の既定 50 を上書きする。
- **配置は既存フレームで自動**: ページ→vertical 解決 (CATEGORY/THEME/TAG_MAP) で既存枠 (ranking sidebar /
  blog rail・本文 / category・survey・theme の NativeAffiliateRow / area) に priority 順で出る。**新フィールドは
  足さない** (`vertical`/`priority`/`targetRankingKeys`/`locationCode` の 4 つで表現)。theme は
  `resolveAffiliateBannersByVertical` で既に vertical 解決広告を描画済み。
- **サイズは固定** (300×250 canonical 優先・無ければ text)。多くの A8 案件は canonical バナー非提供で text
  fallback が正常。harvest の `fetchAdCode` が canonical バナー優先・非 canonical スキップで選ぶ。

### 計測 (ad_id 単位 CTR) と改善ループ

- **ad_id 計測**: `ad_impression`/`affiliate_click` に `ad_id` (AffiliateAd.id) を送る (events.ts /
  AdImpressionTracker / TrackedAffiliateLink / 各 BannerAd・NativeAffiliateRow 呼び出し元)。GA4 で custom
  dimension `ad_id` (event scope) 登録が要る (**人間ステップ**)。登録前でも送信は開始してよい。
- **(not set) の扱い**: 過去データの大半が (not set) なのは dimension 登録前データの混入。fetch 期間を登録日
  以降に絞る (`fetch-affiliate-ga4.cjs`)。
- **🚨 現状 affiliate の CTR は計測不能 — イベント名衝突 (2026-07-27 実測)**: 自前の impression 計測が使う
  `ad_impression` は **GA4 の AdSense 連携が自動生成するイベント名と同じ**。直近 7 日の `ad_impression`
  3,346 件は `adSourceName` が全件 "Google AdSense account (pub-7995274743017484)" で、**総数と完全一致 =
  自前イベントは 1 件も記録されていない**。よって **CTR の分母が存在しない**。
  - 過去に報告された「CTR 0.079%」等は **affiliate の click を AdSense の impression で割った無意味な値**。
    採用してはならない (`evidence-based-judgment.md`)。
  - 下の「週次改善」(imp>500 で降格) は分母が偽なので**発火させてはならない**。当面 priority は確定EPC 主導。
  - **原因① (0 件の主因)**: `AdImpressionTracker` が `firedRef.current = true` を `if (window.gtag)` ガードより
    **前**に実行しており、gtag (afterInteractive 遅延読み込み) が未準備のタイミングだと送信されないまま
    「発火済み」になり永久に失われる。初期表示から画面内にあるサイドバー広告が該当する。
  - **原因②**: `ad_impression` は GA4 予約名 ([公式](https://support.google.com/analytics/answer/13316687)・
    アクセス 2026-07-27)。ただし同じ予約名の `file_download` は自前パラメータごと正常に届いているため
    「予約名だから破棄」とは断定できない。改名が必要な理由は**AdSense が同名イベントを大量生成し自前分と
    区別できないこと**。
  - **対処 (未実施)**: ①ガード順の修正 (gtag 未準備ならリトライ。単純撤去は例外になるので不可)
    ②`affiliate_impression` への改名 + `fetch-affiliate-ga4.cjs` の `EVENTS` 追従。
    正典: `analytics-event-standards.md`。
  - dimension 側は `affiliate_vertical` 等 6 個が **2026-07-06 登録済**。**未登録は `ad_id` のみ**。
- **週次改善**: imp>500 かつ CTR が vertical 中央値の 1/2 未満 → priority 1 バンド降格 (次点繰り上げ)。
  比較は experiment registry (weight 50/50) で。**週次 1 vertical 1 変更まで** (配信急変防止)。effect 判定は
  evidence-based (improvement-triage)。

### 役割分担 (2-agent)

| 工程 | 担当 |
|---|---|
| A8 ブラウザ操作 (scout/apply/check-approval/harvest) + pending-vertical 解決 | `asp-scout` (skill `/scout-asp`) |
| SSOT 追記 (`append-affiliate-ads.ts`) + commit/push (develop) | `affiliate-manager` (排他 writer) |
| R2 公開 | develop push → `publish-affiliate-ads.yml` (CI 自動) |
| 手動貼付での 1 件登録 (フォールバック) | `affiliate-manager` (`/register-affiliate-banner`) |

## 11. 3 ASP 提携運用とサイト帰属ガード (A8 / もしも / afb)

§10 の A8 scout が「A8 で何を見つけ何を申請したか」を扱うのに対し、本節は **3 ASP 横断で
「自社がどの案件をどの ASP で運用するか」** を扱う。doboku-note で 2026-07-27 に実機確定した実装を
2026-07-28 に移植し、対象サイトを stats47 側へ反転させた。

### ★不変条件: 3 ASP すべてで stats47 と doboku-note が同一口座に同居する

切り替えずに読むと**他サイトのデータを自分のものと誤認する**。doboku-note では afb の走査で SID 不一致を
「警告して続行」した結果、別サイトの一覧を読んで「該当 0 件」と誤報告した事故が起きた。
判定は `.claude/scripts/ads/lib/asp-site-guard.mjs` に集約し、**不一致は例外で停止する**
(`--force` 相当の迂回手段を作らない。作れば必ず使われる)。

| ASP | 分離方式 | 対象 ID (stats47) | 切替の実装 |
|---|---|---|---|
| A8.net | `none` (切替 UI 無し) | 口座 mediaId `a25050375786` | 切替せず口座を assert。サイト分離は apply/harvest の `webSiteId`/`websiteId` select (§10) とレポート単位 |
| もしも | `url-param` | `638943` (doboku=672381) | URL の `shop_site_id`。申請フォームの select も選ぶ |
| afb | `chosen-widget` | `959426` (doboku=984453) | Chosen.js の**実クリックのみ有効**。URL も JS の change も効かない。`【SID】` を read-back |

- 判定順は **ID read-back が最優先**。ID が取れているとき禁止文字列 (他サイト名) は見ない
  — サイト切替 UI 自体が全サイト名を列挙するため必ず誤検知する。禁止文字列は ID を確認できない
  弱い判定のときだけ効かせる。
- `targetSiteName` は config `sites` マップの**キー** (`stats47`)、`targetSiteLabel` は ASP の画面に出る
  **表示名** (「統計で見る都道府県」)。select の option をキー名で探すと見つからず切替が黙って失敗する。

### 構成

| 役割 | 場所 |
|---|---|
| 接続設定 (URL / セレクタ / サイト ID / timeout) | `.claude/config/affiliate-asp.json` |
| サイト帰属の判定 (純関数・例外) | `.claude/scripts/ads/lib/asp-site-guard.mjs` (+ `__tests__/`) |
| ブラウザ共通基盤 (永続 context / dump / mask) | `.claude/scripts/ads/lib/asp-browser-base.mjs` |
| ASP 共通操作 (openAsp / ensureTargetSite) | `.claude/scripts/ads/lib/asp-browser.mjs` |
| 提携状態の実機照合 (read-only / `--write`) | `.claude/scripts/ads/affiliate-status.mjs` |
| 提携申請 (dry-run 既定 / `--commit`) | `.claude/scripts/ads/affiliate-apply.mjs` |
| afb 未提携案件の走査 | `.claude/scripts/ads/afb-scan.mjs` |
| 3 ASP 横断の提携台帳 | `.claude/state/ads/affiliate-catalog.json` |

**`a8-catalog.json` とはマージしない。** あちらは A8 scout の状態機械、こちらは ASP 横断の運用判断。
広告そのものの SSOT は `apps/web/scripts/affiliate-ads-data.ts` (git TS) で、いずれも配信データではない。

### 規律

| 規律 | 手段 |
|---|---|
| サイト帰属を確定できなければ 1 バイトも読まない | `assertSiteOrThrow` が例外。回避引数を作らない |
| 提携申請は既定 dry-run・実申請はオーナー承認 | `--commit` gate。Red Line 案件は `--commit` でも落とす |
| 「一括提携申請へ」を絶対に押さない | ラベル完全一致 + 「一括」を含む候補を機械除外 |
| もしもの申請はサイト select を read-back 確認してから押す | `selectSiteInForm` が不一致で abort |
| 取得できなかった ASP を「提携なし」と混同しない | `affiliate-status` が判定不能として区別 |
| 認証情報を env / config に置かない | 人間が手動ログイン → 永続プロファイル |

### 役割分担

| 工程 | 担当 |
|---|---|
| 状態照合 / 申請 / afb 走査 / ASP 間比較 / 台帳保守 | `affiliate-operator` (skill `/affiliate-operate`) |
| A8 の案件開拓・自動申請・広告コード取得 | `asp-scout` (skill `/scout-asp`) |
| 広告 SSOT 追記 + commit/push | `affiliate-manager` (排他 writer) |
| A8 成果レポート CSV の収集 | `a8-report-collector` (skill `/a8-report`) |
| 収集 CSV のデータ品質検査 | `a8-csv-auditor` |
| 初回ログイン・`--commit` の承認 | 人間 (オーナー) |

## 9. 関連

- 自動 scout: skill `.claude/skills/ads/scout-asp/SKILL.md` / agent `.claude/agents/asp-scout.md` /
  コア `.claude/scripts/ads/lib/{a8-scout-core,a8-code-core,a8-append-core}.mjs` (+ `__tests__/`) /
  ブラウザ `.claude/skills/ads/scout-asp/scripts/{a8-browser.ts,login.mjs}` /
  カタログ `.claude/state/ads/a8-catalog.json` / curated `.claude/scripts/ads/data/a8-curated.json` /
  cron `scripts/scheduled/scout-asp-weekly.sh` + `com.stats47.scout-asp-weekly.plist` /
  追記ゲート `.claude/scripts/ads/append-affiliate-ads.ts` / 申請上限 `.claude/scripts/ads/check-a8-apply-budget.cjs`
- 3 ASP 提携運用 (§11): skill `.claude/skills/ads/affiliate-operate/SKILL.md` / agent `.claude/agents/affiliate-operator.md` /
  設定 `.claude/config/affiliate-asp.json` / 台帳 `.claude/state/ads/affiliate-catalog.json` /
  コア `.claude/scripts/ads/lib/{asp-browser-base,asp-browser,asp-site-guard}.mjs` (+ `__tests__/`) /
  実行 `.claude/scripts/ads/{affiliate-status,affiliate-apply,afb-scan}.mjs` /
  移植元 doboku-note `scripts/{lib/asp-*.mjs,affiliate-status.mjs,affiliate-apply.mjs,afb-scan.mjs}` (2026-07-28 移植)
- SSOT データ: `apps/web/scripts/affiliate-ads-data.ts` (自動配置) / `apps/web/scripts/affiliate-direct-placements-data.ts` (直接配置台帳)
- 意図ハブ: `apps/web/src/features/ads/constants/affiliate-category.ts` (`AffiliateVertical` / 3 map / `adVertical`)
- 型ソース: `apps/web/src/features/ads/types/index.ts` (`AffiliateAd.vertical` / `AffiliateDirectPlacement`)
- 配信解決: `apps/web/src/features/ads/services/resolve-affiliate-ad.ts` / `repositories/affiliate-ad-snapshot.ts`
- 生成/検証: `apps/web/scripts/export-affiliate-ads-snapshot.ts` (vertical validation) → R2 `app/affiliate-ads/all.json`
- 監査/lint: `.claude/scripts/ads/audit-affiliate-inventory.ts` (vertical カバレッジ + `--check-size`) /
  `.claude/scripts/ads/audit-affiliate-compliance.ts` (直接配置・PR 表記)
- 機械状態: `.claude/state/ads/{affiliate-operations-latest,inventory-latest,compliance-latest,experiments}.json`
  (生成: `build-affiliate-operations-state.ts` + 週次 CI。**在庫数・gap は state から読む — 文書に固定しない**)
- GA4 計測: `.claude/scripts/ads/fetch-affiliate-ga4.cjs` / `apps/web/src/lib/analytics/events.ts`
- agent: `.claude/agents/affiliate-manager.md` / `.claude/agents/affiliate-operator.md` (§11)
- skill: `/register-affiliate-banner` / `/affiliate-improvement` / `/audit-affiliate-compliance` / `/manage-affiliate-experiment` / `/affiliate-operate` (§11)
- 戦略: `docs/02_実装計画/01_収益化マスタープラン.md` §5-6 / 実装: `docs/02_実装計画/14_収益化実装方針.md` §3・付録A /
  移行仕様: `docs/02_実装計画/25_アフィリエイト運用SSOT移行仕様.md`
