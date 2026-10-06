# GSC 改善記録（archived）

> **2026-04-25 注記**: 本ファイルは 2026-04-21 に archive 化され、施策管理は GitHub Issues（`gsc-improvement` ラベル）に移行済み。本ファイル内の effect 判定・原因推定・想定効果値には推測ベース判定が混在している（Agent 調査で約 65-70%）。後追い参照する場合は `.claude/rules/evidence-based-judgment.md` の基準で再評価すること。新規施策は `gsc-improvement` Issue で管理し、本ファイルへ追記しない。

Google Search Console のインデックス問題を時系列で追跡する記録簿。
更新ルールは `../SKILL.md` を参照。

- **プロパティ**: `sc-domain:stats47.jp`
- **本番 URL**: `https://stats47.jp`
- **開始日**: 2026-04-14

---

## 1. Baseline

**取得日**: 2026-04-10
**ソース**: `gcsエラー/重大な問題.csv`, `gcsエラー/平均読み込み時間のチャート.csv`

### カテゴリ別件数

| カテゴリ | 件数 | ソース | 備考 |
|---|---|---|---|
| 見つかりませんでした (404) | 5,661 | ウェブサイト | 2026-01-13 の 3,976 から +1,685 増加中 |
| サーバーエラー (5xx) | 2,047 | ウェブサイト | 要 URL pattern 特定 |
| クロール済み - インデックス未登録 | 2,339 | Google システム | 類似テンプレート量産が主因の疑い |
| ページにリダイレクトがあります | 2,308 | ウェブサイト | 内部リンク or www 履歴の累積 |
| 検出 - インデックス未登録 | 1,536 | Google システム | クロール予算不足 |
| 代替ページ (canonical 適切) | 920 | ウェブサイト | 意図通り |
| noindex により除外 | 592 | ウェブサイト | 意図通り |
| 重複 (user canonical 無し) | 531 | ウェブサイト | 未調査 |
| ソフト 404 | 506 | ウェブサイト | survey/category の空状態が発生源 |
| robots.txt によりブロック | 61 | ウェブサイト | 意図通り |
| 重複 (Google が別 canonical 選択) | 51 | Google システム | 優先度低 |

### インデックス登録トレンド（`平均読み込み時間のチャート.csv`）

| 日付 | 未登録 | 登録済み |
|---|---|---|
| 2026-01-13 | 10,437 | 4,577 |
| 2026-02-15 | 10,674 | 3,999 |
| 2026-03-15 | 13,708 | 1,910 |
| 2026-04-10 | **16,552** | **1,808** |

**決定的な悪化**: 3 ヶ月で登録済み **-60%** (4,577 → 1,808)、未登録 **+59%** (10,437 → 16,552)。
原因仮説: クロール予算枯渇 + 類似ページ（/areas/{code}/{category} 611 件）の品質評価低下による自動 noindex 化。

---

## 2. Action Log

施策 ID 命名規則: `T{Tier}-{Category}-{連番}`。
- Tier: T0 (URL 空間整理) / T1 (technical SEO) / T2 (コンテンツ品質) / T3 (外部シグナル)
- 運用ルールは `.claude/agents/seo-auditor.md` の「施策 ID 運用ルール」参照

### [T1-MW-01] Phase 1 — middleware レベルの 404/410 対策

