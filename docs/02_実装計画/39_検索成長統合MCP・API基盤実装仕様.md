---
type: implementation-spec
date: 2026-07-23
updated: 2026-07-28
status: active
tags: [gsc, seo, mcp, api, ga4, crux, pagespeed, cloudflare, automation]
---

# 検索成長統合MCP・API基盤 実装仕様

## 0. 目的

Search Consoleだけを見る運用をやめ、検索露出、クリック、インデックス、流入後行動、実ユーザー性能、サーバー状態を一つの証拠チェーンで診断する。

```text
GSC Search Analytics
  + URL Inspection
  + Sitemaps
  + GSC UI export
  + GA4
  + CrUX / CrUX History
  + PageSpeed Insights / Lighthouse
  + Cloudflare
  + route / sitemap / canonical static audit
        ↓
normalized observations
        ↓
deterministic candidate scoring
        ↓
human-approved implementation
        ↓
14 / 28 / 56 day measurement
```

本書はClaude Codeが既存資産を監査し、取得・正規化・分析・MCP/CLI・CI・テスト・文書移行まで完遂するための恒久仕様である。一時handoffではない。

- 機能バックログ: `docs/todo/02_機能バックログ.md#SEARCH-GROWTH-PLATFORM-01`
- 改善施策SSOT: `docs/todo/01_改善バックログ.md`
- GSC運用: `.claude/skills/analytics/gsc-improvement/SKILL.md`
- coverage運用: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md`
- 効果判定: `.claude/rules/evidence-based-judgment.md`
- 自動化台帳: `docs/01_技術設計/06_自動化インベントリ.md`

## 1. 成功の定義

1. 既存APIとworkflowを壊さず、重複取得を一本化する。
2. 1コマンドまたはread-only MCPから最新の検索改善候補を取得できる。
3. 全候補が元データ、期間、計算式、制約を追跡できる。
4. GSCだけでなくGA4、CrUX/PSI、Cloudflare、技術SEOの証拠を結合できる。
5. データ不足を「需要なし」「問題なし」と誤判定しない。
6. 外部mutation、コード変更、デプロイを自動承認しない。
7. Google Indexing APIの対象外利用を停止する。
8. 日次は異常検知、週次は候補更新、月次は効果判定に責務分離する。

## 2. 利用するデータ源

| source | 用途 | 更新 | 実装方針 |
|---|---|---:|---|
| GSC Search Analytics API | query/page/device/country/date、clicks/impressions/CTR/position | 週次 | 既存fetcherを拡張 |
| GSC URL Inspection API | coverageState、indexingState、Google canonical、lastCrawlTime | 日次sample | 既存queueを再利用 |
| GSC Sitemaps API | submitted、lastSubmitted、lastDownloaded、errors/warnings、contents | 日次または週次 | 新規read-only collector |
| GSC UI export | APIにないページindex理由別総数・URL | 週次手動 | 既存ingestを維持 |
| GA4 Data API | organic landing後のengagement、回遊、key event | 週次 | 既存snapshotを拡張 |
| CrUX API | URL/originのLCP/INP/CLS field data | 週次 | 新規。PSI field dataへ依存しない |
| CrUX History API | 28日rollingの長期推移 | 月次 | データ有無を明示 |
| PSI API | mobile/desktop Lighthouse lab diagnostics | 日次重点URL | 既存workflowを再利用 |
| local Lighthouse | PR前後の再現性あるlab比較 | 変更時 | production APIと分離 |
| Cloudflare GraphQL Analytics | status、request、cache、Workers/R2異常 | 日次 | 既存usage以外のSEO診断範囲を監査 |
| production HTTP probe | status、canonical、robots、content-type、TTFB | 日次sample | Googlebot/通常UAの差も検査 |
| repository static audit | sitemap/noindex/canonical/redirect/route整合 | PRごと | 既存checkを統合 |
| Web/公式docs | Google仕様変更の確認 | 判断時 | 根拠URLと確認日を記録 |

### 2.1 Search Analytics

- `type=web`を既定とする。
- page、query、device、dateを個別snapshotだけでなく、必要な組合せで取得する。
- rowLimit 25,000とpaginationを維持する。
- APIが全行を保証しない事実をmetadataへ保存する。
- finalized dataは原則2日遅延を考慮する。
- dailyの欠損日は0補完せずmissingとして扱う。
- query文字列を不用意に公開レポートへ出さない。git保存済み現行方針を監査し、必要なら集計・マスキングする。

追加推奨slice:

- page × device
- page × query（priority URLだけ）
- page × searchAppearance
- type=image / video（実データがある場合のみ）
- branded / non-branded（決定的辞書）

### 2.2 URL Inspection

- 全URLを毎日総当たりしない。
- priority queue: 新規/変更URL → sitemap不一致 → GSC高imp異常 → coverage actionable → control sample。
- 観測結果に`inspectedAt`、`lastCrawlTime`、`coverageState`、`robotsTxtState`、`indexingState`、`googleCanonical`、`userCanonical`を保存する。
- APIで指定したURL集合の観測であり、GSC UI全体件数とは異なることを明記する。
- quotaを設定ファイルで管理し、上限まで使い切らない。

### 2.3 Sitemaps API

新規collectorはread-onlyを既定とし、次を保存する。

- sitemap path
- type
- submitted / pending
- lastSubmitted / lastDownloaded
- isPending
- warnings / errors
- contents type / submitted / indexed

`submit` / `delete`はMCPへ公開しない。必要時は明示承認付きCLIへ分離する。

### 2.4 GA4

GSC page URLをGA4 pagePathへ正規化して結合する。

- organic sessions
- landing page views
- engagement rate
- average engagement time
- internal navigation click
- search submit
- key events（登録済みのみ）

GSC clickとGA4 sessionは同値ではない。timezone、consent、ad blocker、attribution差を保持し、無理に一致させない。

### 2.5 CrUX / PSI / Lighthouse

- field: CrUX API / History API
- public lab: PSI API
- controlled lab: local Lighthouse

PSIのCrUX埋込値をfield dataの長期SSOTにしない。URLにCrUXデータがない場合、origin fallbackを明示し、URL実測として扱わない。

### 2.6 Cloudflare / HTTP

Cloudflare usage costとSEO診断を混同しない。利用可能なread権限とGraphQL datasetを監査し、最低限次を関連付ける。

- 5xx / 404 / 410 / redirect
- botと通常UAのstatus差
- cache status
- request volume anomaly
- Worker exceptionまたはtimeout
- R2 snapshot欠損によるthin/empty 200

ログ本文にqueryや秘密情報が含まれる可能性を考慮し、保存前にredactする。

## 3. 利用禁止・制限

### 3.1 Google Indexing API

Google公式対象は`JobPosting`または`BroadcastEvent`を含む`VideoObject`ページである。stats47のranking、area、theme、blog、410 URLには使わない。

Claude Codeは以下を監査する。

- `.claude/skills/analytics/indexing-api-submit/`
- `.claude/scripts/gsc/auto-resubmit.mjs`
- `.claude/scripts/gsc/submit-cities-indexing.mjs`
- `.github/workflows/gsc-auto-resubmit-daily.yml`
- `INDEXING-AUTO-01`および関連ログ・docs

移行:

1. workflowの外部送信を停止。
2. 通常URLをpublishするコードパスを削除または実行不能にする。
3. coverage queueの`resubmit` actionを`observe-after-fix`へ改名する。
4. sitemap、内部リンク、HTTP、canonical、content修正とURL Inspection観測へ置換。
5. 過去ログは証拠として保持し、成功例として推奨する文言だけ訂正する。
6. 自動化インベントリ、skill、backlog、improvement-logを現在仕様へ更新する。

### 3.2 禁止事項

- SERP scrapingの大規模自動化
- 複数accountによるquota回避
- runtimeからGoogle/Cloudflare APIを呼ぶ
- LLMによるstatus/route判定
- API失敗時に0件として上書き
- search queryやcredentialをissue/logへ無加工掲載
- read-only MCPからsitemap submission、deploy、R2 write、PR作成

## 4. アーキテクチャ

### 4.1 再利用優先

推奨配置:

```text
.claude/scripts/search-growth/
  collect.mjs
  normalize.mjs
  analyze.mjs
  report.mjs
  lib/
    contracts.mjs
    join-url.mjs
    scoring.mjs
    redaction.mjs
    freshness.mjs
  __tests__/

