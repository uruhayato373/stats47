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
| `education` (通信教育) ★在庫ゼロ | **要提携** (スタディサプリ/通信講座/AI開発研修等) | ❌ | 教育 ranking・`/themes/education-culture` |
| `mobility` (自動車・交通) ★在庫ゼロ | **要提携** (自動車保険一括見積・車査定=高単価) | ❌ | 交通事故・交通安全 ranking・`/themes/{roads,railway,ports,safety}` |

- **`education` / `mobility` は在庫ゼロ** = 意図一致広告が出ない機会損失。`/register-affiliate-banner propose` の最優先対象。
- 提携状況 (提携済/申請中/要提携) の真実源は本表。`/register-affiliate-banner status` はこれを読む。

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

`affiliate-manager` がユーザーと 1 件ずつ対話しながら在庫を増やす。mode: `propose`(既定) / `register` / `status`。

- **`propose`**: audit (`audit-affiliate-inventory.ts`) の vertical カバレッジ + GA4/GSC トラフィックを突合し、
  「在庫ゼロ/手薄 × 高トラフィック」の vertical を特定 → §2 表と照合し **次に提携すべき 1 プログラム**を根拠
  (想定 imp 機会・単価帯・送客ページ) つきで提示 → ユーザーが ASP (A8 等) で提携申請。**1 回 1 件**。
- **`register`**: ユーザーが承認済みプログラムの HTML コードを貼付 → href/imageUrl/trackingPixelUrl/width/height 抽出
  → **サイズ検証** (canonical 以外は登録拒否・正サイズ素材の再取得を案内) → **vertical 判定** (§2 表 + ユーザー確認)
  → `AFFILIATE_ADS[]` に **1 エントリ**追記 (categoryKey 複製しない) → tsc + audit + export dry-run
  → commit 準備 (push はユーザー判断・develop push で R2 反映) → 次の `propose` へループ。
- **`status`**: §2 表の提携状況一覧 (提携済/申請中/要提携)。

## 8. 運用フロー (役割分担)

| 工程 | 担当 |
|---|---|
| vertical ハブ (`affiliate-category.ts` の 3 map) の保守 | `affiliate-manager` (本ルール) |
| バナー / テキスト登録 (propose/register) | `affiliate-manager` (skill `/register-affiliate-banner`) |
| 在庫整理・監査・dashboard | `affiliate-manager` (skill `/affiliate-improvement`) |
| サイズ / vertical 規約の enforcement | `affiliate-manager` (audit `--check-size` + export validation) |
| imp / click / CTR の実測値取得 | `ga4-analyst` / `adsense-analyst` |
| effect/* 判定・改善ログ status | `improvement-triage` |
| R2 公開 | develop push → `publish-affiliate-ads.yml` (CI 自動) |
| 記事内手動配置 (`<affiliate-banner>` タグ) | `blog-editor` / `article-writer` |

## 9. 関連

- SSOT データ: `apps/web/scripts/affiliate-ads-data.ts`
- 意図ハブ: `apps/web/src/features/ads/constants/affiliate-category.ts` (`AffiliateVertical` / 3 map / `adVertical`)
- 型ソース: `apps/web/src/features/ads/types/index.ts` (`AffiliateAd.vertical`)
- 配信解決: `apps/web/src/features/ads/services/resolve-affiliate-ad.ts` / `repositories/affiliate-ad-snapshot.ts`
- 生成/検証: `apps/web/scripts/export-affiliate-ads-snapshot.ts` (vertical validation) → R2 `app/affiliate-ads/all.json`
- 監査/lint: `.claude/scripts/ads/audit-affiliate-inventory.ts` (vertical カバレッジ + `--check-size`)
- GA4 計測: `.claude/scripts/ads/fetch-affiliate-ga4.cjs` / `apps/web/src/lib/analytics/events.ts`
- agent: `.claude/agents/affiliate-manager.md`
- skill: `/register-affiliate-banner` / `/affiliate-improvement`
- 戦略: `docs/02_実装計画/01_収益化マスタープラン.md` §5-6 / 実装: `docs/02_実装計画/14_収益化実装方針.md` §3・付録A
