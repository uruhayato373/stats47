---
type: implementation-spec
date: 2026-07-28
status: pending
target_metric: adsense
related_backlog:
  - ADSENSE-OBSERVABILITY-02
  - ADSENSE-CYCLE-02
tags: [AdSense, GA4, GSC, Playwright, weekly-improvement]
---

# AdSense継続改善・GA4/GSC設定自動化 実装仕様

> **この文書の役割**: Claude Code が、今回の AdSense 低下を正しく計測し、
> 週次で「取得 → 診断 → 候補提示 → 人間承認 → 1変更 → 効果判定」を回せる状態まで実装するための正典。
> GA4 / GSC 管理画面の allowlist 内設定は Playwright で実行する。
>
> **TODO の真実源**:
> 計測・自動化は `docs/todo/02_機能バックログ.md` の `ADSENSE-OBSERVABILITY-02`、
> 改善運用は `docs/todo/01_改善バックログ.md` の `ADSENSE-CYCLE-02`。

## 0. 結論

2026-W30 時点の主問題は「PV 不足」ではなく、**デスクトップで広告表示密度を増やした一方、
viewability・CTR・1 impression 当たり収益が落ち、PV 成長を収益に変換できていないこと**である。

したがって、当面は広告枠を増やさない。実装順は次のとおり。

1. AdSense API の `COST_PER_CLICK`、`IMPRESSIONS_RPM`、広告形式・配置・入札タイプ内訳を追加し、
   現在の誤った CPC と広告ユニット RPM を是正する。
2. GA4 / GSC / AdSense の期間、取得遅延、欠損、デバイス、ページ種別を共通契約で扱う。
3. Playwright で GA4 / GSC 連携状態を監査し、明示 allowlist の不足設定だけを冪等に反映する。
4. 週次候補は最大3件、AdSense の実験採用は最大1件とし、14日・28日で判定する。
5. 最初の改善候補は desktop の impression dilution。mobile は現状維持を基本とする。

`¥40` は長期目標に対して低い。ただし、画面に表示されたローリング28日の Page RPM `¥40` と、
週次 snapshot W30 の Page RPM `¥34` は期間が違う。以後は期間を混在させず、
非重複の確定7日を週次KPI、ローリング28日を傾向・候補発見に使う。

## 1. 実測ベースライン

### 1.1 ユーザー提示のローリング28日

| 指標 | 直近28日 | 前期間比 | 読み方 |
|---|---:|---:|---|
| ページビュー | 14,700 | +34% | 集客は伸びている |
| Page RPM | ¥40 | -25% | 1,000 PV 当たり収益は低下 |
| 広告表示回数 | 16,600 | +76% | PV より速く広告表示が増加 |
| クリック | 118 | +8% | 表示増に追随していない |
| CPC | ¥5 | -7% | 管理画面の公式 CPC |
| Page CTR | 0.80% | -19% | PV 当たりクリック効率が低下 |

概算収益は直近 `14,700 × 40 / 1,000 = ¥588`、前期間は
`10,974 × 53 / 1,000 ≒ ¥582`。**PV が34%伸びても収益はほぼ横ばい**である。

### 1.2 週次 snapshot W26 → W30

出典:
`.claude/skills/analytics/adsense-improvement/reference/snapshots/{2026-W26..2026-W30}/`。

| 指標 | W26 | W30 | 変化 |
|---|---:|---:|---:|
| 収益 | ¥139 | ¥129 | -7.2% |
| PV | 2,616 | 3,819 | +46.0% |
| impressions | 1,856 | 4,070 | +119.3% |
| impressions / PV | 0.709 | 1.066 | +50.4% |
| Page RPM | ¥53 | ¥34 | -35.8% |
| viewability | 67.7% | 56.9% | -10.8pt |

推計 impression RPM は `earnings / impressions × 1,000` で
W26 `¥74.9` → W30 `¥31.7`、-57.7%。これは公式 `IMPRESSIONS_RPM` ではないため、
今後の保存値には使わず、今回の診断補助にだけ使う。

### 1.3 デバイス別

| device | 指標 | W26 | W30 | 判断 |
|---|---|---:|---:|---|
| Desktop | PV | 1,683 | 2,486 | +47.7% |
| Desktop | impressions / PV | 0.892 | 1.347 | 表示密度が大幅増 |
| Desktop | Page RPM | ¥66 | ¥35 | -47.0% |
| Desktop | viewability | 69.8% | 57.8% | -12.0pt |
| Desktop | CTR | 0.33% | 0.12% | -0.21pt |
| Desktop | 収益 | ¥110 | ¥88 | -20.0% |
| Mobile | PV | 910 | 1,294 | +42.2% |
| Mobile | Page RPM | ¥30 | ¥29 | ほぼ横ばい |
| Mobile | viewability | 57.3% | 51.2% | -6.1pt |
| Mobile | 収益 | ¥27 | ¥38 | +40.7% |

W29 → W30 でも Desktop 収益は `¥128 → ¥88`、Mobile は `¥33 → ¥38`。
直近の減収の中心は Desktop であり、Mobile を先に再変更する根拠は弱い。

### 1.4 W30 の手動広告ユニット

| unit | impressions | earnings | clicks | viewability |
|---|---:|---:|---:|---:|
| サイドバー右上 | 1,184 | ¥14 | 0 | 64.0% |
| 広告 | 932 | ¥15 | 1 | 31.2% |
| stats47-ranking | 767 | ¥7 | 0 | 43.8% |
| ranking右サイドバー | 69 | ¥1 | 0 | 44.9% |

