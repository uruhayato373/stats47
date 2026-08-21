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

## 2. vertical → 送客ページの対応 (設計指針)

**本表は「その意図軸をどのページに当てるか」の設計指針であって、提携状況の台帳ではない。**

| vertical | 商材の性格 | 主な送客ページ |
|---|---|---|
| `travel` (旅行・宿泊) | OTA・宿泊予約・現地体験 | `/ranking/travel-participation-rate-overnight` (note #1 ファネル)・観光系 ranking・`/themes/tourism` |
| `labor` (転職・年収) | 転職エージェント・求人・フリーランス案件 | 年収・所得・職業別 ranking・`/themes/{labor-wages,occupation-salary}` |
| `housing` (住宅・引越し) | 不動産・リフォーム・引越し・住宅ローン | `/areas`・住宅・地価・建設 ranking・`/themes/living-housing` |
| `economy` (投資・保険・家計) | FP 相談・証券・保険・家計見直し | 県民所得・貯蓄率・物価 ranking・`/themes/{consumer-prices,real-income}` |
| `health` (健康・医療) | フィットネス・健康食品・ボディケア | 医療・社会保障・健康 ranking・`/themes/{healthcare,aging-society}` |
| `energy` (通信・エネルギー) | 回線・格安 SIM・電力ガス・蓄電池 | エネルギー・通信 ranking |
| `population` (人口・子育て) | 子育て・育児用品・汎用 | 人口・世帯・子育て ranking・`/themes/population-dynamics` |
| `furusato` (ふるさと納税) | 返礼品ポータル | `/areas`・財政・地域 ranking・`/themes/local-finance` |
| `education` (通信教育・資格) | 資格講座・プログラミング/AI スクール・語学 | 教育 ranking・`/themes/education-culture` |
| `mobility` (自動車・交通) | 自動車保険・車査定・交通 | 交通事故・交通安全 ranking・`/themes/{roads,railway,ports,safety}` |

### 案件選定の二層契約（報酬単価だけで決めない）

`vertical` は「何に関心があるか」を表すが、「読者が今どこまで行動する準備があるか」は表さない。
案件選定では vertical に加えて、ASP が示す成果条件を次の二層へ分類する。

| レーン | 行動の例 | 配置条件 |
|---|---|---|
| `discovery` | フォーム不要の閲覧・ダウンロード、アプリ導入、無料登録・無料体験 | 比較中でも実行でき、文脈一致する一導線だけ。theme / category / 一覧へ枠を追加しない |
| `decision` | 資料請求、見積もり、相談予約・面談、購入・契約 | `targetRankingKeys` または直接配置で対象ページを限定できること |

行動負担は次の5段階で記録する。これは単価帯ではなく、成果条件を満たすために読者が渡す情報・時間・金銭の段階である。

| tier | 成果条件の目安 |
|---|---|
| `F0` | クリックまたは外部ページ閲覧だけ |
| `F1` | 個人情報なしのダウンロード・診断完了 |
| `F2` | アプリ導入、無料登録・無料体験（基本情報まで） |
| `F3` | 資料請求・見積もり・予約（連絡先提供または営業連絡あり） |
| `F4` | 面談完了・購入・契約・支払い |

- 「無料」という語だけで `F0`〜`F2` にしない。電話、面談、審査、支払いがあれば実態に合わせて上げる。
- 成果条件、確認元、確認日が無い案件は `unknown` とし、`discovery` へ自動採用しない。
- 生の報酬額は採否の単独根拠にしない。確定EPC、確定率、文脈一致、行動負担を併記する。
- `discovery` と `decision` を同じ重み付き点数へ潰さない。別キューとして比較し、各レーンの実測で判断する。
- 主指標は `confirmedRevenueYen / viewableImpressions * 1000`。ASP成果を広告・実験へ結べない場合は
  `unknown` とし、0円や負けへ変換しない。
- 勝者の自動公開、priority 自動変更、新規提携申請は行わない。候補提示までを機械化し、人間承認を残す。

型付き offer catalog、広告との program 参照、成果 join、管理画面、週次改善の実装契約は
`.claude/todo/backlog.md` の `AFF-INTENT-FRICTION-PORTFOLIO-01` に置く。実装完了までは本節を
人間・agent の判定規約として使い、案件名から行動負担を推測して state を書き換えない。

### 提携状況の真実源 (★2026-08-04 に一本化)

**どの案件をどの ASP で提携済み / 申請中かの真実源は state ファイルであって、本表ではない。**

| ASP | 真実源 | 更新手段 |
|---|---|---|
| もしも / afb | `.claude/state/ads/affiliate-catalog.json` | `affiliate-status.mjs --write` (実機照合) |
| A8 | `.claude/state/ads/a8-catalog.json` | `a8-browser.ts check-approval` / `import-partnered` |

以前は本表の「提携」列 (✅ / 一部✅ / 要提携) を真実源としていたが、実機照合で更新される
state と二重 SSOT になり、**表側が実態から乖離した** (2026-08-04 の照合で承認 37 件が判明した
時点で、表は travel/furusato/housing を「要提携」のままにしていた)。人が手で維持する表は
実機照合の頻度に追いつけないため、ステータスは state に一本化し表は設計指針に縮退させた。

- `/register-affiliate-banner status` は上記 2 つの state を読む (本表は読まない)。
- **在庫数・ゼロ/手薄軸も本表に書かない** (変動値)。`.claude/state/ads/inventory-latest.json` の
  `coverage.gapVerticals` / `thinVerticals` (または集約 `affiliate-operations-latest.json`) から読む。
- 本表に書くのは**変わりにくいもの**だけ (軸の意味・送客先ページ)。個別プログラム名は
  入れ替わるため書かない。

## 3. フォーマット & サイズ規約 (canonical 4 種・lint enforced)

新規登録は下記 **4 種のみ**。lint (`audit-affiliate-inventory.ts --check-size`・pre-commit) が canonical/legacy 以外を弾く。

| フォーマット | サイズ | 用途 | 主な locationCode |
|---|---|---|---|
| レクタングル (主) | **300×250** | 既定。blog 本文下 / ranking / sidebar | `blog-bottom` / `sidebar-sticky` |
| スクエア | **250×250** | 正方形クリエイティブ (じゃらん等) | `blog-bottom` |
| モバイル横長 | **320×100** | モバイル枠 | `blog-bottom` |
| テキスト | (サイズなし) | sidebar テキストリンク + **ブログ本文インライン** | `sidebar-bottom` |

> **★banner と text の解決は非対称** (再発防止のため明記): banner 解決 (`readActiveBannersByVerticalsFromR2`) は
> **locationCode を見ない** — vertical + adType + targetRankingKeys だけで絞り priority 降順。
> 一方 **text 解決は locationCode で絞る** (`sidebar-bottom` / `footer`)。
> したがって **text を `blog-bottom` に置くと banner 経路にも text 経路にも乗らず永久に表示されない**
> (2026-07-28 に 2 件が実際にそうなっていた)。`buildAdDraft` が adType で振り分ける。
> 本文インラインも locationCode は `sidebar-bottom` を再利用する — 新しい値を作ると在庫が
> 本文用とサイドバー用に分断され、どちらも埋まらなくなるため。区別は GA4 の `link_position` で行う。

> **★縦長 (height > width) は native / 本文の横並び枠に出さない (2026-08-06)**: banner 解決が
> locationCode を見ない結果、`sidebar-sticky` 登録のスカイスクレイパー (120×600) が本文の
> 当時の `NativeAffiliateRow` (4:3 枠) に流入し極細の縦帯に潰れていた。描画側が
> `isLandscapeBanner` (`resolve-affiliate-ad.ts`) で除外する (repository は blog レール等と共有
> するため触らない)。**縦長の唯一の受け皿は `SidebarStickyBannerAd`** (home 左レール・lg+ のみ・
> sticky なし) = `sidebar-sticky` locationCode を読む唯一の消費者。native の呼び出し元は除外分を
> 見込んで解決 limit を 8 にする (native 4 + 末尾 300×250 1 を横長だけで埋める余裕)。
> **画像バナー枠の可視要素はリンク付きバナー画像だけ** — `NativeAffiliateRow`、
> `SidebarPromoBanner`、`AffiliateAdSlot` の banner 分岐、本文中の `BannerAd` に PR ラベル、見出し、
> 商品・サービス名、「もっと見る」導線、Surface/Card 装飾、固定アスペクト枠を追加しない。
> ASP 提供バナーの縦横比を保ってそのまま表示する (2026-08-14 に native 全 7 ページ、
> 2026-08-16 に固定/文脈バナーへ適用)。

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
| blog | 記事 `tags` → vertical の banner/text。**テキストリンクは本文だけに自動挿入** (`<affiliate-text>`・h2 の 2/4/6 番目直前 + 末尾 = 最大 4 本)。右レールは画像バナーのみ |
| theme | `relatedArticleTagKeys` → vertical、空なら `THEME_AFFILIATE_MAP[themeKey]` → vertical (フォールバック) |
| area | `locationCode="area-sidebar"` の banner。AdSense停止中の県本文枠は地域意図として `furusato` vertical |

- **desktop の右レールに置く PR は画像バナー (`BannerAd`) のみ**。独自テキスト promo card、`FurusatoNozeiCard`、
  `AffiliateTextAdList` は右レールへ置かない。banner 在庫が無い場合は AdSense へフォールバックし、テキスト広告は
  本文 inline / footer に限定する。

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

イベントは実装済 (`affiliate_impression` / `affiliate_click`。impression は 2026-07-28 に `ad_impression`
から改名 — AdSense 自動生成イベントとの衝突解消。正典 `analytics-event-standards.md`)。
だが **GA4 管理画面で custom dimension を登録しないと
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

- **`propose`**: **`.claude/state/ads/placement-map-latest.json` を読む** (§12)。目視で JOIN しない。
  `unmapped.byReason` (広告が出ていない imp) → `gaps[].kinds` (在庫欠落) → `reverseCandidates` の順に見て、
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

A8.net の高単価案件を **scout → 提携申請 → 広告コード取得 → SSOT 登録 → R2 公開** の閉ループで回す
(★現行 safe mode: 週次 cron は観測・承認照合・dry-run まで。scout/apply は `APPLY_NEW=0` で無効、
SSOT 実追記・push はオーナー承認の実行回のみ — 本節末「週次 cron の中身」参照)
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

- **ad_id 計測**: `affiliate_impression`/`affiliate_click` に `ad_id` (AffiliateAd.id) を送る (events.ts /
  AdImpressionTracker / TrackedAffiliateLink / 各 BannerAd・NativeAffiliateRow 呼び出し元)。GA4 で custom
  dimension `ad_id` (event scope) 登録が要る (**人間ステップ**)。登録前でも送信は開始してよい。
- **(not set) の扱い**: 過去データの大半が (not set) なのは dimension 登録前データの混入。fetch 期間を登録日
  以降に絞る (`fetch-affiliate-ga4.cjs`)。
- **✅ CTR 計測の修理 (2026-07-28 実施・要実測確認)**: 2026-07-27 の実測で、自前 impression が使っていた
  `ad_impression` が **GA4 の AdSense 連携が自動生成するイベント名と同じ**で、直近 7 日の 3,346 件は
  `adSourceName` が全件 AdSense (総数と完全一致 = **自前イベントは 1 件も記録されていない**)、
  つまり **CTR の分母が存在しない**状態だった。2 つの原因を両方直した:
  - **原因① (0 件の主因) → 修正済**: `AdImpressionTracker` が `firedRef.current = true` を
    `if (window.gtag)` ガードより**前**に実行しており、gtag (afterInteractive 遅延読み込み) 未準備の
    タイミングでは送信されないまま「発火済み」になり永久に失われていた。送信成功時のみ `firedRef` を
    立て、未準備なら 500ms × 最大 10 回リトライする形に変更。
  - **原因② → 改名済**: `ad_impression` → **`affiliate_impression`**。AdSense が同名イベントを
    大量生成するため自前分と区別できないのが理由 (予約名だから破棄される、とは断定していない —
    同じ予約名の `file_download` は自前パラメータごと正常に届いている)。
  - **過去に報告された「CTR 0.079%」等は affiliate の click を AdSense の impression で割った無意味な値**。
    採用してはならない (`evidence-based-judgment.md`)。
  - **✅ 確認済 (2026-08-02 実測)**: snapshot `.claude/state/ads/ga4-affiliate-2026-08-02.json` で
    `affiliate_impression` **3,400 imp / clicks 5 / CTR 0.147%**、`unsetVerticalRatio: 0`、
    `hasVerticalBreakdown: true`、dimension は `ad_id` / `affiliate_vertical` / `link_position` の
    3 種が引けた。**canonical 10 vertical すべてに実データがある**。
    → **dimension はパラメータ名に紐づき、イベント改名では再登録が要らない**ことが実測で確定した。
    詳細は `affiliate-improvement/reference/improvement-log.md` の `AFF-IMPRESSION-RENAME-01`。
  - **窓の読み方**: `affiliate_impression` は改名日 (2026-07-28) 以降にしか存在しない。
    28 日窓で取っても実質 6 日分なので、**28 日平均として読まない**。水準の評価は 2026-08-25 以降。
  - **下の「週次改善」(imp>500 で降格) は、CTR の分母が 4 週分たまるまで発火させない**。
    当面 priority は確定EPC 主導。
  - dimension 側は `affiliate_vertical` 等 6 個が **2026-07-06 登録済**、`ad_id` が **2026-07-28 登録済**で、
    いずれも上記実測で引けることを確認した。**未取得は `variant_id` / `experiment_id`**
    (`hasVariantBreakdown: false`) で、クリエイティブ A/B の判定にはまだ使えない。
  - **`other` を未写像ページ数として扱わない**。固定ハウスバナーなど vertical 非依存の枠も
    `other` を意図的に送るため、未写像と固定枠の合成値である。写像漏れは `other` の比率から推測せず、
    `.claude/state/ads/placement-map-latest.json` の `unmapped.byReason` と ad_id / position 内訳で判定する。
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
| operation plan / journal の I/O | `.claude/scripts/ads/lib/asp-operation-store.mjs` (判定は `asp-operation-core.mjs`) |
| lock / health の I/O | `.claude/scripts/ads/affiliate-ops.mjs` |
| afb 未提携案件の走査 | `.claude/scripts/ads/afb-scan.mjs` |
| もしも未提携案件の走査 | `.claude/scripts/ads/moshimo-scan.mjs` (stats47 で新規作成・移植元に無い) |
| 走査の vertical 抽出語 (afb / もしも共通) | `.claude/scripts/ads/lib/asp-vertical-keywords.mjs` |
| 3 ASP 横断の提携台帳 | `.claude/state/ads/affiliate-catalog.json` |

**`a8-catalog.json` とはマージしない。** あちらは A8 scout の状態機械、こちらは ASP 横断の運用判断。
広告そのものの SSOT は `apps/web/scripts/affiliate-ads-data.ts` (git TS) で、いずれも配信データではない。

### 規律

| 規律 | 手段 |
|---|---|
| サイト帰属を確定できなければ 1 バイトも読まない | `assertSiteOrThrow` が例外。回避引数を作らない |
| 提携申請は既定 dry-run・実申請はオーナー承認 | `--commit` gate。Red Line 案件は `--commit` でも落とす |
| **`--commit` は plan 経由でしか通さない** | `--commit --plan <operationId>` のみ許し `--commit --id` を禁止する (`validateArgs`)。dry-run が `.local/affiliate-ops/plans/<id>.json` に「サイト・案件・対象数・ボタン文言」を焼き、commit 直前に同じ画面を再観測して `validatePlanForCommit` で突き合わせる。1 項目でも違えば押さず plan を `.expired.json` へ改名して残す。**id 直指定だと「見た画面」と「押す画面」が別 run になり、間の差し替えを検知できない** |
| **押した事実を先に書く** | `.local/affiliate-ops/journal.ndjson` に append-only で `planned → intent-recorded → sent → confirmed\|unknown`。押す直前と直後の 2 行は fsync まで完了させる。`sent` か `unknown` がある operation は `canAutoResend` が false になり **自動再送しない** (次は live reconciliation だけ)。途中で kill されても二重申請にならない |
| **ASP profile は 1 プロセスだけが開く** | `affiliate-ops.mjs lock acquire/release` (O_EXCL・pid+hostname 記録)。生存 PID の lock は奪わず、stale は age と PID 不在の両方を見てから回収する。並行で開くと Chrome がセッションを壊し、進行中の申請の状態が追えなくなる |
| 「一括提携申請へ」を絶対に押さない | ラベル完全一致 + 「一括」を含む候補を機械除外 |
| もしもの申請はサイト select を read-back 確認してから押す | `selectSiteInForm` が不一致で abort |
| 取得できなかった ASP を「提携なし」と混同しない | `affiliate-status` が判定不能として区別。一覧の実件数を必ず併記し「ID 0 件 = 提携ゼロ」と誤読させない (2026-07-28 に実際に誤読し、提携中 7 件・申請中 6 件を「0 件」と報告した)。**もしもは画面テキストに ID が出ない**が `hrefIdPattern` + `listScopeSelector` で抽出でき、行数と一致する (2026-08-04 実測: 提携中 32 行 = ID 32 件)。**A8 は `affiliate-status` に抽出パターンが無く常に 0 件**なので、A8 の提携状態は `a8-catalog.json` 側 (`check-approval`) で見る |
| 幻 ID を台帳へ書かない | `detectPhantomIds` が提携中∩申請中を自動除外し警告する。1 案件が同時に両方であることはありえないので、両方に出る ID は一覧行の外のページ共通リンク。2026-08-04 実測でもしもの `7630 / 7556 / 170` が該当し、うち 2 件が「台帳に無い実機の提携」と誤検出、1 件は過去の `--write` で実在しないエントリ (`moshimo-170`) として混入していた |
| 一覧行数と ID 数の一致を毎回確かめる | `checkIdRowParity` が乖離時に警告。ズレは `listScopeSelector` が一覧行に限定できていない (超集合) か取りこぼしのサイン。修正前は提携中 32 行に対し ID 35 件だった |
| 名前を推測で埋めない | `--write` の名前補完は afb = 4 行ブロックのプロモーション名 (`parseAfbBlocks`)、もしも = DOM 順 index 対応 (`zipNamesWithIds`) で、**既知名と照合が通ったときだけ**採用する。通らなければ補完せず報告に留める |
| 申請の完了を文言で判定しない | もしもの申請は **2 段階** (申請ページ →`/apply/confirm` で確定)。確認ページにも「申請」の語が出るため文言判定では未完了を成功と誤報する。完了は**申請中または提携中一覧に当該案件が現れたか**だけを根拠にする (2026-07-28 に 4 件を誤報)。★もしもは**即時承認**があり申請中を経ず提携中へ直行する (同日 4 件実測) — 申請中一覧だけ見ると成功を unverified と誤報する |
| ID 抽出は一覧行スコープに限定し、行数と一致することを確かめる | ページ全体の `a[href]` から拾うと**一覧行の外にあるページ共通リンクが混ざり超集合**になる。もしもは提携中・申請中の両ページに `promotion_id=7630 / 7556 / 170` の共通リンクがあり、2026-08-04 に提携中 32 行に対し ID 35 件を抽出、うち 2 件を「台帳に無い実機の提携」として**誤検出**した (両ページに同時に出る ID は論理的に一覧項目ではない、が発見の決め手)。config の `listScopeSelector` (もしも = `table a[href]`) で一覧スコープを明示し、ログの「一覧 N 件 / ID 累計 N 件」が**一致すること**を毎回確認する。afb は ID を `【PID:N】` の可視テキストから取るため本件は構造的に起きない |
| 認証情報を env / config に置かない | 人間が手動ログイン → 永続プロファイル |
| **afb はセッションを持ち越せない** | `sessionPersistsAcrossProcesses: false`。run のたびに `requiredlogin` へ落ちるので**毎回人間のログインが要る** (2026-08-21 実測: 180 秒待って一度も抜けなかった)。もしも・A8 は永続プロファイルでセッションが生きるため、無人で read-only 走査まで到達できる (同日 もしも実測: 提携中 39 行 / 申請中 37 行・SID 638943 assert ok)。**afb だけが構造的にオーナー工程**であり、3 ASP をまとめて「オーナー待ち」と扱わない |

### 役割分担

| 工程 | 担当 |
|---|---|
| 状態照合 / 申請 / afb 走査 / ASP 間比較 / 台帳保守 | `affiliate-operator` (skill `/affiliate-operate`) |
| A8 の案件開拓・自動申請・広告コード取得 | `asp-scout` (skill `/scout-asp`) |
| 広告 SSOT 追記 + commit/push | `affiliate-manager` (排他 writer) |
| A8 成果レポート CSV の収集 | `a8-report-collector` (skill `/a8-report`) |
| 収集 CSV のデータ品質検査 | `a8-csv-auditor` |
| 初回ログイン・`--commit` の承認 | 人間 (オーナー) |

## 12. 配置マップ (ページ種別 × 枠) と 5 チャネルの役割分担

「どのページにどう出すか」の正典。2026-07-28 の全ページ棚卸しで確定した現状を固定する。

### 枠の現状

| ページ種別 | アフィリ枠 | 解決キー |
|---|---|---|
| blog | 本文 banner / 本文 text (自動挿入 最大4) / サイドバー text / 楽天商品 / ハウス枠×2 | tagKeys → vertical、ランキング名 → 品目 |
| ranking | ハウス枠 / `AffiliateAdSlot` (banner1→text2→AdSense) / native ≤4 / 楽天商品。AdSense停止中は本文中段 banner 1 + 右レール banner ≤2 を上段へ移設 | **categoryKey → vertical** (tagKeys 優先・空なら categoryKey)、ランキング名 → 品目 |
| category / tag | native ≤4 / ハウス枠 | `CATEGORY_FALLBACK_TAGS` / tagKey |
| survey | native ≤4 | 所属ランキングの categoryKey 最頻値 → vertical |
| themes | native ≤4 / theme-end 300×250 | relatedArticleTagKeys → 無ければ `THEME_AFFILIATE_MAP` (本文中央ハウス枠は 2026-08-06 撤去。bespoke の themes/local-finance は InContent×2 のみで native なし) |
| areas 県 | ハウス枠 / `AreaBannerAd`。AdSense停止中は本文中段 banner 1 | `area-sidebar` / 本文は `furusato` vertical |
| areas 市区町村 | `AreaBannerAd` / 楽天ふるさと納税 | `area-sidebar` / 親県コード |
| home | ハウス枠 / native ≤4 (economy 固定) / **sidebar-sticky (縦長の受け皿・左レール lg+)** | 無し (vertical 解決の手掛かりが無いページ)・`sidebar-sticky` |
| compare | native ≤4 | categoryKey → vertical |

> 上表は 2026-08-06 にコード実態と突合して是正した (旧版は blog/ranking/areas 県に
> ふるさと納税を過剰記載。`FurusatoNozeiCard` の実使用は市区町村ページのみ)。

> **★`RankingItem.tags` は空である前提で設計する (2026-08-06 実測)**: tags の SSOT である
> `MetricConfig.tags` は 2026-06-03 に型へ追加されて以来 **2,295 config すべてで未記入**で、
> ranking の native 枠は一度も描画されていなかった。型・builder・描画は揃っているのに
> 供給だけが無い「宣言されているが誰も書かない SSOT」で、型検査でも lint でも見えず、
> 本番 item.json を実測して初めて判明した。**tagKeys 単独で解決を打ち切らず、必ず
> categoryKey → vertical へフォールバックする** (全 ranking item が categoryKey を持ち
> `CATEGORY_AFFILIATE_MAP` が 17 軸すべてを写像するため、在庫がある限り枠が埋まる)。
> ゲート: `features/ranking/__tests__/native-affiliate-resolution-contract.test.ts`。
> tags を将来 SSOT として使うなら、まず**書き手**を用意すること。

> **2026-07-28 に埋めたギャップ** (すべて既存コンポーネントの再利用): 写像なし 6 category の追加
> (unmapped 7,866 → 783 imp) / survey の tag ハードコード撤廃 / areas 県ページの `AreaBannerAd`
> (枠名と描画位置の不一致を解消) / home・compare のアフィリゼロ / 楽天商品カードの新設。
>
> **home に vertical 解決を持ち込まない**。訪問者の意図が確定しないページで軸を推測すると、
> 意図不一致の広告を最上位に置くこと (§5 の禁止事項) と実質同じになる。ハウス枠と
> economy 固定 native に留める (economy は GSC 実測で検索意図の最多クラスタ)。

### 枠の拡張 (2026-08-04・impression 最大化)

計装の網羅 (analytics-event-standards.md) と同時に、**在庫を使い切る方向へ枠を増やした**。
在庫は 260 件あるのに 28 日で impression が付いたのは 84 件だけで、同一 vertical × 枠が
banner 上位 1 + text 上位 2 で頭打ちだったため。

| ページ | 追加した枠 | 解決 |
|---|---|---|
| blog 本文 | **A/B**: `text` 版はテキスト 3 本 (従来通り) / `banner` 版は 300x250 を 3 枚。slug ハッシュで記事ごとに固定 (実測 432 記事で 219/213)。GA4 は `experiment_id=blog-inbody-format` / `variant_id=text\|banner` | tagKeys → vertical で 6 件解決し用途別に切り出す |
| blog 記事末尾 | **常に 300x250 バナー 1 枚** (`variant_id=end-banner`)。完読者は意図が強いため A/B の対象外 | 同上 |
| blog 右レール | 300x250 を最大 2 枚。**右レールはバナーのみ**でテキストは本文 inline に寄せる方針は不変 | 同上 (本文で使った分より後ろを回し重複回避) |
| ranking 右レール | 1 → **2 枚** (`AffiliateAdSlot bannerLimit`) | categoryKey → vertical |
| ranking 記事下 | ネイティブ 4 件の直後に **300x250 を 1 枚** (`position=ranking-end`) | tagKeys → vertical で 5 件解決し 5 件目を使う |
| themes 末尾 | **300x250 を 1 枚** (`position=theme-end`) | relatedArticleTagKeys → 無ければ THEME_AFFILIATE_MAP |
| ranking 本文中段 (AdSense停止中) | 横長バナーを **1 枚** (`position=ranking-incontent`)。既存 native 解決結果の先頭を使い、読了枠からは除外して本文内重複を防ぐ | tagKeys → 無ければ categoryKey → vertical |
| ranking 右レール (AdSense停止中) | 従来の最大2枚を、停止した上段 AdSense 枠へ**移設**。枚数は増やさず初期 viewability を改善する | categoryKey → vertical |
| areas 県 本文中段 (AdSense停止中) | 横長バナーを **1 枚** (`position=area-content`)。在庫が無ければ空枠を作らない | `furusato` vertical |

**在庫が足りなければ枠は描画しない** (空枠を作らない)。ranking / themes の末尾バナーは
「解決 5 件目」なので在庫 4 件以下の vertical では出ず、ネイティブ枠との重複も起きない。

> **viewability 閾値 (50% × 1 秒) は変更しない。** 緩めれば impression は増えるが、
> それは実態の改善ではなく指標の水増しで、過去の窓と比較できなくなる
> (`.claude/rules/evidence-based-judgment.md`)。impression を増やすのは
> **計装の網羅と枠の追加だけ**で行う。

> **AdSense再開時の rollback**: `ADSENSE_DISPLAY_ENABLED=true` で従来の AdSense 枠を戻し、
> ranking 右レールの文脈バナーも従来の下段位置へ戻す。ranking 本文中段へ回した先頭バナーは
> 読了枠の解決結果へ戻し、同一バナーを欠落・二重表示させない。
>
> **★再開したら必ず本文書き換えの smoke を回す**:
> `npx playwright test --config playwright.smoke.config.ts third-party-dom-injection`
> (`apps/web/tests/smoke/third-party-dom-injection.spec.ts`)。
> 2026-08-04 に**自動広告**が出典テキストの語を `href="#"` のリンクへ置き換えた
> (「出典: 人口動態統計」の「統計」だけがリンク + アイコンになる)。出典の信頼性を損ない、
> PR 表記の無い広告リンクが引用文の中に生まれる。オーナーが 2026-08-21 に自動広告の設定を
> 解除したが、**停止中は自動広告が動かないので緑でも証拠にならない** — 再開後の実測だけが
> 解決の根拠になる。再開時は AdSense 管理画面の自動広告が意図した設定かも併せて確認する。

### 5 チャネルの役割分担 (混ぜない)

| チャネル | 役割 | 使いどころ | SSOT |
|---|---|---|---|
| `AFFILIATE_ADS` (vertical 解決) | 汎用の自動配置。**基本はこれ** | ページ意図に自動追従させたいとき | `affiliate-ads-data.ts` |
| `targetRankingKeys` | **ページ限定配置** | 高EPC 案件を特定ランキングだけに当てる | 同上 (フィールド) |
| `SIDEBAR_PROMO_BANNERS` | 全ページ共通の固定ハウス枠 | vertical 非依存で出したい主力案件 | `constants/sidebar-banners.ts` |
| 直接配置台帳 | 記事本文の href 直書き | 記事と案件の 1:1 編集判断 | `affiliate-direct-placements-data.ts` |
| 楽天動的 (API) | 文脈商品・返礼品 | 審査不要・在庫無限。食品/地域文脈 | `rakuten-api.ts` (env の App ID) |

> **★楽天 API は新ポータル (openapi.rakuten.co.jp) 仕様 — 2026-08-04 に移行。**
> 旧 `app.rakuten.co.jp/services/api/.../20220601` は新ポータル発行のキーを受け付けない
> (`wrong_parameter`)。実機プローブで確定した要点:
>
> | 項目 | 値 |
> |---|---|
> | endpoint | `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701` |
> | 認証 | `applicationId` (クエリ) + `accessKey` (**ヘッダ**) の **両方必須**。`X-Access-Key` は不可 |
> | env | `RAKUTEN_APP_ID` (Application ID=UUID) / `RAKUTEN_ACCESS_KEY` (Access Key=秘匿値) |
> | 応答 | `Items` (大文字)。`formatVersion=2` で要素フラット。**画像は `string[]`** → `normalizeRakutenItems` が `{imageUrl}[]` に揃える |
>
> **★配信は R2 snapshot 経由。実行時に楽天 API を叩かない。**
> 楽天の Expected QPS は **1** だが、`deploy-workers.yml` の warm-cache が sitemap の全 URL を
> 順に叩くため、デプロイのたびに ISR が総入れ替えになり **646 ページ分の呼び出しがバースト**する。
> 429 で弾かれてもカードは `[]` に degrade して静かに消えるだけで気づけない。
> 日次 cron `sync-rakuten-catalog.yml` が 1 QPS 以下で全品目を取得し、
> `app/rakuten/items/<品目>.json` / `app/rakuten/furusato/<県コード>.json` に焼く。
> ページは `repositories/rakuten-snapshot.ts` の reader で R2 だけを読む
> (鮮度は旧 ISR 24h と同等)。**コンポーネントから `searchRakutenItems` を直接呼ばないこと。**
>
> **★Allowed IP を `0.0.0.0/0` から変更しないこと。** 楽天アプリの Allowed IP は必須項目だが、
> **GitHub Actions ランナーの送信元 IP は動的**で個別登録できない。特定 IP に戻すと cron が
> 403 `CLIENT_IP_NOT_ALLOWED` で全滅し、R2 が更新されなくなる。アクセス制御は accessKey が担う。
> **API Access Scopes の `Rakuten Ichiba API` チェックも必須** (外すと同様に全滅する)。
> アプリの有効期限は **2027-03-07**。失効時も同じ症状になる。
>
> 症状の見分け方: 商品カードは fallback を持たないため**消える**が、ふるさと納税カードは
> 静的リンクへ degrade するので「出ている」ように見える。0 件の切り分けはこの非対称に注意する。

**楽天動的カードの品目辞書はハードコードしない。** `constants/product-keywords.ts` が
metric config (git TS SSOT) の title から機械導出する — 家計調査系 metric は
「{品目}消費支出額」「{品目}消費量」という決まった形なので接尾辞を剥がせば品目が取れる。
手で品目リストを持つと metric 追加のたびにドリフトする。「◯◯代/料/費/賃/税」は費目であって
商品ではないので除外し、通販で買えないもの (都市ガス・ガソリン) も落とす。
**品目を検出できないページ・API が 0 件のページでは何も描画しない** — 無差別に出すと
記事と無関係な商品が並び読者価値を損なう (`blog-quality-standards.md` のリンク配置規律と同じ)。

### 需要 × 供給の突合は機械が行う

`.claude/scripts/ads/build-placement-map.mjs` が GSC ページ別実測 × 在庫 × 確定EPC を突合し
`.claude/state/ads/placement-map-latest.json` を生成する (週次 cron `affiliate-dashboard-refresh.yml`)。
**目視 JOIN で propose しない** — 再現性が無く見落とすため。判定は `lib/placement-map-core.mjs` (テスト付き)。

出力の読み方:
- `gaps[].kinds` — `banner-zero` / `text-zero` (在庫欠落) / `oversupply` (在庫過多・仕入れ優先度↓)
- `unmapped.byReason` — **広告が出ていない imp** を理由別に集計。`category-unmapped:<key>` は写像追加で即解消できる
- `reverseCandidates` — 確定EPC 上位の未接続案件 + 当て先 ranking キーの suggest。
  **`shared: true` は doboku-note と同一 A8 口座で共用している案件**で、EPC は口座横断の実績。
  stats47 単独の実力として扱わない。`suggestedRankingKeys` は候補であって適用ではない
  (ブランド適合の意味判断は agent/人)

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
- 配置マップ (§12): `.claude/scripts/ads/build-placement-map.mjs` + `lib/placement-map-core.mjs` (+ `__tests__/`)
  → `.claude/state/ads/placement-map-latest.json` (週次 `affiliate-dashboard-refresh.yml`)
- 楽天動的 (§12): `apps/web/src/features/ads/lib/rakuten-api.ts` /
  `constants/{furusato-nozei,product-keywords}.ts` / `components/{FurusatoNozeiCard,RakutenItemsCard}.tsx`
- 機械状態: `.claude/state/ads/{affiliate-operations-latest,inventory-latest,compliance-latest,experiments}.json`
  (生成: `build-affiliate-operations-state.ts` + 週次 CI。**在庫数・gap は state から読む — 文書に固定しない**)
- GA4 計測: `.claude/scripts/ads/fetch-affiliate-ga4.cjs` / `apps/web/src/lib/analytics/events.ts`
- agent: `.claude/agents/affiliate-manager.md` / `.claude/agents/affiliate-operator.md` (§11)
- skill: `/register-affiliate-banner` / `/affiliate-improvement` / `/audit-affiliate-compliance` / `/manage-affiliate-experiment` / `/affiliate-operate` (§11)
- 戦略: `docs/00_プロジェクト管理/02_収益化戦略.md` §3-6 / 実装規約: 本書 §0-6・§12
- ASP継続運用の実装状況: `docs/02_実装計画/42_アフィリエイトPlaywright継続運用・安全化実装仕様.md` /
  `.claude/todo/backlog.md` の `ASP-CONTINUITY-01`
