---
type: implementation-spec
date: 2026-07-23
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

## 17. Claude Code用プロンプト

```text
OUTPUT FORMAT:
- 最初に「完成させる結果 / Phase / dirty tree境界 / API・MCP安全境界 / Indexing API是正」を最大10項目で報告する。
- 各Phase終了時に「変更ファイル / 検証 / live未検証source / 残り」を報告する。
- 最終報告は「実装結果 / データ源 / CLI・MCP / 候補engine / Indexing API是正 / CI / 検証 / 未実行 / 変更ファイル」の9節。
- mockだけのsourceをlive検証済みとしない。partial/stale/missingを成功や0件としない。

BEHAVIOR CONTRACT:
- 計画だけで止まらず、仕様書Phase 0〜8と完了条件をすべて実装・検証する。
- 他セッションのdirty fileを編集・削除・stash・整形しない。
- 既存fetcher、snapshot、skills、workflow、auth helperを再利用し、同義基盤を複製しない。
- deterministic処理をLLMへ委ねない。
- secretを表示・保存しない。
- commit / push / PR / deploy / R2 write / GSC・GA4・Cloudflare mutationは禁止。

TASK:
`CLAUDE.md`と`docs/02_実装計画/39_検索成長統合MCP・API基盤実装仕様.md`を全文読み、本書を正典として検索成長統合基盤を実装してください。

最初にGSC、URL Inspection、Sitemaps、GA4、CrUX、PSI、Cloudflare、HTTP/static audit、既存skills/workflows/state/consumerを棚卸しし、重複と依存関係を明らかにしてください。

Google Indexing APIはJobPosting/BroadcastEvent以外に使用しない公式制約があります。stats47のranking/area/theme/blog/410 URLへ送信する既存pathを全て監査し、scheduled送信をrepository上で停止し、通常ページpublish codeを削除または実行不能にしてください。coverage remediationはsitemap、internal link、HTTP、canonical、content修正とURL Inspection観測へ移行してください。過去ログは証拠として保持し、推奨文言と現行backlogを訂正してください。

CLIを正典として`.claude/scripts/search-growth/`にcollect/normalize/analyze/report/status/next/measureを実装し、既存fetcherをlibraryまたはadapterとして再利用してください。Observation schema、freshness、provenance、redaction、URL normalization、source manifestを実装してください。

GSC Search Analytics、URL Inspection、Sitemaps API、GSC UI export、GA4 Data API、CrUX/History、PSI、local Lighthouse、Cloudflare、production HTTP、route/sitemap/canonical static auditを統合してください。credentialがないsourceはmock testを行い、live未検証と明示してください。

candidate engineはpure deterministic ruleで実装してください。CTR opportunity、striking distance、query gap、intent mismatch、mobile gap、indexability conflict、crawled-not-indexed、soft404 risk、canonical drift、CWV、lab regression、server risk、measurement gapを扱い、minimum sample、missing/stale、past effect/none・adverse、dedupeを考慮してください。

CLI完成後、現行`.mcp.json`とClaude Code/Codexのproject-scoped MCP方式を確認し、同じserviceを呼ぶread-only MCP adapterを最小実装してください。status/candidates/GSC/Inspection/Sitemaps/GA4/CrUX/PSI/Cloudflare/route contract/measureをfilter・limit・cursor付きで公開してください。deploy、sitemap submit/delete、Admin変更、Cloudflare変更、production writeはMCP toolにしないでください。MCPが使えなくてもCLIで全機能が成立するようにしてください。

dailyはblocker観測、weeklyは全snapshotとcandidate更新、monthlyは28/56日効果判定へ整理してください。既存workflowを一度に巨大化せず、shared scriptsとfailure isolationを使ってください。自動化を変更したら`docs/01_技術設計/06_自動化インベントリ.md`を更新してください。

最低限、pagination、quota、API error、missing/zero/stale、URL normalization、redaction、candidate scoring/dedupe、MCP schema/domain/limit/read-only、CLI-MCP fixture一致、Indexing API publish不在、workflow停止をtestしてください。

live APIはread-onlyだけsmoke可能です。外部mutation、secret変更、本番deployは行わないでください。

検証後、`docs/todo/02_機能バックログ.md#SEARCH-GROWTH-PLATFORM-01`を実装結果に更新し、影響する`docs/todo/01_改善バックログ.md`、GSC/coverage skills、improvement-log、automation inventoryを現在仕様へ更新してください。一時handoffは作らず、残作業は正しいbacklogへ直接記録してください。

全完了条件を満たすまで実装と検証を継続してください。
```