手動 unit レポートで説明できるのは W30 収益の `¥37 / ¥129 = 28.7%`、
click の `1 / 29 = 3.4%` だけである。Auto ads や形式別寄与が現在の `units.csv` から欠けるため、
この表だけで特定枠を削除してはならない。

`ranking-incontent-mobile` は W28 に3 impressions、その後 unit 行なし。
意図した mobile 手動枠が実質配信されていない、またはレポート閾値未満である。
広告ユニット新設より、まず配信形式・配置コードの内訳を取得する。

### 1.5 変更タイムライン

- 2026-07-03 に anchor ON、lazy-load `100 → 600px`、footer Multiplex、slot dedupe が同時投入された。
- 直後の W26 → W27 は impressions `+44%`、viewability `67.7% → 60.9%`、
  RPM `¥53 → ¥45`、収益 `¥139 → ¥128`。単独因果は分離不能だが dilution は同時に始まった。
- mobile `600 → 250px` は PR #569 で 2026-07-14 に main へ merge された記録がある。
  W29/W30 の mobile viewability は 51.2% まで回復しているが、deploy 状態と既存 TODO 表記を再照合する。
- `ADSENSE-LAZYLOAD-02` を「未デプロイ」とした既存記録は stale の可能性が高い。
  実装時に git / CI / production の証拠を取り、推測で status を変えない。

## 2. 既存計測の欠陥

### 2.1 公式 CPC を取得していない

`.claude/scripts/metrics/fetch-adsense-snapshot.mjs` は次を取得していない。

- `COST_PER_CLICK`
- `IMPRESSIONS_RPM`
- `AD_REQUESTS`
- `AD_REQUESTS_COVERAGE`

一方、`.claude/scripts/metrics/update-history-csv.mjs` は `earnings / clicks` を `cpc` としている。
AdSense は CPM 等を含むため、これは公式 CPC ではない。

移行規則:

- API の `COST_PER_CLICK` を `cost_per_click` として保存する。
- 従来値は `earnings_per_click_legacy` へ改名する。
- 過去行で公式値が無い場合は空/null。0で埋めない。
- `cpc` の意味を黙って差し替えない。schema version と migration note を残す。
- UI・agent・Markdown は「公式 CPC」と「legacy 収益/click」を明示して区別する。

### 2.2 unit の Page RPM が意味を持たない

`AD_UNIT_NAME` レポートでは `PAGE_VIEWS` が0になるため、
`PAGE_VIEWS_RPM` も0であり unit の比較指標にできない。

unit / format / placement の比較は次を使う。

- `IMPRESSIONS_RPM`
- `ACTIVE_VIEW_VIEWABILITY`
- `COST_PER_CLICK`
- `IMPRESSIONS_CTR`
- `AD_REQUESTS`
- `AD_REQUESTS_COVERAGE`
- `ESTIMATED_EARNINGS`
- `IMPRESSIONS`
- `CLICKS`

### 2.3 page URL は現在の規模で取得不能

`PAGE_URL` は AdSense のプライバシー閾値により30日でも0行。
ページ別収益を捏造せず、当面は次で補う。

1. AdSense: device × format × placement × unit。
2. GA4: built-in `pagePath` と AdSense 連携の publisher ad metrics。
3. ローカル: URL path を決定的に page type へ分類。

`page_type` を高カーディナリティなカスタムディメンションとして新設しない。
`pagePath` をローカル関数で `ranking-detail`、`blog-detail`、`area-detail`、`theme-detail`、
`category`、`search`、`home`、`other` に分類する。

## 3. 成功条件

### 3.1 計測

- [ ] 公式 `COST_PER_CLICK` と `IMPRESSIONS_RPM` を保存・表示できる。
- [ ] `earnings / clicks` を CPC と呼ばない。
- [ ] device、format、placement、bid type の収益レバーを週次取得できる。
- [ ] period metadata、取得遅延、欠損、privacy threshold を保存する。
- [ ] rolling 28日同士の差を WoW と呼ばない。
- [ ] page type は built-in page path から決定的に分類し、不要な custom dimension を増やさない。

### 3.2 Google 管理画面

- [ ] GA4 property、web stream、GSC property、AdSense link を Playwright で監査できる。
- [ ] 正しい GSC link が無い場合だけ、`sc-domain:stats47.jp` と正しい web stream を1件作成できる。
- [ ] Search Console report collection が未公開なら GA4 Library で公開できる。
- [ ] 台帳で `⏳要登録` の `ad_id` が無い場合だけ event-scoped dimension を1件作成できる。
- [ ] 同じ操作を再実行しても no-op になる。
- [ ] before / planned / after / verification を sanitized audit に残す。
- [ ] cookie、token、localStorage、認証ヘッダー、secret、画面上の個人情報を保存しない。

### 3.3 週次改善

- [ ] 毎週、確定7日KPI・直前7日・ローリング28日・14/28日効果窓を生成する。
- [ ] 候補は最大3件、AdSense 実験採用は最大1件、AdSense active WIP は2以下。
- [ ] 1つの実験で1レバーだけを変更する。
- [ ] 反映前に rollback、guardrail、最小sample、判定日を固定する。
- [ ] 自動化は候補提示まで。広告配置・Auto ads・production deploy は自動変更しない。