**施策 ID**: `T1-MW-01`
**Tier**: T1 (technical SEO)
**デプロイ日**: 2026-04-14
**コミット**: `0fdab9dd` (`fix: GSC 問題の恒久対策（Phase 1+2: 404/410/soft404/5xx/クロール予算）`)
**ESLint 追従**: `2784b1d2`
**ターゲット指標**: 404, リダイレクト
**想定効果値**:
- 404: **-200 ~ -500**（middleware で 410 を返す URL のキャッシュ競合解消 → Google 側で 404 件数が減少）
- リダイレクト: **-150 ~ -300**（/ranking/prefecture/* が正しく 301 処理される）
**観測予定日**: 2026-04-28 (+14d MID), 2026-05-12 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | 404 delta | リダイレクト delta | 判定 |
|---|---|---|---|---|
| 2026-04-17 | 3d | +66 | -3 | PENDING |

#### 変更内容

- `apps/web/src/middleware.ts`:
  - `gone()` ヘルパー新設。全 410 応答に `Cache-Control: no-store, must-revalidate` 付与
  - `isValidPrefCode()` ヘルパー（export 済）で 01〜47 末尾 000 を厳密判定
  - `/ranking/prefecture/{slug}` → 301 `/ranking/{slug}` or 410 の分岐追加
  - 無効 prefCode (00000 等) の 301→410 チェーンを直接 410 に短絡
  - `/tag/{英語slug}` で `GONE_TAG_KEYS` を参照して 410
- `apps/web/src/config/gone-tag-keys.ts`: 新規作成（空 Set、今後追加運用）
- `apps/web/src/__tests__/middleware.test.ts`: `isValidPrefCode` 単体テスト 4 件

### [T1-SRC-01] Phase 2 Tier 1 — ソフト 404 / 5xx 発生源除去

**施策 ID**: `T1-SRC-01`
**Tier**: T1 (technical SEO)
**デプロイ日**: 2026-04-14
**コミット**: `0fdab9dd` (T1-MW-01 と同時コミット)
**ターゲット指標**: ソフト 404, 5xx
**想定効果値**:
- ソフト 404: **-300 ~ -450**（506 → 50-200、survey/category の空状態 notFound 化）
- 5xx: **-500 ~ -1,000**（2,047 → 1,000-1,500、`/api/*` Disallow + blog-data 500→404）
**観測予定日**: 2026-04-28 (+14d MID), 2026-05-12 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | ソフト404 delta | 5xx delta | 判定 |
|---|---|---|---|---|
| 2026-04-17 | 3d | -6 | -3 | PENDING |

#### 変更内容

- `apps/web/src/app/survey/[surveyKey]/page.tsx` L165: 空状態を `notFound()` 化
- `apps/web/src/app/category/[categoryKey]/page.tsx` L165: 同上
- `apps/web/src/app/global-error.tsx`: 新規作成。ルートレベル例外の統一ハンドラ
- `apps/web/src/app/robots.ts`: `/api/*` を Disallow 追加（Googlebot から隔離）
- `apps/web/src/app/api/blog-data/[...path]/route.ts`: catch 500 → 404

### [T1-CRAWL-01] Phase 2 Tier 2 — クロール予算回復（sitemap 削減）

**施策 ID**: `T1-CRAWL-01`
**Tier**: T1 (technical SEO)
**デプロイ日**: 2026-04-14
**コミット**: `0fdab9dd` (T1-MW-01 と同時コミット)
**ターゲット指標**: クロール済み未登録, 検出未登録, 登録済み
**想定効果値**:
- クロール済み未登録: **-1,000 ~ -1,500**（2,339 → 800-1,300、area-category 611→94）
- 検出未登録: **-400 ~ -700**（1,536 → 800-1,100、sitemap URL 総数 -35%）
- 登録済み: **+300 ~ +700**（1,808 → 2,100-2,500、クロール予算がトップページ/ブログに集中）
**観測予定日**: 2026-04-28 (+14d MID), 2026-05-12 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | クロール済み未登録 | 検出未登録 | 登録済み | 判定 |
|---|---|---|---|---|---|
| 2026-04-17 | 3d | +76 | -142 | +52 | PENDING |

#### 変更内容

- `apps/web/src/lib/indexable-area-categories.ts`: **13 → 2** に削減（`population`, `economy` のみ）
  - sitemap の area-category URL が **611 → 94**（-517、sitemap 全体の約 35%）
  - 非 indexable カテゴリは `generateMetadata` で自動的に `noindex, follow`
- `apps/web/src/app/tag/[tagKey]/page.tsx`: 記事 < 2 本なら `noindex, follow`
- `apps/web/src/app/sitemap.ts`: tag 抽出を `HAVING COUNT(*) >= 2` にフィルタ
- `apps/web/src/app/compare/[categoryKey]/page.tsx`: 全面 `noindex, follow`
- `apps/web/src/app/sitemap.ts`: `/compare` / `/compare/{key}` 全除外

### [T0-RKG-200-01-v1] 失敗・revert 済（2026-04-17）

**施策 ID**: `T0-RKG-200-01-v1` / **結果**: ❌ CI build 失敗
**コミット**: `d30094c1` → revert `9282e9c3`
**何をしたか**: `dynamicParams=false` + generateStaticParams の try/catch を throw に変更
**失敗理由**: GitHub Actions の Deploy に D1 binding が無く `listActiveRankingKeys` が throw 発火でビルドが落ちた
**学び**: CI ビルド環境では D1 非依存の設計が必須

### [T0-RKG-200-01-v2] 失敗・revert 済（2026-04-17）

**施策 ID**: `T0-RKG-200-01-v2` / **結果**: 🚨 CRITICAL（全 ranking ページが 404 化、サイト崩壊）
**コミット**: `73b1277b` → revert `0ba2b163`
**何をしたか**:
- `known-ranking-keys.ts`（1,899 keys）をファイル化
- page.tsx に `dynamicParams=false` + `generateStaticParams` を KNOWN_RANKING_KEYS 参照に変更
- middleware Fix 6 追加

**失敗理由**:
CI ビルド環境に D1 binding が無く `cachedFindRankingItem` 等の DB アクセスが **build 時に全て null を返す**。
`dynamicParams=false` + 1,899 件の `generateStaticParams` で全ページ SSG 時に `notFound()` が発火し、
**全 1,899 ranking ページが static に 404 として pre-render された**。本番 runtime で D1 があっても、
static な 404 が永続的に返る状態になりサイト崩壊。本番 curl で `/ranking/{既知キー}` が 404、
`/ranking/{未知キー}` が 410 を確認 → 即座に revert。

**学び**: **page.tsx で D1 アクセスする限り `dynamicParams = false` は使えない**。
page.tsx を D1 不依存にするか、CI に D1 binding を追加するか、middleware のみで対応するかの 3 択。
v3 は最もリスクの低い「page.tsx 無変更 + middleware only」で対応。

### [T0-RKG-200-01-v3] `/ranking/{任意キー}` 410 化（middleware-only 設計）

**施策 ID**: `T0-RKG-200-01-v3`
**Tier**: T0 (URL 空間整理)
**デプロイ日**: 2026-04-17
**コミット**: `7e4322ba` (main push、GitHub Actions run 24569640378 success)
**ターゲット指標**: クロール済み未登録, ソフト404, 登録済み
**想定効果値**:
- クロール済み未登録: **-1,500 ~ -2,000**（2,415 → 400-900）
- ソフト404: **-150 ~ -250**（500 → 250-350）
- 登録済み: **+300 ~ +800**（1,860 → 2,100-2,700）
**観測予定日**: 2026-05-01 (+14d MID), 2026-05-15 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | クロール未登録 delta | ソフト404 delta | 登録済み delta | 判定 |
|---|---|---|---|---|---|
| 2026-04-17 (deploy直後) | 0d | — | — | — | **DEPLOYED** 本番 curl 検証: `/ranking/未知キー` = 410、`/ranking/abandoned-cultivated-land-area` = 200 確認 |

#### 変更内容（v2 の失敗を学習、page.tsx は触らない）

- **新規**: `apps/web/scripts/generate-known-ranking-keys.ts` — ローカル D1 → TS ファイル書き出し
- **新規**: `apps/web/src/config/known-ranking-keys.ts` — 1,899 件の `ReadonlySet<string>`（自動生成、git commit）
- **新規**: `.claude/skills/db/generate-known-ranking-keys/SKILL.md`
- **編集**: `apps/web/src/middleware.ts`:
  - Fix 6 追加: `/ranking/{key}` で `!KNOWN_RANKING_KEYS.has(key) && !GONE_RANKING_KEYS.has(key)` なら 410 Gone
- **編集**: `.claude/skills/db/register-ranking/SKILL.md`:
  - Phase 5 に known-ranking-keys.ts 再生成の必須ステップ追加
- **⚠️ 変更なし**: `apps/web/src/app/ranking/[rankingKey]/page.tsx` ← **v2 の失敗を学習、触らない**

#### 根拠

v2 の教訓から、page.tsx は CI build での D1 アクセス失敗を許容する既存の try/catch + 空配列返しを維持。
middleware は runtime で動作するため D1 非依存（git commit 静的 Set 参照のみ）で、未知キーを即 410 Gone 化できる。
`dynamicParams = false` の利点（Next.js 自動 404）は諦めるが、middleware 410 の方が Google に対する
「確定削除」シグナルとしては強い。

### [T0-CITY-500-01] `/areas/*/cities/*` の 410 化統一

**施策 ID**: `T0-CITY-500-01`
**Tier**: T0 (URL 空間整理)
**デプロイ日**: 2026-04-17
**コミット**: `7e4322ba`（v3 再デプロイに同梱。initial `d30094c1` → v2 revert で一時消失 → v3 で復活）
**ターゲット指標**: 5xx, リダイレクト
**想定効果値**:
- 5xx: **-500 ~ -1,500**（2,044 → 500-1,500、市区町村由来を物理削減）
- リダイレクト: **-100 ~ -200**（一部が 301 経由で処理されていた場合）
**観測予定日**: 2026-05-01 (+14d MID), 2026-05-15 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | 5xx delta | リダイレクト delta | 判定 |
|---|---|---|---|---|
| 2026-04-17 (deploy直後) | 0d | — | — | **DEPLOYED** 本番 curl: `/areas/13000/cities/13101` = 410（以前 500）、`/areas/11000/cities/11101` = 410（以前 200）確認 |

#### 変更内容

- `apps/web/src/middleware.ts`:
  - 新ブロック「Fix 4.5」を追加。`/areas/{prefCode}/cities/{cityCode}[/...]` パターンを明示的に捕捉して 410 Gone を返す
  - 既存の L231-245（旧 URL 構造 cities セグメントなし）はそのまま残す

#### 根拠

2026-04-17 本番 curl 検証で `/areas/13000/cities/13101` が 500、`/areas/11000/cities/11101` が 200、`/areas/01000/cities/01100` が 200 と挙動不一致を確認。middleware の既存ロジック（L231-245）は `areaSegments[2]` を cityCode として期待していたが、`cities` セグメントがあると条件をすり抜けていた。結果として page.tsx `areas/[areaCode]/cities/[cityCode]/page.tsx` に到達し、データ不整合で 500 になるケースや、robots.txt ブロック済みだが HTTP 200 を返すケースが混在していた。

### [T0-CANON-01] 実装不要と判明（2026-04-18）

**施策 ID**: `T0-CANON-01` / **Tier**: T0 / **結果**: ✅ NO-OP（既存実装が正しい、観測待ち）

#### 調査結果

2026-04-18 GSC から全カテゴリの URL 単位データ export を取得し、本番 curl で検証した結果:

**重複 (user canonical 無し) 534 件の内訳**:
- 97% が `/ranking/*` の素の URL（searchParams なし）
- canonical タグは既に `<link rel="canonical" href="https://stats47.jp/ranking/{key}">` で正しく自分自身を指している
- `<meta name="robots" content="index, follow">` も正常

つまり **canonical の技術的問題ではない**。真の原因は:
- 47 都道府県 × 1,899 ranking = 約 9 万通りの類似ページ
- 各ページの差分が「ランキング数値のみ、独自文章薄い」
- **Google の自動重複判定** で「別 URL を正規」扱い

**T0-CANON-01 の修正は不要**。これは T2（コンテンツ品質）領域の課題であり、canonical タグ修正では解決しない。

#### 2026-04-18 URL export 全カテゴリ分析

| カテゴリ | GSC 件数 | 本番実態 | 対処 |
|---|---|---|---|
| 404 (1,000 サンプル/全 5,727) | `/blog/tags/日本語` 152、旧 `/dashboard/*` 多数、`/ranking/prefecture/*` 17 | 全て middleware で 410 化済 | ✅ 修正検証の自然減少待ち |
| 5xx (1,000 サンプル/全 2,044) | **`/correlation/*` 968 (47%)** | middleware Fix 1 で 410 化済 | ✅ 修正検証待ち |
| redirect (1,000 サンプル/全 2,305) | 旧 `/.../dashboard/*` 系多数 | tryLegacyRedirect で処理済 | ✅ 修正検証待ち |
| soft-404 (500) | `/blog/tags/*` 153 (30%)、`/ranking/*` 33、`/areas/*` 26 | middleware で 410 化済 | ✅ 修正検証待ち |
| 重複 user canonical 無し (534) | **`/ranking/*` 517 (97%)** | canonical 正しく設定済 | ⚠️ T2 領域（コンテンツ品質） |
| 代替ページ canonical あり (885) | `/correlation?x=...&y=...` 他 | canonical 正常動作 | ✅ 正常 |

**本番 curl 検証結果**:
- `/correlation/foo-and-bar` → **410** ✅
- `/blog/tags/介護老人福祉施設` → **410** ✅
- `/dashboard/00000/dashboard/foo` → **410** ✅
- `/population/commuting-school/dashboard/foo` → **410** ✅
- `/ranking/commute-by-train` → **200** + canonical 正常 ✅
- `/ranking/blanket-consumption-expenditure` → **200**（GSC 5xx は古い）✅
- `storage.stats47.jp/ranking/prefecture/.../thumbnails/thumbnail` → **404**（別ドメイン 10 件、自然解消可）

**GSC ステータス**: ユーザーが全カテゴリで「修正を検証」押下済 → ステータス「保留」。Google が数日で再認識して未登録 URL が大幅減少する見込み。

#### 記録の永続化

URL 単位 CSV を以下に保存:
- `gcsエラー/404.csv`, `5xx.csv`, `redirect.csv`, `soft-404.csv`, `dup-no-canonical.csv`, `alt-canonical.csv`
- `.claude/skills/analytics/gsc-improvement/reference/snapshots/2026-W16/url-details/` に同ファイル配置（git 管理下の永続コピー）

#### 次の方向性

Tier 0 (URL 空間整理) は **本日時点で技術的に完了**。残る真の課題:
- **T2 (コンテンツ品質)**: `/ranking/*` の独自文章追加、テンプレ量産の縮退判断
- **T3 (外部シグナル)**: SNS 投稿再開、被リンク獲得

観測フェーズに入る。2026-05-01 MID 判定で Tier 0 施策全体の効果を自動判定。

### [T3-SNS-01] SNS 投稿再開（Sprint 1 Day 1）

**施策 ID**: `T3-SNS-01-DAY1` / **Tier**: T3 (外部シグナル) / **デプロイ日**: 2026-04-18 18:28 JST
**実行**: Playwright (`publish-x.ts`) で自動投稿、コマンド: `npx tsx .claude/skills/sns/publish-x/publish-x.ts --domain blog --immediate health-life-expectancy-structure`
**投稿内容**: `/blog/health-life-expectancy-structure` ランディング、paradox 型フック
```
日本の医師は47年で2.6倍に増えた。でも男性の"不健康な期間"は8.7年のまま縮まっていない。
健康寿命1位は大分（73.72歳）、47位は岩手（71.39歳）──その差2.33歳。医師数と健康寿命の
相関は意外にも弱い。データで見る日本の寿命の構造👇
[URL] #健康寿命 #統計
```
**画像**: 既存 OGP (`ogp.png` 62KB)
**UTM**: `utm_source=x&utm_medium=social&utm_campaign=sprint1_day1&utm_content=paradox`
**想定効果**: Sprint 1 終了時 Social 流入 +30%（Day 1 単体の目標: 48h で X impressions 1,000+、RT 3+）
**実測効果**:
| 観測日 | X impressions | X RT | Social 流入 (GA4) | 判定 |
|---|---|---|---|---|
| 2026-04-20 (+48h) | — | — | — | 観測予定 |

**Day 2-5 🚨 即時投稿事故（2026-04-18 20:40 JST）**:
予約投稿の意図だったが `publish-x.ts` の予約モード検出セレクタが X UI 変更で壊れており、4 件全て即時投稿されてしまった。ユーザー判断で残置。Sprint 1 の UTM 日別分析は崩れたが、UTM `content` 別（paradox/shock/question）の A/B 比較は可能。

| Day | 意図 | 実投稿日時 | rankingKey | UTM content |
|---|---|---|---|---|
| Day 2 | 2026-04-20 21:00 | **2026-04-18 20:36 頃** | sports-spectating-consumption-expenditure | shock |
| Day 3 | 2026-04-21 12:30 | **2026-04-18 20:37 頃** | general-hospital-bed-occupancy-rate | question |
| Day 4 | 2026-04-22 12:00 | **2026-04-18 20:38 頃** | price-index-high-low-prefecture | question |
| Day 5 | 2026-04-23 19:30 | **2026-04-18 20:39 頃** | konbu-consumption-quantity | paradox |

**対策**（commit `4b55c2d3`）:
- `publish-x.ts` を fail-safe 化（予約モード未確認なら Escape で投稿中止）
- `--dry-run` モード追加（初回 / セレクタ更新後の事前検証必須化）
- 失敗時 `.local/playwright-x-debug/` に screenshot 保存
- `knowledge/SKILL.md` に事故記録 + 汎用原則「ブラウザ自動化は fail-safe デフォルト」
- `x-strategist.md` に安全プロトコル追記

次回以降の予約投稿は **必ず `--dry-run` で事前検証してから本番実行**。

### [T3-EEAT-01] About ページ + 運営者情報（デプロイ済）

**施策 ID**: `T3-EEAT-01` / **Tier**: T3 (権威性・信頼性) / **デプロイ日**: 2026-04-18 / **コミット**: `e7ff4756` (main)
**ターゲット指標**: 重複 (user canonical 無し) 534 件、間接的に全 CTR
**想定効果**:
- E-E-A-T（Experience/Expertise/Authoritativeness/Trustworthiness）評価向上
- Google 自動重複判定の緩和（運営者の独自性を明示）
- ブログ記事の信頼度 UP
**実測効果**: Web Analytics CTR / GSC 重複件数の 2-4 週間後判定

#### 変更内容

- **新規**: `apps/web/src/app/about/page.tsx`（運営者 KAZU、元県庁職員 20 年、ミッション、編集 6 原則、お問い合わせ）
- **編集**: `apps/web/src/app/sitemap.ts`（/about を STATIC_PAGES に追加、priority 0.5）
- **編集**: `apps/web/src/components/organisms/Footer/Footer.tsx`（「このサイトについて」リンク追加）
- **次フェーズ**: blog frontmatter に author / reviewed_by 追加、Article JSON-LD に author 動的化（Sprint 2）

### [T2-RANK-EDIT-01] ranking_ai_content schema 拡張（Migration 0015）

**施策 ID**: `T2-RANK-EDIT-01-schema` / **Tier**: T2 / **デプロイ日**: 2026-04-18 / **コミット**: `e7ff4756`
**内容**: ranking_ai_content テーブルに `is_proofread` / `proofread_at` / `editorial_source` / `reviewed_by` カラム追加。Sprint 2 で実際のエディトリアル生成 + 人間校正ワークフロー構築の土台。
**想定効果**: 主要 100-200 ranking で人間校正済みエディトリアルを Google に提示、重複 user canonical 無し 517 件の解消

### [T2-CWV-01] AdSense CLS (0.732) 対策

**施策 ID**: `T2-CWV-01` / **Tier**: T2 (UX) / **デプロイ日**: 2026-04-18 / **コミット**: `5e7ac037`
**ターゲット指標**: CLS（Core Web Vitals）
**想定効果**: CLS 悪い率 2% → 0% 付近、Google ページ体験評価向上
**実測効果**:
| 観測日 | CLS 悪い率 | CLS P75 | 判定 |
|---|---|---|---|
| 2026-04-18 (deploy直後) | — | — | DEPLOYED（ベースライン: ins.adsbygoogle CLS 0.732）|

#### 変更内容
- `apps/web/src/lib/google-adsense/components/AdSenseAd.tsx`:
  - `getReservedMinHeight(format)` ヘルパー追加。placeholder / `<ins>` / 親 container の 3 箇所に minHeight 予約
  - rectangle 280px / banner 90px / skyscraper 600px / infeed/article 250px fallback

### [T2-CWV-02] Leaflet タイル Cloudflare edge cache 化

**施策 ID**: `T2-CWV-02` / **Tier**: T2 / **デプロイ日**: 2026-04-18 / **コミット**: `5e7ac037`
**ターゲット指標**: LCP（Core Web Vitals）
**想定効果**:
- LCP 悪い率: 36% → 15% 目標
- LCP P75: 5,792ms → 2,500ms 目標（Good 判定）
**実測効果**:
| 観測日 | LCP 悪い率 | LCP P75 | 判定 |
|---|---|---|---|
| 2026-04-18 (deploy直後) | — | — | DEPLOYED（ベースライン: cartocdn tile 最大 19,888ms） |

本番 curl 検証 OK: `/tiles/light_all/5/28/12.png` → 200 `X-Tile-Source: cartocdn-proxy` `s-maxage=86400`

#### 変更内容
- **新規**: `apps/web/src/app/tiles/[theme]/[z]/[x]/[ypng]/route.ts`
  - `/tiles/{light_all,dark_all}/{z}/{x}/{y}{@2x}.png` で cartocdn をプロキシ
  - `Cache-Control: max-age=2592000, immutable` 指定（OpenNext 側で s-maxage=86400 に短縮される）
  - validation: theme allowlist、zoom 0-20、x/y 数値、png pattern
- **編集**: `packages/visualization/src/leaflet/constants/tile-providers.ts`
  - TileLayer URL を `/tiles/{theme}/{z}/{x}/{y}{r}.png` に変更
  - RankingMapChart / PortLeafletMap / FishingPortLeafletMap 全てが自動で恩恵
- **編集**: `apps/web/src/app/layout.tsx`
  - `<head>` に cartocdn の preconnect / dns-prefetch、storage.stats47.jp の preconnect 追加

#### v1 失敗の記録 (commit 5fb9aa5d → revert 5e7ac037)
`export const runtime = "edge"` を指定したら OpenNext が build 失敗（"edge runtime must be defined in separate function"）。runtime 指定と cf オプションを削除して v2 で成功。

### [T2-CWV-03] ブログ内 SVG CLS 対策

**施策 ID**: `T2-CWV-03` / **Tier**: T2 / **デプロイ日**: 2026-04-18 / **コミット**: `5e7ac037`
**ターゲット指標**: CLS / LCP
**想定効果**: ブログ記事の SVG 要改善 9% の一部を解消
**実測効果**: 2026-04-18 DEPLOYED

#### 変更内容
- `apps/web/src/features/blog/components/md-content.tsx`:
  - SVG に対して `<span>` 親に `aspect-ratio: 16/9` を予約（レイアウト確定を高速化）
  - `<Image>` に `sizes` / `decoding="async"` / `loading="lazy"` 明示

### [T1-OBS-01] Cloudflare 観測基盤（traces + Analytics Engine binding）

**施策 ID**: `T1-OBS-01`
**Tier**: T1 (technical SEO / 観測基盤)
**デプロイ日**: 2026-04-18
**コミット**: — （デプロイ時に追記）
**ターゲット指標**: （間接的）5xx, クロール済み未登録、次回施策の検知速度
**想定効果**:
- 本番 5xx 発生時の URL / スタックトレースが Cloudflare Dashboard で即座に見られる
- リクエスト traces により URL × status code の時系列集計が可能に
- 次の失敗（v1/v2 のような事故）を数分で検知できる基盤が整う
- 直接のインデックス改善効果は期待しない（Tier 0 施策の効果測定を高速化するための基盤）

#### 変更内容

- `apps/web/wrangler.toml`:
  - `[env.production.observability.traces]` の `enabled` を `false` → `true`（リクエストトレース有効化）
  - `[[env.production.analytics_engine_datasets]]` を新規追加（binding: `ANALYTICS`, dataset: `stats47_requests`）
  - **middleware 変更なし**（最小変更、writeDataPoint 統合は次フェーズ）

#### 根拠

Sentry などの外部 SaaS を使わず Cloudflare 純正機能で観測基盤を構築する方針（ユーザー提案）。
Workers Observability は本番で既に `enabled = true` だが traces が無効だったため、URL 別のリクエスト詳細が見えなかった。
Analytics Engine dataset は binding 宣言のみで自動生成される。middleware から `env.ANALYTICS.writeDataPoint()` を呼ぶ実装は次フェーズ（T1-OBS-02）で追加予定。

#### 使い方（デプロイ後）

1. Cloudflare Dashboard → Workers & Pages → `stats47`（production）
2. 上部タブ「**Logs**」: エラー・console.log が検索可能
3. 上部タブ「**Metrics**」→ Invocations / Errors / CPU Time
4. traces（有効化後）: URL 別のリクエスト詳細とレスポンス時間

### [T0-THEME-01] `/themes/{unknown-slug}` の 410 化（Fix 7）

**施策 ID**: `T0-THEME-01`
**Tier**: T0 (URL 空間整理)
**デプロイ日**: 2026-04-18
**コミット**: `1c085bc5` (dev `5fb9aa5d` ESLint fix 込み、main merge 済み)
**ターゲット指標**: クロール済み未登録, 404
**想定効果値**:
- クロール済み未登録: **-50 ~ -200**（過去動線の /themes/* alias や旧 slug）
- 404: **-30 ~ -150**（404 → 410 への明示化、数値的には 404 カテゴリから移動）
**観測予定日**: 2026-05-02 (+14d MID), 2026-05-16 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | クロール未登録 delta | 404 delta | 判定 |
|---|---|---|---|---|
| 2026-04-18 (deploy直後) | 0d | — | — | **DEPLOYED** |

#### 変更内容

- **新規**: `apps/web/src/config/known-theme-slugs.ts` — `ALL_THEMES` から themeKey を Set 化（16 件、静的、all-themes.ts 更新で自動追従）
- **編集**: `apps/web/src/middleware.ts` Fix 7 ブロック追加:
  - `/themes/{slug}` で `!KNOWN_THEME_SLUGS.has(slug)` なら 410 Gone

#### 根拠

themes の動的ルート `[themeSlug]/` は `opengraph-image.tsx` のみで page.tsx を持たず、未知 slug は現状 404。Google の「削除を検出」カテゴリに滞留してインデックス除去まで時間がかかるため、middleware で明示 410 に切り替えて除去シグナルを強める。

### [T0-AREA-SUB-01] `/areas/{prefCode}/{non-indexable-sub}` の 410 化（Fix 8）

**施策 ID**: `T0-AREA-SUB-01`
**Tier**: T0 (URL 空間整理)
**デプロイ日**: 2026-04-18
**コミット**: `1c085bc5` (`5fb9aa5d` 込み、main merge 済み)
**ターゲット指標**: クロール済み未登録, 登録済み, ソフト404
**想定効果値**:
- クロール済み未登録: **-300 ~ -500**（T1-CRAWL-01 で sitemap から外した 47 × 11 = 517 URL のうち、まだ Google インデックスに残っている分）
- ソフト404: **-50 ~ -150**（indexable 外の /areas/{pref}/{sub} が 200 notFound で返していたケースを 410 化）
- 登録済み: **+100 ~ +300**（クロール予算がトップ導線に集中する副次効果）
**観測予定日**: 2026-05-02 (+14d MID), 2026-05-16 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | クロール未登録 delta | ソフト404 delta | 登録済み delta | 判定 |
|---|---|---|---|---|---|
| 2026-04-18 (deploy直後) | 0d | — | — | — | **DEPLOYED** |

#### 変更内容

- **編集**: `apps/web/src/middleware.ts` Fix 8 ブロック追加:
  - `/areas/{prefCode}/{sub}` で、prefCode が有効 5 桁・sub が `cities` 以外・sub が 5 桁数字以外・`INDEXABLE_AREA_CATEGORIES_SET` に含まれない場合 410
  - 既存 Fix 4（無効 prefCode）、Fix 4.5（cities 410）、L276 の city-code 410 と並ばず、これらが先に処理された後で残る alphabetic sub をカバー
- **新規 import**: `INDEXABLE_AREA_CATEGORIES_SET` を middleware に

#### 根拠

2026-04 の T1-CRAWL-01 で INDEXABLE_AREA_CATEGORIES を 13 → 2 に削減、sitemap から 517 URL を除外したが、**既に Google インデックスに残っている URL は sitemap から消しただけでは削除されない**。これらへの直接アクセス（Googlebot の再クロール、既存バックリンク）に対し 410 を返すことで「完全削除」を明示する。Fix 7 と同系統の対処。

### [T1-CF-01] Cloudflare キャッシュ設定（ユーザー実施）

**施策 ID**: `T1-CF-01`
**Tier**: T1 (technical SEO)
**デプロイ日**: 2026-04-14
**コミット**: — (Cloudflare Dashboard 側設定)
**ターゲット指標**: 404, 5xx
**想定効果値**:
- 404: **-50 ~ -200**（キャッシュ由来の重複カウント除去、エッジで永続化しない）
- 5xx: **-100 ~ -300**（オリジンエラーのパススルーで Googlebot が正しいステータスを受領）
**観測予定日**: 2026-04-28 (+14d MID), 2026-05-12 (+28d FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | 404 delta | 5xx delta | 判定 |
|---|---|---|---|---|
| 2026-04-17 | 3d | +66 | -3 | PENDING |

#### 設定内容

- SSL/TLS → Edge Certificates → **"Always Use HTTPS" ON** 確認済
- Caching → Cache Rules → **"Cache HTML pages"** (host = stats47.jp) に以下を追加:
  - エッジ TTL: 元の「キャッシュ制御ヘッダーを無視、1 日」は維持
  - ステータスコード TTL: **404 / 410 / 5xx を bypass（キャッシュしない）**
  - オリジンエラーページのパススルー: ON
- デプロイ後 **Purge Everything** 実施

---

### [T0-STATS-01] `/stats/*` 全パスを 410 化（2026-04-18）

**施策 ID**: `T0-STATS-01`
**Tier**: T0 (URL 空間整理)
**デプロイ日**: 2026-04-18 (未デプロイ、ローカル変更のみ)
**ファイル**: `apps/web/src/middleware.ts:99`
**ターゲット指標**: 404 / クロール済み未登録

#### 背景

W16 RCA で `/stats/*` 配下の旧 URL (例: `/stats/tag/*`, `/stats/prefecture-rank/*/2023`) が middleware で素通りし、Next.js ルーティングで 404 を返していた。`/stats/` ディレクトリは `apps/web/src/app/` に存在しない (全削除済) ため、明示的に 410 を返す。

#### 変更内容

```diff
-  pathname.startsWith("/blog/prefecture-rank/") ||
-  pathname.startsWith("/stats/prefecture-rank/")
+  pathname.startsWith("/blog/prefecture-rank/") ||
+  pathname.startsWith("/stats/")
```

#### 想定効果

- 404: -10 〜 -100 (件数は限定的、`/stats/` 配下は url-details で 4-6 件のみ)
- 観測予定: 2026-05-02 (+14d MID), 2026-05-16 (+28d FINAL)

---

### [T0-CHAIN-01] 提案のみ — 301→404 連鎖を 410 で断つ（未適用）

**施策 ID**: `T0-CHAIN-01`
**Tier**: T0
**ステータス**: **未適用** (SEO 戦略の意思決定が必要のためユーザー確認待ち)

#### 背景

W16 RCA で `/<oldcat>/<sub>/dashboard/<prefCode>` (現状 301→`/areas/<prefCode>`) と `/ranking/prefecture/<slug>` (現状 301→`/ranking/<slug>`) の 301 リダイレクトが、受け皿の canonical 不一致により「クロール済み - インデックス未登録」を 800〜1,200 件押し上げている疑い。

#### 提案 (Fix 9 / Fix 10)

`tryLegacyRedirect` の `pageType === "dashboard"` 分岐 (L72-74) と `/ranking/prefecture/` 分岐 (L186-191) を一律 `gone()` に置換。**リンクエクイティの consolidation を諦め、URL を完全に削除扱い**にする。

#### 想定効果

- クロール済み未登録: 2,415 → 1,200〜1,600 (-815〜-1,215)
- リダイレクト: 2,305 → 1,200〜1,500 (-805〜-1,105)

#### 判断ポイント

- **適用すべき場合**: 旧 URL からの被リンクがほぼ無い、サイト規模が小さい、Google からの除去を急ぎたい
- **見送るべき場合**: 旧 URL 構造に外部被リンクが残存している (検索順位への影響を避ける)

ユーザー判断後、別 commit で `[T0-CHAIN-01]` として施策化する。

---

### [T0-TAG-GONE-01] 提案のみ — 未使用英語タグを `GONE_TAG_KEYS` に追加（未適用）

**施策 ID**: `T0-TAG-GONE-01`
**Tier**: T0
**ステータス**: **未適用** (DB 照合が必要)

#### 背景

W16 RCA で `/tag/<英語slug>` の 19 件が GSC 404 に出現。例: `weight`, `communication-costs`, `occupational-accidents`, `manufacturing-location`, `fiscal-disparity`, `regional-revitalization`, `densely-inhabited-districts`, `forests`, `dual-income-households`, `workers-compensation` 等。

#### 提案 (Fix 13)

`apps/web/src/config/gone-tag-keys.ts` に上記 slug を追加。**ただし DB の `tags` テーブルに該当 slug が無いことを確認してから追加**する (誤って有効タグを 410 化しないよう注意)。

```bash
# DB 照合用クエリ例
node -e "const db=require('better-sqlite3')('.local/d1/...'); console.log(db.prepare('SELECT slug FROM tags WHERE slug IN (?,?,?)').all('weight','communication-costs','occupational-accidents'))"
```

---

## 3. Observation Log

### 3.1 カテゴリ指標表

週次観測の raw data。**1 行追記で OK**、長文は不要。

| 日付 | 404 | 5xx | ソフト404 | クロール済み未登録 | 検出未登録 | リダイレクト | 登録済み | 未登録 | 備考 |
|---|---|---|---|---|---|---|---|---|---|
| 2026-04-10 | 5,661 | 2,047 | 506 | 2,339 | 1,536 | 2,308 | 1,808 | 16,552 | **Baseline** |
| 2026-04-17 | 5,727 | 2,044 | 500 | 2,415 | 1,394 | 2,305 | 1,860 | 16,628 | **MID**: T1-* 施策デプロイから 3 日。登録済み/未登録は 2026-04-13 時点（GSC 遅延）。アラート非発火 |

### 3.2 施策効果サマリ

`/gsc-improvement observe` 実行時に自動追記。施策 ID × 観測時点の判定マトリクス。

**判定ロジック** (経過日数 ≥ 14d 時):
- ✅ FULL_EFFECT: 想定 delta の 80% 以上達成
- ⚠️ PARTIAL_EFFECT: 想定 delta の 20%〜80% 達成
- ❌ NO_EFFECT: 想定 delta の 20% 未満
- 🚨 ADVERSE: 悪化方向
- PENDING: 14 日未満（効果未到達）

| 観測日 | 施策ID | Tier | 経過日数 | ターゲット | 想定 delta | 実測 delta | 判定 |
|---|---|---|---|---|---|---|---|
| 2026-04-17 | T1-MW-01 | T1 | 3d | 404, リダイレクト | 404: -200~-500 / リダイレクト: -150~-300 | 404: +66 / リダイレクト: -3 | PENDING |
| 2026-04-17 | T1-SRC-01 | T1 | 3d | ソフト404, 5xx | ソフト404: -300~-450 / 5xx: -500~-1,000 | ソフト404: -6 / 5xx: -3 | PENDING |
| 2026-04-17 | T1-CRAWL-01 | T1 | 3d | クロール未登録, 検出未登録, 登録済み | -1,000~-1,500 / -400~-700 / +300~+700 | +76 / -142 / +52 | PENDING |
| 2026-04-17 | T1-CF-01 | T1 | 3d | 404, 5xx | 404: -50~-200 / 5xx: -100~-300 | 404: +66 / 5xx: -3 | PENDING |

### 2026-04-14 記述 — T1-* 全施策デプロイ
- 本日 `2784b1d2` を main にマージ・デプロイ
- Cloudflare Purge Everything 実施済
- GSC「修正を検証」は各レポートで順次押下予定
- 次回 FINAL 観測: **2026-04-28 頃**（デプロイ +14 日、SEO 効果測定可能日）

### 2026-04-17 記述 — MID 中間観測
- GSC 手動 export を取り込み (`~/Downloads/stats47.jp-Coverage-2026-04-17/` → `gcsエラー/`)
- 検出未登録 -142（sitemap URL 611→94 の効果が早期に反映）、登録済み +52 の兆候
- 404 +66、クロール済み未登録 +76 は未浸透範囲（MID ラベル）
- アラート非発火、2026-04-28 の FINAL 観測まで静観
- **根本問題発見**: 登録済み 1,860 : 未登録 16,628 = 比率 9.1:1、sitemap は 620-870 URL しか出力していないので **約 17,000 URL が過去の URL 残骸**。Tier 0 施策群を Next Actions に追加

### 2026-04-17 記述 — URL 空間差分と本番動作の緊急発見

**URL 空間差分（analyze-url-space.cjs 実測値）**:
- 実 sitemap URL 数: **2,284**（推定 620-870 だったが 2 倍以上、想定外）
- Google 認識 URL (pages.csv): **1,036**
- A_both（健全）: **419**
- B_google_only（sitemap 外だが認識）: **617**（中でも areas/cities 262, other 222）
- C_sitemap_only（未クロール or 未登録）: **1,865**（中でも ranking/detail **1,566**）

**本番 curl 検証で発見した致命的問題 3 件**:

1. 🚨 `/ranking/{存在しないキー}` が **常に 200 を返す**
   - 例: `/ranking/this-does-not-exist-12345`, `/ranking/xxxxxxxxxxxxxx` 全て 200
   - page.tsx には `notFound()` が正しく書かれているが、ISR or Cloudflare キャッシュで旧データが残っている疑い
   - **クロール済み未登録 2,415 件の最大候補**。Google は「無限の薄いページ」と判定しうる
   - 新規施策: **T0-RKG-200-01**（最優先）
2. 🚨 `/areas/13000/cities/13101` が **500 を返す**（他の prefCode では 200 が混在）
   - robots.txt ブロック & middleware 410 のはずが、ケースで挙動不一致
   - **5xx 2,044 件の発生源の 1 つ**
   - 新規施策: **T0-CITY-500-01**
3. ⚠️ `/tag/nonexistent-slug` が **404**（410 期待）
   - GONE_TAG_KEYS が空のため page.tsx notFound() で 404
   - Google 的に 404 と 410 は別扱い（410 が確定削除）
   - T0-404-01 の具体化: GONE_TAG_KEYS 充足を最優先化

**結論**: 未登録 16,628 の少なくとも数千規模は上記 3 件が原因。T0-RKG-200-01 と T0-CITY-500-01 を Next Actions の最優先に追加。

---

## 4. Next Actions

優先度順。実施したら Action Log に移動し、ここから削除する。**Tier 0 を Tier 1 より先に消化する**（URL 空間が整理されるまで他 Tier の効果測定が曖昧になる）。

### Tier 0 — URL 空間整理（最優先）

登録済み 1,860 : 未登録 16,628 という比率 (9.1 : 1) の異常を解消するための物理削減施策群。sitemap 出力 2,284 URL に対し Google 認識 URL が 18,488 = 約 16,000 が「過去の URL 残骸 + 動的パターン爆発」。

#### [T0-RKG-200-01] `/ranking/{存在しないキー}` が 200 を返す問題の修正（🚨 最優先）

**ターゲット指標**: クロール済み未登録, ソフト404, 登録済み
**想定効果値**: クロール済み未登録: **-1,500 ~ -2,000** / ソフト404: **-200** / 登録済み: **+300 ~ +800**
**根拠**: 2026-04-17 本番検証で `/ranking/this-does-not-exist-12345` 等ランダムキー全てが 200 を返す事実を確認。page.tsx に `notFound()` は書かれているが、ISR or Cloudflare キャッシュで旧データが残っている。sitemap 外の C_sitemap_only ranking/detail 1,566 URL の大半がこれ
**手順**:
1. `apps/web/src/app/ranking/[rankingKey]/page.tsx` の `notFound()` が ISR キャッシュで無効化されていないか確認
2. `generateStaticParams` で事前生成対象を `is_active = true AND rankingKey NOT IN GONE_RANKING_KEYS` に限定（既存確認）
3. ISR の revalidation タイミングを短縮 or `dynamic = 'force-dynamic'` でキャッシュ無効化
4. Cloudflare Cache Rules で `/ranking/*` の 404/410 は必ず bypass
5. デプロイ後、`curl https://stats47.jp/ranking/nonexistent-12345` で 404 を返すことを確認

#### [T0-CITY-500-01] `/areas/*/cities/*` の 500 発生源修正

**ターゲット指標**: 5xx
**想定効果値**: 5xx: **-500 ~ -1,500**
**根拠**: 2026-04-17 本番検証で `/areas/13000/cities/13101` が 500、他の prefCode では 200 が混在。middleware で 410 処理されるはずが不一致。5xx 2,044 件の中で市区町村 URL の占有率が高い推定
**手順**:
1. middleware.ts の市区町村 URL 処理ロジック確認（全 prefCode で確実に 410 を返す）
2. B_google_only の areas/cities 262 URL の全パターンを url-space-diff.csv から抽出
3. 全パターンに対して本番 curl で status 確認し、500 を返すものを特定
4. 修正後デプロイ、再検証

#### [T0-404-01] 404 5,727 URL の パターン特定 → 追加 410 化

**ターゲット指標**: 404
**想定効果値**: 404: -3,000 ~ -5,000（削除予定ページを全て 410 Gone で確定）
**着手条件**:
- ユーザーが GSC UI から「見つかりませんでした (404)」カテゴリの URL サンプル CSV を export
- 配置先: `gcsエラー/404.csv`（`USER_EXPORT_GUIDE.md` 参照）
**手順**:
1. `node .claude/skills/analytics/gsc-improvement/scripts/analyze-url-space.cjs` で sitemap 外 URL を特定
2. `404.csv` の URL をパターン分類:
   - `/tag/{英語slug}` → `gone-tag-keys.ts` に追加
   - `/ranking/{旧slug}` → `gone-ranking-keys.ts` に追加
   - 旧カテゴリパス（`/economy/*`, `/population/*` 等）→ middleware で 410 化
   - その他 → pattern 別に middleware 追加
3. PR 作成、デプロイ、Action Log に `[T0-404-01]` 追記

#### [T0-5xx-01] 5xx 2,044 の発生源特定 → 410 or 修正

**ターゲット指標**: 5xx
**想定効果値**: 5xx: -1,500 ~ -2,000（発生源を完全停止）
**着手条件**:
- ユーザーが Cloudflare Workers Logs から過去 24h の status=5xx の URL パターンを取得（もしくは GSC から 5xx.csv を export）
**手順**:
1. URL 単位で発生頻度集計
2. パターン分類（例: sitemap タイムアウト / SSR 重いページ / R2 フェッチ失敗）
3. 対策: 削除対象は 410、残すページは最適化（D1 クエリ改善、R2 fallback、ISR 設定）

#### [T0-RDR-01] リダイレクト 2,305 の連鎖解消

**ターゲット指標**: リダイレクト
**想定効果値**: リダイレクト: -1,500 ~ -2,000（単一 301 or 直接 410）
**着手条件**: `gcsエラー/redirect.csv` が揃った時点
**手順**:
1. redirect.csv から 301 → 301 → 200 の連鎖パターンを特定
2. middleware で直接最終 URL へ飛ばす
3. もはや到達先が存在しない URL は 410 に変更

#### [T0-CRAWL-02] クロール済み未登録 2,415 の URL 精査

**ターゲット指標**: クロール済み未登録, 登録済み
**想定効果値**: クロール済み未登録: -1,500 / 登録済み: +500 以上
**着手条件**: `gcsエラー/crawl-not-indexed.csv` が揃った時点
**手順**:
1. URL をパターン分類（areas/category, ranking/detail, blog/detail 等）
2. 低価値（例: 47 都道府県 × 類似テンプレ）→ 対象セクションに `noindex, follow` 追加 or sitemap 除外
3. 高価値だがクロール予算不足 → 内部リンク強化 + indexable フラグ再確認

#### [T0-CANON-01] searchParams の canonical 統合

**ターゲット指標**: 代替ページ, 重複 (user canonical 無し)
**想定効果値**: 重複: -400 ~ -500
**候補**:
- `/ranking/{key}?year=...` → canonical = `/ranking/{key}`（✓ 実装済みだが効いていない可能性）
- `/search?q=...&type=...` → canonical = `/search`
- `/compare/{key}?areas=...` → canonical = `/compare/{key}`（noindex 済みで効果薄いかも）
- `/areas/{code}/{cat}?ranking=...` → canonical = `/areas/{code}/{cat}`
**手順**:
1. pages.csv で searchParams 付き URL を検出
2. 各ページの canonical 実装を `grep -r "alternates: { canonical"` で確認
3. 抜けがあれば修正、全て `pathname only` に統一

### Tier 1 — 観測後の追加施策（T1-* デプロイ効果測定後）

#### [T1-CRAWL-02] `INDEXABLE_AREA_CATEGORIES` の再拡張 or 更なる縮退

**判断基準**:
- 2026-04-28 頃の FINAL 観測で T1-CRAWL-01 の判定が FULL_EFFECT / PARTIAL_EFFECT
- 効果ありなら `educationsports`, `socialsecurity` を追加で再開（登録済みに余裕ができたため）
- 効果なしなら 2 から 0 まで絞る（テンプレ量産の完全停止）

### Tier 3 — 観測後の調査系

#### [T3-SCRIPT-01] Downloads 自動取り込み動作確認 (旧 N7)

**着手条件**: 2026-04-24 or 2026-W17 の週次レビューで初めて自動実行される
**合格条件**:
- `~/Downloads/stats47.jp-Coverage-YYYY-MM-DD/` を検出してログ `[downloads] ... copied from ...` を出す
- `snapshots/YYYY-Www/index-coverage.csv` と `index-trend.csv` が生成される
- 冪等性（2 回実行しても副作用なし）
成功したら本エントリを削除する

---

## 付録: GSC データ取得ガイド

### 手動エクスポート手順

1. [Google Search Console](https://search.google.com/search-console) にログイン
2. プロパティ `sc-domain:stats47.jp` を選択
3. 左メニュー → 「インデックス作成」 → 「ページ」
4. 上部「未登録」タブ → 各カテゴリをクリック
5. 右上「エクスポート」 → CSV → ダウンロード
6. プロジェクトルートの `gcsエラー/` ディレクトリに配置
   - ファイル名: `表.csv`（URL 単位）/ `重大な問題.csv`（集計）/ `平均読み込み時間のチャート.csv`（トレンド）

### API 取得（`/fetch-gsc-data` スキル）

検索パフォーマンス系データ（クエリ・ページ別クリック）は `/fetch-gsc-data` スキルで取得。
ただし **「ページインデックス登録」レポート（本スキルが追跡する対象）は Search Console API では取得不可**。
GSC 画面からの手動エクスポートが唯一のソース。