.claude/state/search-growth/
  latest.json
  candidates.json
  health.json
  manifests/

.claude/skills/analytics/search-growth/
  SKILL.md
  reference/

packages/seo-observability-mcp/   # MCPを実装する場合
  src/
  package.json
  README.md
```

既存fetcherをコピーしない。`.claude/scripts/metrics/lib/auth.mjs`、GSC/GA4 fetcher、PSI、Cloudflare scriptsをlibrary化またはsubprocess adapterで再利用する。

### 4.2 Normalized observation

```ts
type Observation = {
  source: "gsc" | "inspection" | "sitemap" | "ga4" | "crux" | "psi" | "lighthouse" | "cloudflare" | "http" | "static";
  metric: string;
  dimensions: Record<string, string>;
  value: number | string | boolean | null;
  periodStart: string | null;
  periodEnd: string | null;
  observedAt: string;
  freshness: "fresh" | "stale" | "missing" | "partial";
  provenance: {
    file?: string;
    api?: string;
    queryHash?: string;
    limitations: string[];
  };
};
```

- raw snapshotは既存配置を尊重する。
- normalized stateはderivedであり再生成可能にする。
- URL正規化は`apps/web/src/lib/url-policy.ts`を正典にするか、Nodeから安全に参照できない場合は共通pure packageへ抽出する。
- trailing slash、query、fragment、canonical、domain/propertyを明示的に処理する。

## 5. Candidate engine

LLMではなく決定的ルールで候補を生成する。LLMは候補の説明や実装案作成だけに使う。

### 5.1 Candidate type

- `ctr-opportunity`: impressions十分、position帯に対しCTR低
- `striking-distance`: position 5〜15、需要あり
- `query-gap`: query需要あり、専用landingなし
- `intent-mismatch`: query群とtitle/contentの不整合
- `mobile-gap`: mobileだけCTR/position/engagement/CWVが弱い
- `indexability-conflict`: sitemap/noindex/canonical/status矛盾
- `crawled-not-indexed`: liveで価値があるURLの未登録
- `soft-404-risk`: HTTP 200だがthin/empty/not-found表現
- `canonical-drift`: user canonicalとGoogle canonical不一致
- `cwv-opportunity`: CrUX field poor/needs-improvement
- `lab-regression`: Lighthouse/PSI悪化
- `server-risk`: 5xx/timeout/cache/R2欠損
- `measurement-gap`: 必要データまたはcustom dimensionがない

### 5.2 Score

```text
opportunityScore =
  impact
  × confidence
  × actionability
  × freshness
  × evidenceCoverage
  ÷ effort