### 3.4 段階目標

| Stage | 目標 | 根拠 |
|---|---|---|
| Measurement | 公式CPC/imp RPMと形式別内訳が欠損なく2週 | 判断可能な状態を先に作る |
| Recovery 1 | Page RPM `≥ ¥50` を非重複7日で2回、全体/desktop viewability `≥65%` | W23-W26 の実測帯へ戻す |
| Recovery 2 | Page RPM `≥ ¥65`、週次収益/GA4 session をbaseline以下にしない | desktop W26 実績と収益密度 |
| Long term | RPM `≥ ¥100` | 収益化マスタープランの P1→P2 gate |

Page RPM 単独を最適化しない。収益、GA4 sessions、viewability、LCP、CLS、policy を guardrail にする。

## 4. 実装アーキテクチャ

### 4.1 配置

既存基盤を拡張し、同義 pipeline を増やさない。

```text
.claude/scripts/metrics/
├── fetch-adsense-snapshot.mjs          # 既存を拡張
├── update-history-csv.mjs              # 公式CPCへ移行
├── measure-adsense-impact.mjs          # 既存を拡張
├── lib/
│   ├── periods.mjs                     # 既存/進行中の期間契約を再利用
│   ├── adsense-report-contract.mjs      # 新規: job別dimension/metric
│   ├── adsense-diagnostics.mjs          # 新規: pure rules
│   └── page-type.mjs                    # 新規またはsearch-growth既存を再利用
└── __tests__/

.claude/scripts/google-admin/
├── cli.mjs
├── browser-context.mjs
├── audit-ga4.mjs
├── audit-gsc.mjs
├── apply-allowlisted-settings.mjs
├── redact.mjs
└── __tests__/

.local/
├── playwright-google-admin-profile/    # 既に .local/ 全体が gitignore
└── locks/google-admin.lock

.claude/state/metrics/
├── adsense/
│   ├── history.csv
│   ├── history-devices.csv
│   ├── history-formats.csv
│   ├── history-placements.csv
│   ├── history-bid-types.csv
│   └── LATEST.md
└── google-admin/
    └── latest.json                      # sanitized summaryのみ

/tmp/stats47-google-admin-<run-id>/
└── screenshots/                        # commitしない。終了時に保存場所だけ報告
```

実装前に既存 search-growth / metrics の pure period function、page normalization、
redaction、Playwright helper を確認し、使えるものは import する。

### 4.2 AdSense report jobs

API compatibility を job ごとに分離する。全 metric を全 dimension に投げない。
実装時は公式 metadata と live dry-run で組合せを検証し、互換性エラーを握り潰さない。

| file | dimensions | 主目的 |
|---|---|---|
| `overview.csv` | なし | account KPI |
| `daily.csv` | `DATE` | 欠損・確定性 |
| `devices.csv` | `PLATFORM_TYPE_CODE/NAME` | desktop/mobile |
| `units.csv` | `AD_UNIT_ID`, `AD_UNIT_NAME` | 手動unit |
| `formats-platforms.csv` | `AD_FORMAT_CODE`, `PLATFORM_TYPE_CODE` | ON_PAGE / INTERSTITIAL 等 |
| `placements-platforms.csv` | `AD_PLACEMENT_CODE`, `PLATFORM_TYPE_CODE` | placement寄与 |
| `bid-types-platforms.csv` | `BID_TYPE_CODE`, `PLATFORM_TYPE_CODE` | CPC/CPM等の構成 |
| `traffic-sources.csv` | `TRAFFIC_SOURCE_CODE` | traffic品質 |
| `countries.csv` | `COUNTRY_CODE` | Japan外の異常監視 |

最低 metric:

```text
ESTIMATED_EARNINGS
PAGE_VIEWS                    # overview/deviceだけ。非対応jobでは要求しない
PAGE_VIEWS_RPM                # overview/deviceだけ
IMPRESSIONS
IMPRESSIONS_RPM
CLICKS
IMPRESSIONS_CTR
COST_PER_CLICK
ACTIVE_VIEW_VIEWABILITY
AD_REQUESTS
AD_REQUESTS_COVERAGE
```

各CSVまたは隣接manifestへ次を保存する。

```json
{
  "schemaVersion": 2,
  "source": "adsense-management-api-v2",
  "periodKind": "finalized7d",
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "windowDays": 7,
  "isFinalized": true,
  "generatedAt": "ISO-8601",
  "currencyCode": "JPY",
  "timeZone": "Asia/Tokyo",
  "dimensions": [],
  "metrics": [],
  "rowCount": 0,
  "status": "complete|partial|privacy-threshold|missing|error",
  "limitations": []
}
```

API response の currency/timezone を取得できない場合、環境から推定して確定値として書かない。
`unknown` と limitation を保存する。

### 4.3 診断ルール

候補生成は LLM でなく pure function とする。

初期 rule:

1. `impression-dilution`
   - sample: current impressions `>=1,000`
   - `imp_per_pv >= previous × 1.20`
   - viewability `<= previous - 8pt`
   - Page RPM または imp RPM `<= previous × 0.85`
2. `device-regression`
   - device impressions `>=500`
   - Page RPM `<= previous × 0.80`
   - revenue が増えていない
3. `placement-low-viewability`
   - impressions `>=300`
   - viewability `<50%`
   - 2週連続
