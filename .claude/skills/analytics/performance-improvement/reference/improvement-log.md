# PSI / Core Web Vitals 改善ログ

パフォーマンス指標（PSI スコア・Lab data・CrUX 実ユーザー計測）の継続的追跡と改善施策の記録。

> **2026-04-25 確認**: 推測ベース判定の根絶ルール（`.claude/rules/evidence-based-judgment.md`）に基づき本ファイルを点検。NG ワード（「のはず」「兆候」「浸透待ち」等）残存なし。新規エントリは下記テンプレに従うこと。

**運用ルール:**
- Append-only。過去エントリは改変しない
- 日付は絶対日付（YYYY-MM-DD）
- 数値はソース明示（「PSI 2026-03-28 取得 / snapshots/2026-03-28/metrics.csv」）
- 施策とコミット hash をペアで記録
- snapshot ディレクトリは本ログと一緒にコミット
- **想定効果は必ず根拠を併記**（過去事例 / Google 公式ガイド / 計算式）
- **実測値は取得コマンドへのリンク併記**

## 新規エントリテンプレ（必ず参照: `.claude/rules/evidence-based-judgment.md`）

```markdown
### [EXP-NNN] タイトル
- **デプロイ日**: YYYY-MM-DD / コミット: <hash>
- **想定効果**: <定量値> [根拠: <PSI 過去事例 / web.dev URL>]
- **検証コマンド**: `curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/<path>&strategy=mobile"`
- **実測 (before)**: LCP X ms / CLS Y / 取得日 / `snapshots/<date>/metrics.csv`
- **実測 (after)**: LCP X ms / CLS Y / 取得日 / `snapshots/<date>/metrics.csv`
- **判定**: effect/* [根拠: 実測 / 想定 = X%、経過 N 日]
- **未確定 / 仮説**: <あれば「[仮説] 〜 / 検証期日 YYYY-MM-DD」形式>
```

---

## Baseline

**取得日**: 2026-03-27 / 2026-03-28
**ソース**: `snapshots/2026-03-27/metrics.csv`（17 行）, `snapshots/2026-03-28/metrics.csv`（8 行）
**取得手段**: `/lighthouse-audit`（PageSpeed Insights API）

### サンプル（ホームページ・モバイル/デスクトップ両方）

| date | url | strategy | performance | LCP (ms) | CLS | TBT (ms) | TTFB (ms) |
|---|---|---|---:|---:|---:|---:|---:|
| 2026-03-28 | `/` | both | 59 | 9,993 | 0.0002 | 222 | 1,393 |
| 2026-03-28 | `/areas/01000` | both | 58 | 10,495 | 0.000 | 120 | 356 |
| 2026-03-28 | `/areas/13000` | both | 55 | 10,979 | 0.021 | 86 | 22,082 |

### Budget 違反サマリ（budgets.json 基準）

- `all × mobile × lcp_ms <= 2500` **NG**（ほぼ全 URL で 5,000〜11,000ms）
- `all × mobile × score_performance >= 80` **NG**（55〜59）
- CLS は合格圏（ほぼ 0）
- TBT は合格圏（100〜300ms、警告圏が一部）

---

## Action Log

### [EXP-003] Cookie 同意バナーを LCP 候補から外す — setVisible を 4s 遅延

- **デプロイ日**: 2026-04-26 (予定) / コミット: <pending>
- **想定効果**: stats47.jp/ mobile LCP 8,251ms → 2,500ms 以下 (-69%) [根拠: PSI 2026-04-25 で LCP 要素を `body.fixed > div.container > p` (CookieConsentBanner) と特定、render delay 3,075ms。banner を LCP 計測ウィンドウ後に挿入すれば本来意図した FeaturedRankings (`apps/web/src/app/page.tsx:121`) が LCP に戻る]
- **検証コマンド**: `curl 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/&strategy=mobile&category=performance' | jq '.lighthouseResult.audits["largest-contentful-paint"].numericValue, .lighthouseResult.audits["largest-contentful-paint-element"].details.items[0].node.snippet'`
- **実測 (before)**: LCP 8,251ms / FCP 3,751ms / TBT 353ms / Perf 57 / 取得日 2026-04-25 / `.claude/state/metrics/psi/psi-batch-2026-04-25T17-39-06.json`
- **実測 (after)**: <pending — 翌朝 PSI 自動計測待ち>
- **判定**: pending
- **未確定 / 仮説**:
  - **[仮説]** banner を 4s 遅延すれば FeaturedRankings が LCP になる / 検証期日 2026-04-27 / 期日後の判定: LCP < 2,500ms かつ lcp_element が `FeaturedRankings` 配下なら effect/full、LCP < 5,000ms なら effect/partial、それ以外は別の LCP 候補（hero h1 / FCP 自体の遅延）を再調査
  - **[別件]** CrUX TTFB 2,390ms (lab 4ms と乖離) → Cloudflare cache miss path 調査が必要。本 EXP のスコープ外、別 EXP で扱う
- **副次計測**: `/themes/*` `/ranking/*` 詳細ページの LCP も同じ banner が起点になっていれば同程度改善するか合わせて観測（mobile LCP 11,000-15,000ms 帯）

### 2026-04-17: 計測データを D1 → ファイルへ移行

- 旧 D1 テーブル `performance_metrics` / `performance_budgets` を `.claude/skills/analytics/performance-improvement/` 配下のファイルに移行
- 理由: 「計測蓄積は .claude/ 配下のファイル」という記録先統一原則（.claude/rules/data-storage.md）
- 旧データは snapshots/YYYY-MM-DD/metrics.csv として保存、閾値は budgets.json に集約
- コミット: (本コミットで確定)

---

## Observation Log

_（次回 `/lighthouse-audit` 実行後に追記）_

---

## Next Actions

Baseline のデータから以下を優先候補として検討:

1. **LCP 2.5s 達成**: 主要ページ（/, /areas/*）で LCP > 10s が常態化している。画像最適化・JS 削減・SSR データ取得の見直しが必要
2. **Performance スコア 80 達成**: 現状 55〜59。LCP 改善と同時に進行
3. **TTFB 改善**: `/areas/13000` で 22,082ms という異常値あり（計測時のコールドスタートか恒常的か要判定）

次回アクション決定時に `/nsm-experiment propose` から EXP-NNN として登録する想定。

---

### [EXP-004] Merge pull request #290 from uruhayato373/feature/w20-review-w21-plan

- **デプロイ日**: 2026-05-16 / コミット: `4a6a427`
- **想定効果**: (未記入 — `.claude/rules/evidence-based-judgment.md` に従って記入)
- **検証コマンド**: (未記入)
- **実測 (before)**: (未記入)
- **実測 (after)**: (未記入)
- **判定**: `effect/pending` — 自動 stub。判定は次の週次レビューで埋める
- **未確定 / 仮説**: 自動 stub。Append-only ルールに従い、後続で更新する場合は新エントリを追加

_Auto-stub by `.claude/scripts/lib/append-improvement-log.mjs`_

---

### [T2-SNS-STATION-01] feat: category description 差別化 + BLOG-CTR-05 brushup + GA4 try/catch + CWV CLS 修

- **デプロイ日**: 2026-06-06 / コミット: `73917c8`
- **想定効果**: (未記入 — `.claude/rules/evidence-based-judgment.md` に従って記入)
- **検証コマンド**: (未記入)
- **実測 (before)**: (未記入)
- **実測 (after)**: (未記入)
- **判定**: `effect/pending` — 自動 stub。判定は次の週次レビューで埋める
- **未確定 / 仮説**: 自動 stub。Append-only ルールに従い、後続で更新する場合は新エントリを追加

_Auto-stub by `.claude/scripts/lib/append-improvement-log.mjs`_

---

### [CWV-RANKING-LCP-01] ranking mobile LCP — map tile preload を lg 以上に限定 (判定確定)

- **デプロイ日**: 2026-06-02 頃 (commit 1b09ae45、バックログ記載。PSI 実測で 06-03 から改善開始)
- **想定効果**: mobile で不要な map tile preload を排除し ranking 詳細の LCP 改善
- **検証コマンド**: `awk -F',' '$2 ~ /ranking\// && $3=="mobile" {print $1,$2,$6}' .claude/state/metrics/psi/history.csv`
- **実測 (2026-07-03 取得, `.claude/state/metrics/psi/history.csv`)**: ranking 詳細 4 URL mobile LCP 平均
  10,252ms (2026-05-25〜06-02, n=30) → 6,898ms (06-03〜06-12, n=22) → 6,734ms (06-14〜06-23, n=28) → 6,833ms (07-02, n=4)
- **判定**: `effect/partial` [根拠: -34% 改善が 4 週持続。ただし 06-13 の PERF-OPENNEXT-CACHE-01 / PERF-D3-BUNDLE-01 と後半交絡・good 閾値 2,500ms 未達]
- **未確定 / 仮説**: **[仮説]** 残り ~4,300ms のギャップは LCP 要素自体 (チャート/画像) 由来。**検証コマンド**: PSI API で `lighthouseResult.audits['largest-contentful-paint-element']` を取得し要素特定。**検証期日**: 次回 PSI 深掘り施策の起票時

### [CWV-THEMES-CLS-01] ThemeDashboardTabbed Suspense fallback CLS 除去 (判定確定)

- **デプロイ日**: 2026-06-06
- **検証コマンド**: `awk -F',' '$2 ~ /themes/ && $3=="mobile" {print $1,$2,$7}' .claude/state/metrics/psi/history.csv`
- **実測 (2026-07-03 取得, `.claude/state/metrics/psi/history.csv`)**: themes 詳細 3 URL mobile CLS 0.263-0.288 (06-03/06-04) → **0.000 が 06-06〜06-23 の全日次計測で持続**
- **判定**: `effect/full` [根拠: 安定 baseline (0.263-0.288) からの明確な改善が 17 日間持続。因果確定]
- **未確定 / 仮説**: ★**新規回帰を検出**: 2026-07-02 計測で themes 詳細 mobile CLS 0.386 (06-23 は 0.000、06-24〜07-01 は PSI 欠測)。本施策後 17 日間 0 のため**別原因**。**[仮説]** 06-24〜07-02 のデプロイに CLS 要因が混入。**検証コマンド**: `git log --oneline --since=2026-06-24 --until=2026-07-02` の範囲を bisect + PSI 再計測。**検証期日**: 2026-07-10 (新規施策として起票)

_Appended by improvement-triage 2026-07-03_

---

### [MCP-PERF-2026-08-05] Chrome DevTools + Cloudflare 深掘り監査

- **監査日**: 2026-08-05
- **対象**: 本番 `https://stats47.jp`
- **Chrome条件**: 412x915 / DPR 2.625 / mobile+touch / Slow 4G / CPU 4x slowdown
- **Cloudflare資料**: [Workers Traces](https://developers.cloudflare.com/workers/observability/traces/) / [Cache Response Rules](https://developers.cloudflare.com/cache/how-to/cache-response-rules/)
- **Claude Code MCP状態**:
  - `chrome-devtools`: connected
  - `cloudflare-docs`: connected
  - `cloudflare-observability`: Needs authentication
  - `cloudflare-graphql`: Needs authentication

#### Route別の再現値

| Route | LCP | CLS | 主な証拠 |
|---|---:|---:|---|
| `/ranking/total-population` | 5,853ms / repeat 6,423ms | 0.01 / repeat 0 | LCPは `/tiles/light_all/5/28/12@2x.png`。load delay 5,835ms、priority Low、initial documentから未発見 |
| `/areas/13000` | 3,255ms | 0 | TTFB 783ms、render delay 2,472ms、DOM 9,101、rail `nav` children 873 |
| `/` | 1,255ms | 0 | 同条件でgood。横断的な削除・遅延対象にしない |
| `/themes/local-economy` | 1,419ms | 0 | 同条件でgood |
| `/blog` | 1,321ms | 0 | 同条件でgood。日次PSIとの変動があるため1回の結果で施策化しない |

#### Rankingで確定した原因

1. `RankingPageHeadAssets.tsx` は先頭を含む全4タイルpreloadに `media="(min-width: 1024px)"` を付けている。実際のモバイルLCPタイルは `initialTileUrls[0]` と同一だが、モバイルではpreloadされない。
2. repeat traceのLCP内訳は TTFB 519ms / load delay 5,835ms / load 8ms / render delay 61ms。転送時間ではなく発見遅延が支配する。
3. LCP Discoveryは `fetchpriority=high` とinitial document discoveryがfail。タイル自体はqueue後ほぼ即時取得されている。
4. `apps/web/src/app/layout.tsx` のCartoDB preconnectはunused。ブラウザのタイルURLは同一origin `/tiles/*` であり、fallback先への接続予約というコメントと実挙動が一致しない。
5. `/app/category/population/items.json` は137件 / 135,145 bytes。Containerは全137件をClientへ渡し、Clientで最大20件にsliceしている。
6. production ranking HTMLは圧縮転送374,232 bytes、非圧縮1,287,062 bytes。RSC scriptへcategory itemsとTopoJSONが直列化されている。
7. `packages/gis/data/geoshape/prefecture.topojson` は1,917,623 bytes。既存生成物は865,385 bytes。`topojson-simplify` 後に再quantizeするローカル試算では weight `0.0003` / quantization `100_000` で94,438 bytesまで削減できた。ただし表示品質・R2契約は未検証のため候補値であり、確定値ではない。
8. DOMは1,311、forced reflowは合計580ms、render-blocking CSSの推定LCP savingsは0ms。LCP修正より先に広範なDOM/JS refactorを行う根拠はない。

#### Areaで確定した原因

1. `AreaProfileSidebar.tsx` がstrengths / weaknessesを全件描画し、各項目へTooltipを作る。
2. responsive `PageShell` はright railをdesktop/mobile位置へ各1回描画するため、巨大railがDOM内で重複する。
3. shell全体の再設計より、sidebar境界で各12件へ制限する方が外科的。beforeはDOM 9,101、最大children 873。
4. hashed CSS `/_next/static/css/41d7b5e2cb6a9f4d.css` は115,135 bytes、`Cache-Control: public, max-age=0, must-revalidate`、Chromeでは304再検証。RenderBlocking推定はFCP/LCP 576ms。
5. Lighthouse mobile navigationはAccessibility 97 / SEO 100。`GenderPairedKpiGrid.tsx` の固定青 `#3b82f6` は3.67:1、桃 `#ec4899` は3.52:1で4.5:1未達。

#### Workersで追加調査が必要な証拠

`.claude/state/metrics/cloudflare/snapshots/2026-08-02.json` はrequests 31,759、errors 0、subrequests 4,641、CPU p50 14,824us / p99 1,910,222us、wall p50 226,403us / p99 4,541,798us。2026-07-27〜08-02もCPU p99 1.48〜2.02s、wall p99 3.80〜4.61sが継続している。

`apps/web/wrangler.toml` はlogs / tracesを有効化し、trace samplingは1。Cloudflare公式資料ではautomatic traceがfetch / R2 binding spanを記録するため、samplingやコードを先に変更せず、認証後にslow pathを特定する。

#### 実装対象と停止条件

| ID | 実装対象 | 成功条件 | 停止条件 |
|---|---|---|---|
| `PERF-RANKING-LCP-02` | mobile先頭tile preload + stale Carto hint削除 | High priority / initial discovery / map契約維持 | なし。ローカル実装・検証まで進める |
| `PERF-RANKING-PAYLOAD-01` | sidebar server選別、TopoJSON候補削減 | Client最大20件、HTML 50%以上削減、候補150KB以下 | R2 write前に承認 |
| `PERF-AREA-DOM-01` | rail各12件制限 | DOM 70%以上削減、最大children解消 | なし。ローカル実装・検証まで進める |
| `PERF-STATIC-CACHE-01` | `/_next/static/*` browser cache rule案 | `max-age=31536000, immutable`、304再検証なし | Cloudflare rule変更前に承認 |
| `PERF-WORKER-P99-01` | route / binding別slow trace調査 | 支配routeを実測特定、またはsample不足を明記 | MCP認証不能または根拠不足ならコード変更しない |
| `A11Y-AREA-CONTRAST-01` | 男女KPI色のcontrast是正 | light/dark 4.5:1以上、当該Lighthouse違反0 | なし。ローカル実装・検証まで進める |

#### 今回追加しない施策

- 広告・A8の一括削除: third-party main-thread時間は観測したが、trace上の推定LCP savingsは0ms。収益影響を伴う変更の根拠がない。
- 汎用画像圧縮: homepageのwasted bytesは観測したがLCP推定0msで、既存 `ASSET-POLICY-BURNDOWN-01` と重複する。
- `/blog` 固有修正: 今回のChrome再現はLCP 1,321ms。日次PSIの遅い1点だけで原因を断定しない。
- ranking mapの削除・背景tile停止: 2026-08-02の失敗を固定した既存契約に反し、今回の実測もpreload不整合を示している。

- **判定**: 実装前。対象6件を `effect/pending` ではなく `pending` として改善バックログへ登録する。

---

### [MCP-PERF-2026-08-05-IMPL] 上記監査の実装 (Step 1-4 + STATIC-CACHE)

- **実装日**: 2026-08-05 (デプロイ前)
- **環境**: 会社 Windows PC。dev サーバーは hook で機械ブロックされるため、検証は
  unit test / type-check / build と**デプロイ後の本番実測**で行う。Chrome DevTools MCP と
  Cloudflare MCP は本セッションに未ロード (`.mcp.json` 修正前に起動したため) で、
  after の trace 取得はデプロイ後の別セッションに残す。

#### 変更内容と機械的検証

| ID | 変更 | 追加した決定的契約 |
|---|---|---|
| `PERF-RANKING-LCP-02` | `RankingPageHeadAssets.tsx`: 先頭タイルのみ `media` を外し全 viewport で preload (fetchPriority=high 維持)、2〜4 枚目は desktop 限定のまま。`layout.tsx` の cartocdn preconnect×1 + dns-prefetch×4 を削除 | `ranking-tile-preload-contract.test.tsx` (4): renderToStaticMarkup で実 HTML を検査。**mutation テスト実施** — media を全枚へ戻すと `discovers the LCP tile on every viewport` が落ちることを実測確認 |
| `PERF-RANKING-PAYLOAD-01` (sidebar) | `selectSidebarItems` / `hashString` / `SidebarRankingItem` を `select-sidebar-items.ts` へ pure module 化。Container (server) が 20 件へ選別してから Client へ渡す | `select-sidebar-items.test.ts` (9): テスト内複製を廃止し実関数を import。複製版が持っていなかった group 代表選別・normalizationBasis 除外・代表不在 group の除外を追加検証 |
| `PERF-AREA-DOM-01` | `AreaProfileSidebar.tsx`: `SIDEBAR_ITEM_LIMIT = 12` で slice。見出しの件数は総数のまま | `AreaProfileSidebar.test.tsx` (4): 40 件渡して描画リンク 24 (12+12)、見出しは総数、0 件でカード非描画 |
| `A11Y-AREA-CONTRAST-01` | `GenderPairedKpiGrid.tsx`: `text-[#3b82f6]`/`text-[#ec4899]` → `text-blue-700 dark:text-blue-400` / `text-pink-700 dark:text-pink-400`。「男性 / 女性」の可視ラベルを追加 | `GenderPairedKpiGrid.test.tsx` (4): 生 hex 不使用、light/dark 両クラス、非色識別、値と順位の維持 |
| `PERF-STATIC-CACHE-01` | **Cloudflare Rule ではなく `apps/web/public/_headers` で解決**（下記） | `static-assets-headers.test.ts` (3): 対象が `/_next/static/*` の 1 行だけであること、splat 1 個以内 |

- 検証: `npm run type-check --workspace apps/web` pass /
  `npx vitest run --root apps/web src/features/ranking src/features/area-profile src/features/area-databook`
  **28 files 165 tests pass** (回帰なし)。

#### contrast の実測値 (単色では light/dark を両立できない)

`--card` は light `0 0% 100%` / dark `217 33% 17%`。WCAG 相対輝度で計算した contrast:

| 色 | 白地 | dark --card | 判定 |
|---|---:|---:|---|
| `#3b82f6` (旧・男) | 3.68 | 4.03 | light 不足 (監査値 3.67 と一致) |
| `#ec4899` (旧・女) | 3.53 | 4.20 | light 不足 (監査値 3.52 と一致) |
| blue-700 `#1d4ed8` | **6.70** | 2.21 | light 専用 |
| pink-700 `#be185d` | **6.04** | 2.45 | light 専用 |
| blue-400 `#60a5fa` | 2.54 | **5.83** | dark 専用 |
| pink-400 `#f472b6` | 2.65 | **5.60** | dark 専用 |

濃色は dark 地で 2 前後まで落ちるため、単色置換では要件を満たせない。light/dark で明度を分けた。
reading-zone の dark (`220 6% 12%`) でも blue-400 6.56 / pink-400 6.30 で満たす。

#### `PERF-STATIC-CACHE-01` を Cloudflare Rule ではなく `_headers` にした理由

before 実測 (2026-08-05・監査と同じ資産):

```
GET https://stats47.jp/_next/static/css/41d7b5e2cb6a9f4d.css
Cache-Control: public, max-age=0, must-revalidate
CF-Cache-Status: HIT
```

Cloudflare 公式 ([Workers static assets headers](https://developers.cloudflare.com/workers/static-assets/headers/)、
アクセス 2026-08-05) は、assets ディレクトリ直下の `_headers` で
「fingerprinted assets により強いブラウザキャッシュを設定する」ことを推奨し、
`/static/* Cache-Control: public, max-age=31556952, immutable` を例示している。

`public/` が assets 直下へ複製されることは実装で確認した
(`@opennextjs/aws` の `createAssets.js`: `public/* => *`、`fs.cpSync(appPublicPath, outputPath)`)。
`wrangler.toml` の `[assets] directory = ".open-next/assets"` がその出力を指す。

これにより**ダッシュボード操作なしで in-repo・レビュー可能・テスト付き・revert 可能**に解決できる。
Cache Response Rule は同じ効果を外部設定として持つため、rollback が git に残らない。

- 未検証: `_headers` が実際に適用されるかは**デプロイ後に本番で確認する**。公式仕様と
  複製経路は確認済みだが、この環境でビルド成果物を実機検証していない。
  併せて「Worker が生成するレスポンスには適用されない」という制約があるため、
  `/_next/static/*` が assets 層から配信されていることも同時に確認する。

#### 未実施 (このセッションでは進められないもの)

| ID | 状態 |
|---|---|
| `PERF-RANKING-PAYLOAD-01` (TopoJSON 1.9MB の削減) | 未着手。sidebar 分のみ実装。別段階 |
| `PERF-WORKER-P99-01` | **未着手**。Cloudflare MCP がこのセッションに未ロードのため read-only 調査ができない。推測でコードを変更しない |

- **判定**: `effect/pending`。デプロイ前のため before/after の比較なし。
  デプロイ後に LCP (PSI)・ranking HTML byte・`/areas/13000` DOM・static asset のヘッダを実測して判定する。

#### デプロイ後の本番実測 (2026-08-05・PR #731 merge 02:02:54Z / deploy success)

| 対象 | 実測 | 判定 |
|---|---|---|
| `/_next/static/css/*.css` の `Cache-Control` | **`public, max-age=31536000, immutable`** (before: `public, max-age=0, must-revalidate`) | ✅ 完了条件達成 |
| ranking 先頭タイル preload | `/tiles/light_all/5/28/12@2x.png` が **`fetchpriority=high` かつ `media` なし**、残り 3 枚は `media="(min-width: 1024px)"` | ✅ 発見機構は達成 |
| area rail の `nav` あたり `/ranking/` リンク数 | **12 / 12 / 12 / 12** (4 nav = 上位・下位 × desktop・mobile) | ✅ 上限は達成 |
| area の男女 KPI | 生 hex 消滅、`text-blue-700` + `dark:text-blue-400` を確認、「男性 / 女性」ラベルあり | ✅ 実装は達成 |
| ranking HTML (非圧縮) | 1,232,628 bytes (audit before 1,287,062) = **約 4% 減** | ⚠️ 50% 目標には遠い。残りは TopoJSON |

**PSI の before baseline は取得済み** (`.claude/state/metrics/psi/psi-batch-2026-08-04T18-46-50.json`、
デプロイ前日 18:34-18:39 UTC):

| URL (mobile) | LCP | Perf | A11y |
|---|---:|---:|---:|
| `/ranking/total-population` | **9,347ms** | 42 | 95 |
| `/areas/13000` | **5,092ms** | 47 | 97 |

日次 PSI cron (JST 02:00) が after を自動取得するため、LCP と accessibility スコアの
判定に手動実行は要らない。**この環境から PSI API へは到達できない** (`http=000`、
社内プロキシ)。Chrome DevTools MCP も未ロード、ブラウザペインは stats47.jp を
ポリシーでブロックするため、**Chrome の DOM ノード数 (audit の 9,101) は再測定できていない**。

- **計測ギャップ (2026-08-05 に collector 側を修正済み)**: PSI batch は
  `LCP_ms / TBT_ms / CLS / FCP_ms / TTI_ms / SI_ms / TTFB_ms` しか保存せず
  **`dom-size` を持たなかった**。`PERF-AREA-DOM-01` の完了条件「DOM 9,101 から
  70% 以上削減」を、どの自動パイプラインでも検証できない状態だった。
  `fetch-psi-audit.mjs` に `dom_size` (`total_elements` / `max_depth` /
  `max_child_elements`) を追加した (下記)。

  **ただし before は PSI に無い**。2026-08-04 の batch はこの変更より前なので
  `dom_size` を持たない。比較は「Chrome DevTools DOMSize 9,101 (2026-08-05 デプロイ前)」
  対「Lighthouse dom-size (2026-08-06 以降の cron)」になる。同じ指標だが収集経路が
  違う点は明示して読む。期待する削減幅 (70%) はツール差より十分大きい。

---

### [MCP-PERF-2026-08-05-TOPOJSON] `PERF-RANKING-PAYLOAD-01` — topology を RSC payload から外す

- **実装日**: 2026-08-05 (デプロイ前)

#### 当初案 (TopoJSON 簡略化) を採らなかった理由

runbook は「TopoJSON を 150KB 以下へ簡略化」としていたが、**maxZoom と両立しない**ことが
実測で分かったため配信経路の変更に切り替えた。

`presimplify → simplify → filter(退化リング除去) → 再 quantize` で実測した候補:

| weight | quant | サイズ | 47県 | 点数 |
|---|---|---:|:---:|---:|
| 1e-4 | 10,000 | 151KB | ✓ | 32,793 |
| 3e-4 | 10,000 | **130KB** | ✓ | 30,190 |
| 3e-4 | 100,000 | 209KB | ✓ | 48,569 |
| 1e-3 | 100,000 | 191KB | ✓ | 46,745 |

**150KB 以下を満たすのは quantization 10,000 の系統だけ**だった。ranking の地図は
Leaflet で `JAPAN_MAX_ZOOM = 14`。z14 の 1px は 7.8m (緯度 35 度) なので:

| quantization | 座標分解能 | z14 での誤差 |
|---|---:|---:|
| 10,000 | 283 m | **36 px** |
| 100,000 | 28 m | 3.6 px |
| 現行 (≈32,202) | 88 m | 11 px |

simplify weight も面積ベースで、3e-4 は 3.0 km² (一辺 2.5km ≈ z14 で 314px) の三角形を
落とす。**130KB 候補は z14 で県境が海岸線から 300px 以上ずれる**。既定ズーム 5 では
分からないが、ユーザーがズームすれば破綻する。
runbook の試算値 (weight 0.0003 / quant 100,000 → 94,438 bytes) も**再現しなかった**
(実測 214,285 bytes)。150KB という目標値自体が maxZoom 14 を考慮していなかった。

#### 採った方法

topology を RSC payload へ載せるのをやめ、クライアントが同一 origin の静的アセット
`/prefecture.topojson` (`apps/web/public/`、1,015,004 bytes) を fetch する。
**簡略化は行わないので地図の精度は一切落ちない。**

決め手は「地図はサーバーで描画されない」こと。`LeafletChoroplethMap` は
`next/dynamic` の `ssr:false` で読み込まれるため、RSC payload に載せた 1MB は
hydration まで一度も使われない純粋な無駄だった。

| 実測 (2026-08-05) | 値 |
|---|---|
| ranking HTML (非圧縮) | 1,232,628 bytes。`arcs` / `transform` / `N03_007`×47 を含む |
| R2 の topology 実体 (`gis/mlit/20240101/prefecture.topojson`) | 1,015,004 bytes = HTML の約 82% |
| `/prefecture.topojson` の配信 | 同一 origin・`CF-Cache-Status: HIT`・`max-age=0, must-revalidate` (2 回目以降は 304) |

**クライアントから R2 を直接 fetch する案は棄却**した。R2 公開 URL は `Cache-Control` を
返さず `cf-cache-status: DYNAMIC`、`Content-Encoding` も無しで 1MB を毎回素で返す。
`packages/visualization` の `prefecture-topology.generated.json` (865KB) を同梱する案も
棄却 — あれはサムネイル用の別データで、staleness 検査が thumbnail pipeline に紐づいている
(SSOT を混ぜない)。

#### 変更

- `load-ranking-page-model.ts`: `fetchPrefectureTopology` の呼び出しと `topology` 返却を削除。
  build phase 用の `NEXT_PHASE` 分岐も不要になった (サーバーが topology を触らないため)
- prop チェーン 3 段 (`RankingPageClientShell` → `RankingKeyPageClient` →
  `RankingVisualizationSection`) から `topology` を削除
- `RankingMapChartClient`: `/prefecture.topojson` を `useEffect` + `fetch` で取得。
  取得中は Skeleton、失敗確定時のみ `MapFallback` (取得中に「読み込めませんでした」を出さない)
- 契約テスト 3 本を `ranking-map-performance-contract.test.ts` に追加。
  **mutation 検証済**: `topology=` を shell に戻す / `fetchPrefectureTopology` を import し直すと
  該当 2 本が落ちることを実測

#### theme-dashboard は対象外 (確認済み)

同型の直列化点が `ThemePageLayout.tsx` にあるが、`all-themes.ts` の記述どおり
**全テーマが `hideMap`** で、`load-theme-data.ts` は hideMap のとき topology を fetch しない。
現状 theme ページは topology を載せていないため、変更不要。

- **判定**: `effect/pending`。デプロイ後に ranking HTML の実測で判定する
  (目標: 1,232,628 bytes から 50% 以上減。理論値は約 82% 減)。

---

### [PSI-DOMSIZE-01] PSI collector に DOM 規模を保存する

- **実装日**: 2026-08-05
- **目的**: `PERF-AREA-DOM-01` の完了条件を自動で裏取りできるようにする。

`fetch-psi-audit.mjs` の summary に `dom_size` を追加した。

```json
"dom_size": { "total_elements": 9101, "max_depth": 18, "max_child_elements": 873 }
```

`max_child_elements` も取るのは、「単一 nav に子要素 873 個」のような一箇所に集中した
肥大が総数だけでは見えないため (まさに area rail がその形だった)。

- **locale 耐性**: 総数は locale 非依存の `numericValue` を第一候補にする。depth / child は
  `statistic` の英語表記に依存するので、将来 PSI に locale を渡すようになったら null へ
  縮退する (誤った数値を返すよりよい)。現在 `fetchPsi` は locale を渡していない。
- **Lighthouse のバージョン差**: `value` が素の数値と `{type:"numeric", value}` の
  両方がありうるので両対応。テストで両形式を固定した。

#### 副次的に見つけて直したもの

`fetch-psi-audit.mjs` は **`main()` を無条件に呼んでいた**。テストが `extractDomSize` を
import しただけで 38 URL の PSI 計測が走り、`.claude/state/metrics/psi/` に batch ファイルを
書き出した (実際に発生・削除済み)。今日の `file://` 修正と同じ `pathToFileURL` ベースの
エントリポイント判定を追加した。

両方向を実測で確認: import では走らない (テスト 1,865ms → 122ms、batch ファイル増えず) /
直接起動では走る (batch ファイルが 5 → 6 に増えることを確認、生成物は削除済み)。

- **未検証**: この環境から PSI API へ到達できない (`http=000`) ため、**実レスポンスでの
  `dom_size` 取得は確認できていない**。Lighthouse の 2 形式に対する単体テストは通っている。
  実データは 2026-08-06 の日次 cron が最初に出す。

---

### [PERF-WORKERS-CACHE-01] Workers Cache + RSC分離 + 公開時パージ

- **実装日**: 2026-08-14
- **対象**: `https://stats47.jp` のHTMLと公開data API
- **before**: mobile Slow 4G / CPU 4x のhomeで LCP 1,290ms、TTFB 924ms、CLS 0。
  Chrome DocumentLatency の推定FCP/LCP改善余地は約822ms。レスポンスは
  `s-maxage=86400` を返すが `CF-Cache-Status` / `Age` が無く、毎回Workerを通る。
- **重要な境界**: 通常HTMLとRSCは同一URLだが、Workers Cacheの既定keyは
  `RSC` / `Next-Router-State-Tree` 等を含まない。単純な有効化はHTML/RSCの誤配信を起こす。

#### 実装

1. `wrangler.toml` のproductionだけ `[cache] enabled = true`。開発は無効。
2. `cache-policy.ts` をCache-Control / Vary / Cache-TagのSSOTにし、middlewareから適用。
   browserは`max-age=0, must-revalidate`、edgeは`Cloudflare-CDN-Cache-Control`で24時間保持し、
   7日SWRと1日stale-if-errorを有効化する。`s-maxage`はCloudflare上でSWRを無効化するため使わない。
   通常GET/HEAD HTMLだけを共有し、RSC、Authorization、preview/session cookie、非安全methodは
   `private, no-store` にする。解析cookieは表示を変えないため共有可能。
3. HTMLへ共通tag `stats47-html` とpath tag、全公開data APIへ`stats47-data`を付与。
   全APIの失敗応答は明示的にno-storeとし、Workers Cacheの既定heuristic cacheを防ぐ。
   path tagはquery variantをまとめて無効化する。
4. `/api/internal/worker-cache/purge` を追加。SHA-256後のtiming-safe Bearer比較、同一origin、
   最大100 URL、no-store、Cloudflare runtime不在時fail closedを契約化。`--all`は
   `purgeEverything`、個別URL/dataはtag purgeを使う。
5. `purge-worker-cache.ts` を追加。Workers Cacheはzone purgeで消えないため、R2公開Workflow
   9本からR2反映成功後にexact URL、data tagまたはentrypoint全体をpurgeする。API失敗は公開Workflowをhard fail。
6. Wranglerを4.123.0、deploy jobをNode 22へ更新。GitHub Repository Secret
   `WORKER_CACHE_PURGE_SECRET` を生成・登録し、deploy時に同名Worker secretへ同期する。

#### 機械検証

- cache policy 19件、purge route 9件、purge client 7件、Wrangler/Workflow契約12件、
  全APIのno-store契約8件。
- web全単体テスト914件、web / r2-storage type-check、lint（既存`img`警告2件のみ）、
  workflow policy audit（61 workflows / 0 findings）、docs check、`git diff --check`。
- Wrangler 4.123.0でproduction configからruntime/env型を生成し、`[env.production.cache]`を含む
  設定のparseに成功。
- middleware統合テストで通常HTMLのtag付与とRSCのno-store/tag無しを実request objectで確認。
  localhostの実HTTPはbase branch既存の欠落`src/lib/next-devtools-stub.ts`によりhomeが500となるため、
  response end-to-endの完了条件には使わずデプロイ後確認へ残した。
- R2資格情報を読み込んだOpenNext buildでwebpack compile（39.2秒）と型検査までは通過。
  その後の既存SSGはGoogle Fontsのconnect timeout / ECONNRESETとR2読込遅延により、blog/tag/sitemapの
  複数routeが180秒×3回timeoutして終了コード1。新routeのbundle・型エラーではないが、full buildは
  未完了として扱う（検索index生成の副作用は元へ戻した）。

#### デプロイ後の停止条件・判定手順

1. 通常HTMLを同一coloで2回取得し、2回目がWorkers Cache HITかつwarm TTFBがbefore 924msより改善。
2. 同じURLへRSC header付きで取得し、`text/x-component` + `private, no-store`。HTMLと混ざらない。
3. blog exact URL公開とsnapshot全更新を各1回実走し、purge直後に新内容が返る。
4. 日次PSI 7点でLCP/TTFB回帰が無いことを確認後、`effect/full|partial|none`を判定する。

#### 今回有効化しないCloudflare設定

- **Speed Brain**: Workerを呼ぶページには適用されない。
- **Smart Placement**: DBレスでR2は分散配置され、単一origin近傍へ寄せる根拠がない。
- **Early Hints**: trace上のrender-blocking CSS推定LCP savingsが0ms。
- **広域Cache Everything rule**: RSCヘッダーをkeyに含めず誤配信するため、Worker側の明示境界を採用。
- **observability sampling変更**: 非sample requestのtrace overheadは無く、p99原因未特定で変更する根拠がない。

- **判定**: `in-progress`。実装・secret登録済、デプロイと本番after計測が残る。