```

- 係数と閾値は型付きconfig。
- impressionsが最低標本未満ならCTR判定をしない。
- 1つのAPIだけで高confidenceにしない。
- missingを0へ変換しない。
- 同じURL・原因のcandidateをdedupeする。
- title変更の過去effect/noneを考慮し、CTRだけを根拠に大量rewriteしない。
- candidateは`pending / approved / in-progress / measured / dismissed`を持つ。

### 5.3 Evidence contract

各candidate:

- candidate ID
- URL / query group
- type
- score breakdown
- evidence refs
- baseline period
- observedAt / freshness
- limitations
- expected metric
- suggested verification
- destructive/external action flag

## 6. MCP

### 6.1 判断

CLIを正典実装とし、MCPは同じpure serviceを呼ぶ薄いadapterにする。MCPがなくてもCIとローカル運用が成立しなければならない。

実装前に現行`.mcp.json`とClaude Code/Codexのproject-scoped MCP仕様を確認する。既存serverへ無関係な責務を混ぜない。

### 6.2 Read-only tools

- `search_growth_status`
- `search_growth_candidates`
- `gsc_performance`
- `gsc_inspect_urls`
- `gsc_sitemaps`
- `ga4_organic_quality`
- `crux_web_vitals`
- `psi_diagnostics`
- `cloudflare_search_health`
- `seo_route_contract`
- `search_growth_measure`

tool outputは小さくし、raw CSV全件をcontextへ流さない。filter、limit、cursor、date rangeを持つ。

### 6.3 MCPに持たせないmutation

- deploy
- push / PR
- sitemap submit/delete
- GSC property/user変更
- GA4 custom dimension登録
- Cloudflare設定変更
- URL削除
- production data write

これらは別の明示承認workflowにする。

### 6.4 Security

- env値をtool resultへ返さない。
- key file pathを必要以上に表示しない。
- input URLを`https://stats47.jp` allowlistで検証。
- shell文字列連結を避ける。
- query、URL、ログをuntrusted dataとして扱う。
- MCP tool annotation/descriptionにread-only性と外部影響を明記。