4. `format-low-yield`
   - impressions `>=500`
   - imp RPM が同device medianの50%未満
   - viewability または CTR も悪化
5. `measurement-gap`
   - required report missing / stale / privacy threshold / incompatible
6. `traffic-mix-shift`
   - device / country / traffic source 構成が大きく変化
   - 収益効率低下と同時に発生

候補には evidence、sample、confidence、expected lever、guardrail、rollback、
earliestDecisionDate、past effect、confounders を必須にする。

## 5. GA4 / GSC の公式設定方針

### 5.1 API優先、ブラウザは設定だけ

- 日常のデータ取得は AdSense Management API、GA4 Data API、GSC API。
- Playwright は管理画面の inventory、リンク、report publish、custom dimension のような
  Admin UI 設定だけに使う。
- Playwright profile は GitHub Actions や週次 cron へ載せない。
- 管理画面設定の自動監査はローカルで明示実行する。

### 5.2 既知の状態

- GA4 の `ad_impression × adSourceName/adFormat/adUnitName` が取得できているため、
  AdSense ↔ GA4 link は既に機能している証拠がある。
- GSC domain property は `sc-domain:stats47.jp`。
- GSC API 用 service account access は既存。
- GA4 custom dimension 台帳では `ad_id` だけが明示的に `⏳要登録`。

したがって AdSense link を自動作成しない。UI が「未リンク」と表示した場合は、
観測データと矛盾するため mutation を止めて blocker として報告する。

### 5.3 外部仕様

