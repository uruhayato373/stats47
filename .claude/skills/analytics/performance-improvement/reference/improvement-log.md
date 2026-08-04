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