## 7. CLI

```bash
npm run search-growth:collect -- --week YYYY-Www
npm run search-growth:normalize -- --week YYYY-Www
npm run search-growth:analyze -- --week YYYY-Www
npm run search-growth:report -- --week YYYY-Www
npm run search-growth:status
npm run search-growth:next -- --limit 20
npm run search-growth:measure -- --candidate <id>
```

`collect`はsource別に失敗を隔離し、exit summaryで`success / partial / failed / skipped`を返す。partialを成功に見せない。

## 8. CI cadence

### Daily

- priority URL Inspection
- PSI重点URL
- production HTTP/status/canonical
- Cloudflare異常
- sitemap summary
- blockerのみauto-generated issue

### Weekly

- GSC/GA4 snapshot
- CrUX URL/origin
- normalized observations
- candidate rebuild
- human-readable digest
- topic/remediation queueの既存consumerへ供給

### Monthly

- CrUX History
- 28/56日effect判定
- candidate calibration
- stale observation cleanup
- API quota・失敗率・費用監査

既存workflowをすぐ巨大な1本へ統合しない。共通reusable workflowまたはshared scriptsへ寄せ、source failureが他sourceを巻き込まないようにする。

## 9. Secrets / authentication

| secret | 用途 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` | GSC read-only、URL Inspection、GA4 |
| `GA4_PROPERTY_ID` | GA4 |
| `PSI_API_KEY` | PSI |
| `CRUX_API_KEY` | CrUX / History（PSI keyと共用可能でも名前を分離） |
| `CLOUDFLARE_API_TOKEN` | read-only analytics |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare |

- local key discoveryの後方互換は残せるが、鍵ファイルをgitへ追加しない。
- CI secretsの有無は値を出さずpresenceだけdiagnoseする。
- サービスアカウントは必要最小権限。Indexing API用owner要求を通常運用の前提にしない。
- 認証失敗はsource単位で明示し、過去snapshotへfallbackした場合はstaleにする。

## 10. GSC UI export

APIで取れないcoverage総数は手動exportを残す。

- `ingest-gsc-export.py`を唯一の入口にする。
- Downloads自動探索に加え`--src`明示を維持する。
- zip/CSV encoding、category map、重複、weekをtestする。
- ingest後にraw hashとmanifestを保存する。
- browser automationでGSC認証やdownloadを行う場合はread-only profile、少量操作、終了時cleanupを守る。
- CAPTCHA、2FA、利用規約回避は行わない。

## 11. Report

週次digestは次の順序にする。

1. blocker（5xx、sitemap conflict、empty 200、measurement failure）
2. verified changes
3. top opportunities
4. mobile gaps
5. CWV
6. coverage
7. data freshness / limitations
8. 14/28/56日後の判定対象

各提案は「何を変えるか」より先に「どのデータが何を示したか」を書く。自動issueは既存規約どおりPSI/Cloudflare等の閾値alertに限定し、一般候補は`docs/todo/01_改善バックログ.md`へ人間承認後に追加する。

## 12. 実装Phase

### Phase 0 — Inventory / safety

1. `git status --short`。
2. CLAUDE.md、関連rules/skills/workflows/scriptsを全文確認。
3. API、snapshot、state、workflow、secret name、consumerをinventory化。
4. 同一データの重複取得・古い正典・壊れた参照を列挙。
5. Indexing APIの全write pathを特定し、実行中workflowを停止対象として示す。
6. 現行最新snapshotとworkflow成功状況をbaseline化。

### Phase 1 — Indexing API compliance

1. 通常ページへのIndexing API送信workflowを無効化・削除。
2. scripts/skill/docs/backlogを公式仕様へ修正。
3. coverage queueから送信前提を除去。
4. sitemap/internal link/HTTP/canonical/content + observationへ置換。
5. historyは保持し、credentialや不要な送信queueだけ安全に整理。
6. regression testで対象外URL publish pathが存在しないことを確認。

### Phase 2 — Collectors

1. GSC既存fetcherをcontract化。
2. Sitemaps read-only collector。
3. GA4 organic landing slice。
4. CrUX / History collector。
5. PSI既存collector adapter。
6. Cloudflare/HTTP/static audit adapter。
7. source manifest、freshness、error isolation。

### Phase 3 — Normalize / join

1. URL normalization。
2. Observation schema。
3. raw→normalized adapters。
4. GSC page ↔ GA4 path ↔ CrUX URL ↔ route join。
5. missing/partial/stale semantics。
6. provenanceとredaction。

### Phase 4 — Candidate engine

1. candidate typeとtyped thresholds。
2. pure scoring。
3. dedupe/root-cause grouping。
4. sample-size gate。
5. evidence contract。
6. deterministic fixture tests。

### Phase 5 — CLI / MCP

1. CLIを先に完成。
2. project-scoped MCP serverを最小実装。
3. read-only toolsだけ公開。
4. pagination/output budget。
5. Claude CodeとCodexの双方からinitialize/listTools/callTool確認。
6. MCP unavailable時もCLIで同じ結果になるcontract test。

### Phase 6 — CI / observability

1. daily/weekly/monthly責務を整理。
2. existing workflowをshared scriptsへ接続。
3. concurrency、timeout、quota、retry、partial failure。
4. GitHub summary。
5. stale data alert。
6. automation inventory更新。

### Phase 7 — Skill / docs / cleanup

1. `search-growth` skillまたは既存gsc-improvementの入口を一本化。
2. GSC/GA4/performance/coverage各skillは専門runbookとして残し、統合入口から参照。
3. obsolete Indexing API skill・workflow・説明を削除またはretired化。
4. 改善バックログと詳細logを更新。
5. 一時設計・handoffを作らない。

### Phase 8 — Verification

1. unit / integration / contract tests。
2. mocked API error/quota/pagination。
3. live read-only smoke（credentialがあるsourceのみ）。
4. secret redaction。
5. workflow syntax。
6. MCP inspectorまたはprotocol smoke。
7. docs link / diff check。
8. production mutationなしを確認。

## 13. Test要件

### Collect

- GSC 25,000 pagination。
- no rowsとAPI errorを区別。
- date timezone。
- URL Inspection quota/priority。
- Sitemap empty/error/warning。
- GA4 dimension incompatibility。
- CrUX URL missing→origin fallbackの明示。
- PSI/Cloudflare timeout。

### Normalize

- trailing slash/query/fragment。
- canonical URL。
- Unicode query。
- missing/zero。
- stale。
- source provenance。
- secret/query redaction。

### Candidate

- minimum impressions未満ではCTR candidateを出さない。
- position 5〜15。
- mobile-only gap。
- indexability conflict。
- thin 200。
- duplicate root cause。
- past adverse/none施策のconfidence抑制。
- deterministic order。

### MCP

- schema validation。
- allowlisted domain。
- limit/cursor。
- oversized result拒否。
- read-only toolだけ。
- prompt injection文字列を命令として扱わない。
- CLIと同一fixtureで結果一致。

### Compliance

- Indexing API publish endpointを通常運用から参照しない。
- `gsc-auto-resubmit-daily.yml`が稼働しない。
- URL Inspectionは維持。
- sitemap生成、内部リンク、route contractがgreen。

## 14. 検証コマンド

Claude Codeは実際のpackage scriptsに合わせて確定する。最低限:

```bash
npm run search-growth:status
npm run search-growth:next -- --limit 20
node --test .claude/scripts/search-growth/__tests__/*.test.mjs
npm run type-check --workspace apps/web
node .claude/scripts/lib/check-route-contract.cjs
node .claude/scripts/lib/check-docs-links.cjs --baseline
git diff --check
```

workflowとMCP packageを追加した場合は、それぞれのlint/type-check/protocol smokeも実行する。API credentialがないsourceは未検証と報告し、mock passだけでlive成功としない。

## 15. Deploy / external action gate

本タスクで許可:

- local file変更
- test/build
- read-only API smoke（既存認証があり、秘密を出力しない場合）

明示承認なしで禁止:

- production deploy
- R2 write
- sitemap submit/delete
- Search Console user/property変更
- GA4 Admin変更
- Cloudflare設定変更
- GitHub secret変更
- commit/push/PR

Indexing API通常ページ送信の停止は安全・準拠是正だが、GitHub上のscheduled workflowを直接disableする外部操作は行わず、repository workflow変更までとする。

## 16. 完了条件

- [ ] 全source inventoryがある。
- [ ] GSC/Inspection/Sitemaps/GA4/CrUX/PSI/Cloudflare/HTTP/static auditを統合できる。
- [ ] CLI 1入口でstatus/next/measureが動く。
- [ ] MCPはread-onlyでCLIと同じserviceを使う。
- [ ] MCPなしでも運用可能。
- [ ] candidateは決定的で証拠・期間・制約を持つ。
- [ ] missing/partial/staleを0と混同しない。
- [ ] API failureをsource単位で隔離する。
- [ ] secretsとqueryを安全に扱う。
- [ ] 通常ページへのIndexing API送信が停止している。
- [ ] URL Inspectionとsitemap観測は維持される。
- [ ] daily/weekly/monthlyが責務分離されている。
- [ ] testとread-only smokeの結果が記録される。
- [ ] automation inventory、skills、backlogが現在仕様。
- [ ] temporary handoffがない。
- [ ] deploy・外部mutationを行っていない。

## 18. 週次計測・改善サイクル（SEARCH-GROWTH-WEEKLY-01）

### 18.1 目的と発見済みの不整合

検索成長基盤の候補生成を週次レビューと週次計画へ接続し、毎週「計測 → 診断 → 人間承認 → 小さく実行 → 14/28/56日判定」を回す。

2026-W30 の監査で、`.claude/state/metrics/gsc/LATEST.md` と `history.csv` の「今週」「前週比」が、実際には互いに重なるローリング28日合計だったと判明した。W30 の 3,224 clicks は28日合計であり、フェーズゲートに使う確定7日値は 892 clicks（2026-07-17〜23）である。ローリング28日を前週snapshotと比較して WoW と呼ぶと21日分が重複し、変化を過大・過小評価するため禁止する。

### 18.2 計測契約

| 用途 | 正式名 | 期間 | 比較 | 主な利用先 |
|---|---|---|---|---|
| KPI・フェーズゲート | `finalized7d` | 取得遅延を考慮した連続7日 | 直前の重複しない7日 `previous7d` | weekly-review、weekly-plan、4,000 clicks/週ゲート |
| 機会発見 | `rolling28d` | 最新の連続28日 | 前期間差をWoWとは呼ばない | page/query/device候補、long-tail探索 |
| GA4週次KPI | `jpFinalized7d` | Japan-onlyの連続7日 | 直前の重複しない7日 | users/sessions/PV/engaged sessions |
| 施策効果 | `effectWindow` | 14/28/56日 | 施策ごとのbaseline・対照・交絡を明記 | `search-growth:measure`、改善バックログ |

すべてのsummary/snapshotには最低限、次を保存する。

```json
{
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "windowDays": 7,
  "isFinalized": true,
  "generatedAt": "ISO-8601",
  "source": "gsc|ga4",
  "limitations": []
}
```

追加規約:

- GSCは原則3日、GA4は原則1日の取得遅延を考慮する。遅延日数はコード上の定数または設定をSSOTとし、各snapshotに残す。
- `weekId`は実行・保存のcadence keyであり、期間の代用ではない。明示した週・as-ofでbackfillする場合、その日付から期間を決定的に再現する。
- 任意の過去 `weekId` に実行時点の最新データを保存してはならない。期間を再現できない場合は失敗させる。
- 日別行が欠けた場合、0で補完しない。`partial` / `missing` と欠損日を記録し、KPI比較とゲート判定を止める。
- GA4週次KPIはJapan-only clean sliceを用いる。rawのoverseas / `(not set)` は汚染監視に残すが、clean WoWへ混ぜない。
- `LATEST.md` と `history.csv` の列名・見出しには `確定7日` または `ローリング28日` を明記する。曖昧な「今週」は使わない。

### 18.3 日曜から月曜までの標準フロー

```text
fetch-metrics-weekly
  1. GSC / GA4 raw snapshot取得
  2. finalized7d + previous7d summary生成
  3. rolling28d discovery slice生成
  4. period metadata / freshness / missing判定
        ↓
search-growth-weekly
  5. normalize → analyze → report
        ↓
weekly-review
  6. finalized7dでKPI・ゲート・前週差を判定
  7. rolling28dでpage/query/device候補を読む
  8. due施策を14/28/56日でmeasure
        ↓
human triage
  9. 候補を最大3件まで証拠付きで審査
        ↓
weekly-plan
 10. 承認済みを最大1〜2件だけMust/Shouldへ昇格
```

workflowは候補生成までを自動化し、改善バックログへの追加やサイト変更は自動化しない。weekly-review単独依頼時にweekly-planを勝手に実行しない。

### 18.4 候補の選別規則

- 週次トリアージは最大3件（原則: blocker/technical 1件、acquisition/content 1件、measurement 1件）。全active施策のWIPは5以下を維持する。
- 候補はURL/query、期間、sample size、期待するレバー、guardrail、過去effect、missing/staleを持つ。証拠不足は `insufficient-data` とし昇格しない。
- CTR候補はpage×query、現在表示されるtitle/content、過去の `effect/none` / `effect/adverse` を確認する。サイト横断・大量のtitle書換えは禁止する。
- 新規記事は実query需要があるA/D2型を優先する。B型相関記事は、元ranking URLのimpressionsを記事需要として流用せず、相関テーマ自体のquery需要と説明可能な機序がある場合だけ採用する。
- 高confidence blockerは即時に提示できるが、通常候補を `docs/todo/01_改善バックログ.md` へ追加する前に人間承認を得る。
- 承認済み改善は `docs/todo/01_改善バックログ.md`、実装基盤は `docs/todo/02_機能バックログ.md` に記録する。一般的な週次候補やsnapshotをGitHub Issue化しない。

### 18.5 実装対象

- `.claude/scripts/metrics/fetch-gsc-snapshot.mjs`
- `.claude/scripts/metrics/fetch-ga4-snapshot.mjs`
- `.claude/scripts/metrics/update-history-csv.mjs`
- `.claude/scripts/lib/metrics-reader.mjs`
- `.claude/scripts/snapshot-weekly-metrics.mjs`
- `.claude/scripts/search-growth/`（既存serviceの最小変更のみ）
- `.github/workflows/fetch-metrics-weekly.yml`
- `.github/workflows/search-growth-weekly.yml`
- `.claude/skills/management/weekly-review/`
- `.claude/skills/management/weekly-plan/SKILL.md`
- `docs/01_技術設計/06_自動化インベントリ.md`

### 18.6 完了条件

- [x] GSC/GA4の確定7日・直前7日・ローリング28日が名前と期間metadata付きで生成される。
- [x] 確定7日の2期間は重複せず、取得遅延・JST境界・月跨ぎ・年跨ぎをtestできる。
- [x] 欠損日を0補完せず、partial時はWoW・ゲート判定を止める。
- [x] 過去week/as-ofのbackfillが決定的で、現在データの誤ラベルを防ぐ。
- [x] 既存のローリング28日履歴を破壊せず、見出し・schema version・migration noteで意味を訂正する。
- [x] weekly-reviewが確定7日でKPIを、ローリング28日で候補を扱う。
- [x] weekly-planが人間承認済み候補だけを最大1〜2件採用し、WIP 5以下を守る。
- [x] candidate生成、CLI、MCPのread-only性と既存57 testが退行しない。
- [x] workflow変更を自動化台帳へ反映する。
- [x] commit/push/PR/deploy、secret変更、外部mutationを行っていない。

### 18.7 実装記録（2026-07-28）

- **期間契約 SSOT**: `.claude/scripts/metrics/lib/periods.mjs`（遅延 GSC=3日/GA4=1日・JST 日付境界・
  明示 week は「その週の日曜」を anchor に決定的導出・未来週は throw = 誤ラベル防止・
  `assessDailyCoverage` が欠損日を 0 補完せず列挙）。集計/描画/履歴移行は
  `lib/weekly-summary.mjs`（`buildGscSummary`/`buildGa4Summary`/`renderGscLatest` 等）。
- **snapshot 出力**: fetcher が `summary.json`（finalized7d/previous7d/rolling28d + metadata）と
  GA4 `daily-clean.csv`（Japan-only 14日・coverage 判定用）を追加出力。GA4 KPI totals は
  country=Japan filter、raw は pollution 監視専用に分離。
- **履歴移行（値は不変・実データ適用済）**: GSC `history.csv` 15 週を `*_rolling28d` 列名へ改名、
  GA4 `history.csv` 15 週へ `basis` 列（raw-rolling28d / jp-calendar-week）付与。確定7日の
  非重複系列は新設 `history-finalized7d.csv`（GSC は committed daily.csv から W18〜W30 の
  12 週を決定的 backfill。W16/W17/W23 は日別行欠損のため honest skip）。
- **W30 検証**: finalized7d 892 clicks / 23,239 imp / CTR 3.84%（WoW +8.4%・非重複）を再現。
  旧 LATEST の「今週 3,224 (+11.5%)」は 21 日重複の rolling 差だったことを LATEST の
  migration note に明記（position のみ日別 imp 加重で ±0.01 差）。
- **candidate 承認**: `search-growth/lib/triage.mjs` + CLI `triage/approve/dismiss`
  （区分各 1・最大 3 件、週 2 件・WIP≤5 を機械強制、insufficient=freshness missing は昇格不可、
  analyze 再構築で lifecycle を `carryOverStatuses` が引き継ぐ）。MCP は read-only のまま。
- **workflow gate**: `metrics:check-period-contract`（fetch 側 `--strict` = commit 後に partial を
  赤くする / search-growth 側 `--max-age-weeks 1` = stale artifact からの再構築を止める）。
- **tests**: metrics 25 + search-growth 71（triage 10 追加）。
- **live 未検証**: 新 fetcher の CI 実走（summary.json/daily-clean.csv の実生成、GA4 jp7d 履歴の
  初回行、Period contract gate の実発火）は次回 `fetch-metrics-weekly` 実行（日曜 20:00 JST）で
  確認する。旧世代 snapshot（summary.json 無し）の gate は missing 扱い＝GSC は digest が
  daily.csv から決定的に再構築する。