- AdSense と GA4 をリンクすると `ad_click`、`ad_impression`、`ad_query` が自動収集され、
  publisher ads report を利用できる。リンク後の反映は最大24時間で遡及しない。
  [Google Analytics Help: Link AdSense to Analytics](https://support.google.com/analytics/answer/13610380)
- GSC ↔ GA4 は web stream 1件につき GSC property 1件。既存linkは編集できず、
  変更には削除・再作成が必要。Search Console collection は既定で未公開。
  [Google Analytics Help: Search Console integration](https://support.google.com/analytics/answer/10737381)
- event-scoped custom dimension は standard property で50件まで、作成後24–48時間、
  非遡及。既定dimensionを優先する。
  [Create custom dimensions](https://support.google.com/analytics/answer/14240153)
- GSC の owner/user、change of address、association、bulk export は管理設定である。
  本仕様では owner/user、change of address、bulk export を変更しない。
  [GSC users and permissions](https://support.google.com/webmasters/answer/7687615) /
  [GSC property settings](https://support.google.com/webmasters/answer/7687465)
- 高カーディナリティdimensionは `(other)` 行を生むため、URLや広告IDを安易に増やさない。
  [GA4 high-cardinality dimensions](https://support.google.com/analytics/answer/12226705)

## 6. Playwright 管理画面 runner

### 6.1 コマンド

```bash
# 初回または状態監査。既定はread-only
npm run google-admin:audit

# allowlistの不足だけを反映。対象siteを明示
npm run google-admin:apply -- --confirm-site stats47.jp

# 設定後の再監査
npm run google-admin:verify
```

実体は `.claude/scripts/google-admin/cli.mjs` とし、package script は薄い wrapper にする。

### 6.2 browser context

```js
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: "chrome",
  headless: false,
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: false,
});
```

- dedicated profile `.local/playwright-google-admin-profile/` だけを使う。
- 通常の Chrome profile、X/A8/note 等の profileを使わない。
- page は1枚、contextは1つ。並列 browser を起動しない。
- lock `.local/locks/google-admin.lock` を原子的に取得する。
- 未ログイン、MFA、CAPTCHA は突破しない。headed browser でユーザーにログインを依頼して待つ。
- download はcancelする。
- cookie/localStorage/tokenをJSON exportしない。
- console、例外、audit JSONへURL query、account email、cookieを出さない。
- screenshot は `/tmp/` のみ。repoへ追加しない。

終了処理は `finally` で次を必ず実行する。

```js
await context.close().catch(() => {});
// launchPersistentContextではcontext.close()がbrowserも閉じる。
// 別browserを起動した場合だけbrowser.close()も行う。
```

runner自身が起動した PID / lock / tab のみを片付ける。ユーザーの通常Chromeを一括killしない。

### 6.3 対象 identity の厳密照合

mutation 前に次をすべて確認する。

1. GA4 property ID が既存 `GA4_PROPERTY_ID` と一致。
2. web stream の default URL / domain が `stats47.jp`。
3. GSC property が exact `sc-domain:stats47.jp`。
4. AdSense link の publisher account が既存環境 / 観測値と一致。
5. browser上の選択中propertyと planned JSON が一致。

値が取れない、複数候補、別account、selector drift、権限不足なら fail closed。

### 6.4 allowlist

Playwright が `--apply` で変更してよいのは次の3種類だけ。

| action | 条件 | 実行 |
|---|---|---|
| `create-search-console-link` | linkが0件、exact GSC property、correct web stream、権限あり | 1件作成 |
| `publish-search-console-collection` | 正しいlinkあり、Libraryでcollectionが未公開 | publish |
| `create-ad-id-dimension` | 台帳が`⏳要登録`、GA4にexact paramなし、event-scoped枠に空き | `ad_id`を1件作成 |

`ad_id` の固定値:

```json
{
  "displayName": "Affiliate ad ID",
  "scope": "Event",
  "eventParameter": "ad_id"
}
```

同じ event parameter が別display nameで既に存在する場合、新規作成せず既存として扱い、
scope を確認する。scopeが違う場合は修正・削除せず blocker。

### 6.5 denylist

明示承認があっても、本 prompt の範囲では次を変更しない。

- Google account / GA4 / GSC / AdSense の user、owner、permission。
- property / stream / account の作成・削除。
- 既存 GSC link、AdSense link、custom dimension の削除・置換・rename。
- GA4 timezone、currency、data retention、data filter、Google Signals、consent。
- GSC change of address、property削除、bulk export、association削除。
- sitemap submit/delete、URL inspection request、Indexing API publish。
- AdSense Auto ads、format、exclusion、unit作成、unit削除、blocking control。
- billing、payment、tax、policy、brand safety。
- production deploy、R2 write、GitHub Secrets。

wrong GSC link は「編集不可」なので自動削除・再作成しない。before/after を報告して止める。

### 6.6 1 mutation のトランザクション

各 action は次の順を守る。

1. inventory取得。
2. exact duplicate check。
3. before screenshot。
4. planned action JSON を `/tmp/` に保存し、画面上の値と照合。
5. form入力。
6. Save/Link/Publish直前に property/site を再照合。
7. click。
8. success toast / status を待つ。
9. reload。
10. APIまたは再読込UIで verify。
11. after screenshot。
12. sanitized summaryを `.claude/state/metrics/google-admin/latest.json` へ保存。
13. `.claude/rules/analytics-event-standards.md` の登録台帳を実測結果に更新。

Save後に verification できなければ `mutation-unknown`。再試行して重複作成しない。

## 7. 週次改善サイクル

### 7.1 cadence

```text
日曜: fetch-metrics-weekly
  1. AdSense finalized7d / previous7d / rolling28d
  2. official CPC / imp RPM / request coverage
  3. device / format / placement / bid type
  4. GA4 Japan-only finalized7d + page type
  5. GSC finalized7d + rolling28d
  6. period/freshness/missing検証
       ↓
日曜: adsense diagnostics
  7. revenue decomposition
  8. deterministic candidate生成（最大3）
  9. 既存施策の14/28日effect候補
       ↓
weekly-review
 10. evidence確認・交絡明記
 11. measurement / desktop / traffic mixをレビュー
       ↓
人間承認
 12. 最大1実験を採用
       ↓
weekly-plan
 13. rollback・guardrail・判定日付きで計画
```

Google Admin Playwright はこの weekly cron に含めない。
設定追加が必要になったときだけローカル headed 実行する。

### 7.2 収益分解

Page RPM だけでなく次を並べる。

```text
Page RPM              = earnings / AdSense page views × 1,000
Impression density    = impressions / AdSense page views
Official imp RPM      = AdSense IMPRESSIONS_RPM
Official CPC          = AdSense COST_PER_CLICK
Viewable imp / PV     = impressions × viewability / page views
Revenue / GA4 session = earnings / GA4 Japan-only sessions
```

AdSense page views と GA4 page views/sessions は定義が違うため、同じ値としてjoinしない。
期間を揃えた site-level guardrail としてのみ扱い、limitationsを明記する。

### 7.3 実験規律

- AdSense active WIP `<=2`。新規採用は週1件まで。
- 同じ期間に lazy-load、slot、Auto ads、formatを複数変えない。
- 最低14日、原則28日。曜日構成を揃える。
- non-overlapping windowを使い、rolling snapshot差をeffectにしない。
- impressions `<300` の unit、`<500` の formatは結論を出さない。
- policy / CLS / LCP / revenue guardrail 悪化は早期停止できる。
- `effect/full|partial|none|adverse|n-a` は `improvement-triage` が証拠に基づき更新する。

### 7.4 最初の候補順

計測実装後、次を同時実施せず順番に再評価する。

1. **Desktop rootMarginの部分ロールバック候補**
   - 現状 600px。候補 300px。
   - format/placement別に「早期loadされた低viewability impression」が確認できた場合だけ採用。
   - mobile 250pxは保持。
2. **低viewability placementの1枠整理**
   - `広告`、`stats47-ranking` 等の実体を slot / placement / format で同定する。
   - 2週・最低300impを満たした1枠だけ、移設または非表示を試す。
3. **Auto ads formatの整理**
   - `INTERSTITIAL`、`SHOPPING_LINK` 等の収益・viewability・UX寄与を確認。
   - AdSense管理画面変更は別の明示承認とし、本Playwright runnerのallowlist外。

mobile、新規HUB unit、広告密度追加は、desktop dilutionを解消するまで hold。

## 8. 実装Phase

### Phase 0 — 監査

- `CLAUDE.md`、本書、収益化マスタープラン、analytics event rule、
  browser cleanup、data storage、automation inventoryを読む。
- branch、dirty tree、他セッション変更、untracked fileを記録する。
- AdSense fetcher → history → LATEST → weekly-review のcall graphを作る。
- GA4/GSC/AdSense credentialの**存在だけ**を確認し、値を出力しない。
- W26-W30の数値をtest fixtureに最小化し、diagnosis ruleの期待値を固定する。
- `ADSENSE-LAZYLOAD-02` の git / PR / CI / production 状態を証拠で再照合する。

### Phase 1 — AdSense metric contract

- job別 report contractを追加。
- official CPC / imp RPM / requests / coverageを取得。
- pagination、currency、timezone、period、missing、API errorを扱う。
- legacy CPC migrationを実装。
- W26-W30を可能な範囲でexact period backfillする。取得不能はnull。

### Phase 2 — breakdownと診断

- format-platform、placement-platform、bid type-platformを追加。
- history / LATESTへdevice・format・placementの前期間差を追加。
- pure diagnosis rules、minimum sample、candidate dedupeを実装。
- pagePathの決定的page type分類を既存search-growth関数から再利用する。

### Phase 3 — Google Admin audit runner

- dedicated profile、lock、redaction、screenshot、timeout、cleanupを実装。
- fixture HTML / adapterでselector drift、wrong property、duplicate、permission deniedをtest。
- `audit` は完全read-only。
- mutation関数は3 action allowlist以外を型・runtime両方で拒否する。

### Phase 4 — 管理画面の実監査・設定

1. `google-admin:audit` をheadedで実行。
2. login/MFAが必要ならユーザーへブラウザ上の操作を依頼して待つ。
3. GA4 property / stream / GSC property / links / custom dimensionsをinventory。
4. allowlist actionの不足だけを `--apply --confirm-site stats47.jp` で実行。
5. reload + API/UIでverify。
6. 台帳、audit summary、TODOを実測に更新。

AdSense link absent、wrong GSC link、property不一致、権限不足は自動修復せず停止する。

### Phase 5 — weekly workflow

- 既存 `fetch-metrics-weekly.yml` へ API read-only jobsを接続。
- Google Admin Playwrightはworkflowへ接続しない。
- weekly-reviewへ確定7日・収益分解・候補最大3件を追加。
- weekly-planは人間承認済みAdSense候補を最大1件だけ採用。
- automation inventoryを更新。

### Phase 6 — test / docs

最低限:

- metric/dimension contract。
- official CPCとlegacy値の非混同。
- unsupported dimension/metric error。
- pagination / quota / API error。
- missing / zero / privacy threshold / stale。
- finalized7d / previous7d / rolling28d。
- device/format/placement sample gate。
- diagnosis W26→W30でdesktop dilutionを検出。
- Playwright allowlist / denylist。
- wrong property / duplicate / scope mismatch / at-capacity。
- selector drift / MFA / permission denied / mutation-unknown。
- redaction。
- context / lock cleanup。
- workflowにbrowser profile・write scopeが入らないこと。

対象test、metrics test、search-growth test、`git diff --check` を実行する。
フル web buildは web runtimeを変更した場合だけ実行し、未実行なら報告する。

## 9. 完了条件

- [ ] Phase 0〜6を完了。
- [ ] official CPC / imp RPM / format / placement / bid typeがlive AdSense APIで1期間取得できた。
- [ ] API credentialが無いsourceはmockのみと明記し、live検証済みにしない。
- [ ] Playwright auditを実accountで実行。
- [ ] allowlist不足を反映、または全て既存ならno-opを確認。
- [ ] mutationごとにreload後verificationあり。
- [ ] GA4/GSC/AdSenseの権限・削除・timezone・sitemap・Auto adsを変更していない。
- [ ] browser context/tab/lockの残留なし。
- [ ] weekly candidateが最大3件、採用が最大1件。
- [ ] `docs/todo/01_改善バックログ.md` と `02_機能バックログ.md` を実装結果へ更新。
- [ ] automation変更時は自動化インベントリを更新。
- [ ] commit / push / PR / deploy / R2 write / secret変更を行っていない。

## 10. Claude Code用コピペプロンプト

推奨: **Claude Opus 5 / high effort / subagent 0**。
以下をそのまま Claude Code に貼り付ける。

```text
TASK CAPSULE

Goal:
stats47のAdSenseを、PV増加だけでなく収益密度を週次で改善できる閉ループへ変える。
公式CPC・imp RPM・広告形式/配置/入札タイプ内訳を実装し、
GA4/GSCの必要設定を専用Playwright profileで監査・allowlist内だけ実反映する。

Success:
1. AdSense Management APIのCOST_PER_CLICK、IMPRESSIONS_RPM、AD_REQUESTS、
   AD_REQUESTS_COVERAGEを正しい意味で保存・表示できる。
2. 既存のearnings/clickをCPCと呼ばず、earnings_per_click_legacyへ移行できる。
3. device、AD_FORMAT_CODE、AD_PLACEMENT_CODE、BID_TYPE_CODE別の確定7日・前7日・
   rolling28dを取得し、missing/privacy thresholdを0と混同しない。
4. W26→W30のdesktop impression dilutionをpure ruleで再現し、週次候補を最大3件生成できる。
5. GA4 property/web stream、GSC property/link、AdSense link、custom dimensionsを
   Playwrightで監査できる。
6. exact target確認後、未作成のGSC link、未公開Search Console collection、
   未登録ad_id dimensionだけを冪等に反映し、reload後に検証できる。
7. 週次レビュー→人間承認→最大1 AdSense実験→14/28日判定へ接続できる。
8. browser残留、secret露出、権限変更、削除、deploy、R2 writeがない。

Scope:
- 正典:
  CLAUDE.md
  docs/02_実装計画/41_AdSense継続改善・GA4_GSC設定自動化仕様.md
  docs/02_実装計画/01_収益化マスタープラン.md
  .claude/rules/analytics-event-standards.md
  .claude/rules/evidence-based-judgment.md
  .claude/rules/browser-use-cleanup.md
  .claude/rules/docs-vs-issues.md
  .claude/rules/data-storage.md
- metrics:
  .claude/scripts/metrics/fetch-adsense-snapshot.mjs
  .claude/scripts/metrics/update-history-csv.mjs
  .claude/scripts/metrics/measure-adsense-impact.mjs
  .claude/scripts/metrics/lib/*
  .claude/scripts/metrics/__tests__/*
- consumers:
  .claude/agents/adsense-analyst.md
  .claude/skills/analytics/fetch-adsense-data/SKILL.md
  .claude/skills/analytics/adsense-improvement/*
  .claude/skills/management/weekly-review/*
  .claude/skills/management/weekly-plan/SKILL.md
- browser:
  .claude/scripts/google-admin/*
  .local/playwright-google-admin-profile/
  .local/locks/google-admin.lock
- workflow/docs:
  .github/workflows/fetch-metrics-weekly.yml
  docs/01_技術設計/06_自動化インベントリ.md
  docs/todo/01_改善バックログ.md
  docs/todo/02_機能バックログ.md

Evidence baseline:
- screenshot rolling28d:
  PV 14,700 (+34%), Page RPM ¥40 (-25%), impressions 16,600 (+76%),
  clicks 118 (+8%), official CPC ¥5 (-7%), Page CTR 0.80% (-19%).
- W26→W30:
  earnings ¥139→¥129, PV 2,616→3,819, impressions 1,856→4,070,
  imp/PV 0.709→1.066, Page RPM ¥53→¥34, viewability 67.7%→56.9%.
- Desktop W26→W30:
  PV 1,683→2,486, earnings ¥110→¥88, RPM ¥66→¥35,
  imp/PV 0.892→1.347, viewability 69.8%→57.8%, CTR 0.33%→0.12%.
- Mobile W26→W30:
  PV 910→1,294, earnings ¥27→¥38, RPM ¥30→¥29,
  viewability 57.3%→51.2%.
- W30 manual units explain only ¥37/¥129 earnings and 1/29 clicks.
  Auto ads/format contribution is missing from current units.csv.

Behavior contract:
- 計画だけで止まらず、仕様書Phase 0〜6、live監査、allowlist内設定、検証まで進める。
- 最初にCLAUDE.mdと仕様書を全文読み、既存exports/callers/tests/credentialsの存在を監査する。
- dirty treeを確認し、他セッションの変更を編集・削除・stash・formatしない。
- 現在のuntracked `.claude/state/metrics/note/note-2026-07-27.json` はユーザー所有。
  絶対に編集・削除・追加しない。
- 既存periods.mjs、weekly-summary.mjs、search-growth、auth、redactionを確認し、
  同義基盤を複製しない。未commitの既存実装と衝突する場合は先に境界を報告する。
- deterministicな期間計算、診断、candidate選別、重複判定をLLMへ委ねない。
- secret値、cookie、localStorage、token、Authorization、account emailを出力・保存しない。
- commit / push / PR / deploy / R2 write / GitHub Secrets変更は禁止。
- 一時handoff文書を作らない。残作業は正しいbacklogへ直接反映する。

Critical measurement corrections:
- fetch-adsense-snapshotのjob別dimension/metric compatibilityを実装する。
- overview/deviceではPAGE_VIEWS/PAGE_VIEWS_RPMを扱い、
  unit/format/placementではIMPRESSIONS_RPMを主指標にする。
- COST_PER_CLICKをcost_per_clickとして保存する。
- 従来earnings/clickはearnings_per_click_legacyへ改名し、公式CPCと混ぜない。
- 過去の公式CPC欠損はnull。0補完しない。
- AD_FORMAT_CODE×PLATFORM_TYPE_CODE、
  AD_PLACEMENT_CODE×PLATFORM_TYPE_CODE、
  BID_TYPE_CODE×PLATFORM_TYPE_CODEを追加する。
- API response、公式metadata、live dry-runで互換性を検証する。
- PAGE_URL 0行はprivacy-threshold。エラーや0 PVと扱わない。
- GA4 built-in pagePathを決定的にpage typeへ分類する。
  URLやpage_typeの高カーディナリティcustom dimensionを新設しない。

Playwright external-action authorization:
ユーザーは、このtaskの範囲に限り、下記allowlistのGA4/GSC設定を
Claude agentがPlaywrightで実行することを明示承認している。
ただしtarget identity、duplicate、権限、quota、before/afterを確認できた場合だけ実行する。

Allowed mutations:
A. create-search-console-link
   - 既存linkが0件
   - GSC propertyがexact `sc-domain:stats47.jp`
   - GA4 property IDが環境のGA4_PROPERTY_IDと一致
   - web stream default domainがstats47.jp
   - verified owner + GA4 Editor権限がある
   - 1件だけ作成
B. publish-search-console-collection
   - 正しいlinkが存在
   - GA4 LibraryでSearch Console collectionが未公開
C. create-ad-id-dimension
   - analytics-event-standards台帳がad_idを⏳要登録としている
   - exact eventParameter ad_idが存在しない
   - event-scoped custom dimension枠に空き
   - displayName=`Affiliate ad ID`, scope=`Event`, eventParameter=`ad_id`

Denied mutations:
- user/owner/permission、property/stream/accountの作成削除
- 既存GSC link/AdSense link/custom dimensionの削除・置換・rename
- GA4 timezone/currency/data retention/filter/Signals/consent
- GSC change of address/property削除/bulk export/association削除
- sitemap submit/delete、URL inspection request、Indexing API
- AdSense Auto ads/format/exclusion/unit/blocking control
- billing/payment/tax/policy、secret、production

Playwright execution contract:
- `.local/playwright-google-admin-profile/`だけを使う。通常Chrome profileを使わない。
- `channel:"chrome"`, `headless:false`, page 1枚、context 1つ。
- `.local/locks/google-admin.lock`で同時実行を拒否する。
- auditが既定。applyは`--confirm-site stats47.jp`必須。
- login/MFA/CAPTCHAが必要なら突破せず、headed browserで私にログイン操作を求めて待つ。
- 対象property/siteをSave直前にも再確認する。
- before screenshot→planned JSON→Save→success確認→reload→再監査→after screenshot。
- screenshot/planned detailは`/tmp/stats47-google-admin-<run-id>/`だけ。
- repoへはredact済みsummaryだけ保存する。
- mutation後にverifyできなければmutation-unknownとして止め、盲目的に再実行しない。
- finallyでcontext/tab/lockを閉じる。通常Chromeを一括killしない。

Implementation order:
Phase 0 — Audit
- branch/dirty tree/call graph/period contract/既存testsを確認する。
- W26-W30 fixtureで現行CPC誤表示とdesktop dilutionを再現する。
- ADSENSE-LAZYLOAD-02のmerge/deploy/statusをgit/CI/production証拠で再照合する。

Phase 1 — AdSense contracts
- job別report contract、metadata、pagination、error/partial/privacy-thresholdを実装する。
- official CPC/imp RPM/ad requests/coverageを追加する。
- history schema migrationとconsumer更新を行う。

Phase 2 — Breakdown/diagnostics
- format-platform、placement-platform、bid type-platformを取得・履歴化する。
- pure diagnosis rule、minimum sample、candidate dedupe、past-effect抑制を実装する。
- LATESTにPage RPM、imp RPM、official CPC、imp/PV、viewability、revenueを並べる。

Phase 3 — Google Admin runner
- audit/apply/verify CLI、profile、lock、redaction、evidence、cleanupを実装する。
- allowlist/denylist、wrong property、duplicate、scope mismatch、quota、
  selector drift、permission、MFA、mutation-unknownをfixture testする。

Phase 4 — Live admin execution
- `npm run google-admin:audit`をheadedで実行する。
- 必要なら私にブラウザでログイン/MFAを依頼して、その場で継続する。
- inventoryを表示し、allowed mutationだけをapplyする。
- 既存AdSense ad_impressionデータがあるのでAdSense linkはaudit-only。
  UIでmissingなら矛盾として止め、作成しない。
- wrong GSC linkがある場合は削除せず止める。
- apply後にreload/API/UIでverifyし、analytics-event-standards台帳を実測で更新する。

Phase 5 — Weekly loop
- API read-only取得とcandidate生成をfetch-metrics-weekly/weekly-reviewへ接続する。
- Google Admin Playwrightをcron/CIへ接続しない。
- candidate最大3、AdSense採用最大1、AdSense active WIP<=2を強制する。
- 14/28日effect、rollback、guardrail、earliestDecisionDateを必須にする。
- 自動化インベントリを更新する。

Phase 6 — Validation/docs
- 対象test、既存metrics/search-growth test、workflow policy、git diff --checkを実行する。
- web runtimeを変えた場合だけapps/web type-checkと必要なbuildを行う。
- docs/todo/02のADSENSE-OBSERVABILITY-02とdocs/todo/01のADSENSE-CYCLE-02を
  実装・live設定・未検証の実態に更新する。

Initial experiment policy:
- 計測前に広告枠を増やさない。
- 第一候補はdesktop rootMargin 600→300の部分ロールバックだが、
  format/placement実測でdilutionを確認するまで実装しない。
- mobile 250pxはhold。
- 低viewability枠は最低300imp×2週を満たす1枠だけ変更する。
- Auto ads変更は本promptのPlaywright allowlist外。提案だけにする。

Required validation:
- metric/dimension compatibility
- official CPC != earnings_per_click_legacy
- missing/zero/privacy-threshold/stale
- finalized7d/previous7d/rolling28d
- W26→W30 desktop dilution detection
- candidate sample/dedupe/WIP
- Playwright allowlist/denylist/idempotency
- wrong property/duplicate/quota/scope mismatch
- selector drift/MFA/permission/mutation-unknown
- redaction/context/lock cleanup
- workflowにbrowser profileやwrite scopeが無い

OUTPUT FORMAT:
- 開始時: 「完成させる結果 / dirty tree境界 / live API / Playwright allowlist /
  denied actions / login協働」を最大10項目。
- 各Phase終了時: 「変更ファイル / 検証 / live evidence / 外部変更 / 残り」。
- Playwright apply直前:
  planned action、property/site、before state、duplicate result、rollback可否を表示する。
  allowlist内かつ本promptの条件を満たす場合は追加承認を取り直さず実行してよい。
- 最終:
  1. 実装結果
  2. 計測是正
  3. 週次サイクル
  4. GA4/GSC監査結果
  5. 実行した外部変更
  6. Playwright cleanup
  7. 検証
  8. 未実行/未検証
  9. 変更ファイル
- mockだけをlive検証済みとしない。partial/stale/missingを成功や0件としない。
- 全完了条件を満たすまで実装と検証を継続する。
```
