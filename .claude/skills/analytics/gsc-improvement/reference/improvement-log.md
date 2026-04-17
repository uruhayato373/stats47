# GSC 改善記録

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
**デプロイ日**: 2026-04-17（予定）
**コミット**: — （デプロイ時に追記）
**ターゲット指標**: クロール済み未登録, ソフト404, 登録済み
**想定効果値**:
- クロール済み未登録: **-1,500 ~ -2,000**（2,415 → 400-900）
- ソフト404: **-150 ~ -250**（500 → 250-350）
- 登録済み: **+300 ~ +800**（1,860 → 2,100-2,700）
**観測予定日**: デプロイ日 +14d (MID), +28d (FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | クロール未登録 delta | ソフト404 delta | 登録済み delta | 判定 |
|---|---|---|---|---|---|

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
**デプロイ日**: 2026-04-17（未デプロイ、PR 準備完了）
**コミット**: — （デプロイ時に追記）
**ターゲット指標**: 5xx, リダイレクト
**想定効果値**:
- 5xx: **-500 ~ -1,500**（2,044 → 500-1,500、市区町村由来を物理削減）
- リダイレクト: **-100 ~ -200**（一部が 301 経由で処理されていた場合）
**観測予定日**: デプロイ日 +14d (MID), +28d (FINAL)
**実測効果** (observe で自動追記):
| 観測日 | 経過日数 | 5xx delta | リダイレクト delta | 判定 |
|---|---|---|---|---|

#### 変更内容

- `apps/web/src/middleware.ts`:
  - 新ブロック「Fix 4.5」を追加。`/areas/{prefCode}/cities/{cityCode}[/...]` パターンを明示的に捕捉して 410 Gone を返す
  - 既存の L231-245（旧 URL 構造 cities セグメントなし）はそのまま残す

#### 根拠

2026-04-17 本番 curl 検証で `/areas/13000/cities/13101` が 500、`/areas/11000/cities/11101` が 200、`/areas/01000/cities/01100` が 200 と挙動不一致を確認。middleware の既存ロジック（L231-245）は `areaSegments[2]` を cityCode として期待していたが、`cities` セグメントがあると条件をすり抜けていた。結果として page.tsx `areas/[areaCode]/cities/[cityCode]/page.tsx` に到達し、データ不整合で 500 になるケースや、robots.txt ブロック済みだが HTTP 200 を返すケースが混在していた。

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
