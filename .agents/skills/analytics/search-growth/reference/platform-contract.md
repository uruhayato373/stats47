---
type: agent-reference
date: 2026-07-29
status: active
owners: [gsc-analyst]
tags: [search-growth, gsc, ga4, crux, psi, cloudflare, mcp]
---

# Search Growth Platform Contract

## 1. SSOTと責務

検索成長基盤は、検索露出・インデックス・流入後行動・実ユーザー性能・サーバー状態を
一つの証拠チェーンへ統合し、決定的な改善候補を生成する。

- 運用入口・コマンド: `../SKILL.md`
- Observationの機械契約: `.claude/scripts/search-growth/lib/contracts.mjs`
- scoreとcandidate生成: `.claude/scripts/search-growth/lib/scoring.mjs`
- 週次期間・承認契約: `weekly-cycle-contract.md`
- 実装状況・未完了作業: `.claude/todo/backlog.md`の
  `SEARCH-OBSERVABILITY-RELEASE-01`
- 改善施策と効果判定: `.claude/todo/improvements.md`

本書に進捗や一時handoffを持たせない。実装履歴はgit、未完了作業はTODOへ置く。

## 2. 証拠チェーン

```text
GSC Search Analytics / URL Inspection / Sitemaps / GSC UI export
  + GA4
  + CrUX / PSI / Lighthouse
  + Cloudflare / production HTTP
  + route / sitemap / canonical static audit
        ↓
normalized Observation
        ↓
deterministic candidate engine
        ↓
human approval
        ↓
14 / 28 / 56 day measurement
```

| source | 用途 | 原則 |
|---|---|---|
| GSC Search Analytics | query/page/device/dateの需要とCTR | finalized遅延、pagination、欠損を保持 |
| URL Inspection | Google認識、canonical、crawl状態 | priority sampleのみ。全URL総当たり禁止 |
| Sitemaps API | submitted/indexed/error/warning | read-only。submit/deleteは公開しない |
| GSC UI export | APIにないcoverage理由別総数 | 手動ingestを維持 |
| GA4 | organic landing後の品質と回遊 | GSC clickと同値扱いしない |
| CrUX / History | field CWV | URL欠損時のorigin fallbackを明示 |
| PSI / Lighthouse | public/controlled lab診断 | fieldとlabを混同しない |
| Cloudflare / HTTP | 5xx、empty 200、cache、UA差 | query・secretを保存前にredact |
| static audit | route、canonical、noindex、redirect | repositoryの決定的検査を再利用 |

公開アプリのruntimeからGoogle/Cloudflare APIを呼ばない。collectorはローカルまたはCIだけで動かす。

## 3. Normalized Observation契約

```ts
type Observation = {
  source:
    | "gsc"
    | "inspection"
    | "sitemap"
    | "ga4"
    | "crux"
    | "psi"
    | "lighthouse"
    | "cloudflare"
    | "http"
    | "static";
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

- raw snapshotは既存配置を尊重し、normalized stateは再生成可能なderived dataとする。
- URL結合は`.claude/scripts/search-growth/lib/join-url.mjs`へ集約する。
- trailing slash、query、fragment、canonical、domain/propertyを決定的に扱う。
- `missing` / `partial` / `stale`を0へ変換しない。
- API失敗はsource単位で隔離し、過去snapshotへfallbackした場合は`stale`にする。
- query、credential、key file path、ログ中のsecretをtool resultや公開レポートへ出さない。

## 4. Candidate契約

候補種別:

- `ctr-opportunity`
- `striking-distance`
- `query-gap`
- `intent-mismatch`
- `mobile-gap`
- `indexability-conflict`
- `crawled-not-indexed`
- `soft-404-risk`
- `canonical-drift`
- `cwv-opportunity`
- `lab-regression`
- `server-risk`
- `measurement-gap`

scoreは決定的に計算する。

```text
opportunityScore =
  impact
  × confidence
  × actionability
  × freshness
  × evidenceCoverage
  ÷ effort
```

- impressionsが最低標本未満ならCTR候補を出さない。
- 一つのAPIだけで高confidenceにしない。
- 同じURL・根本原因はdedupeする。
- 過去の`effect/none` / `effect/adverse`を`past-effects.json`から反映しconfidenceを抑制する。
- LLMは候補の説明や実装案にだけ使い、route/status/retry/scoringを決めない。

各candidateは最低限、ID、URL/query group、type、score breakdown、evidence refs、
baseline period、observedAt/freshness、limitations、expected metric、suggested verification、
external action flag、lifecycle statusを持つ。

## 5. CLI・MCPの境界

CLIを正典実装とし、MCPは同じpure serviceを呼ぶread-only adapterにする。MCPが無くても
CIとローカル運用が成立しなければならない。

MCPへ公開してよいのは、status、candidate、measure、GSC/Inspection/Sitemaps、GA4、CrUX、
PSI、Cloudflare、route contractの読み取りだけ。filter、limit、cursorを持たせ、
`https://stats47.jp`以外の入力URLを拒否する。

次のmutationをMCPへ追加しない。

- deploy、commit、push、PR
- sitemap submit/delete
- GSC property/user変更
- GA4 custom dimension登録
- Cloudflare設定変更
- URL削除
- R2またはproduction data write

外部mutationやサイト実装は必ず人間承認を別途得る。

## 6. Indexing API準拠

Google Indexing APIは`JobPosting`または`BroadcastEvent`を含む`VideoObject`専用として扱う。
stats47のranking、area、theme、blog、410 URLへ送信しない。

- 通常URLのpublish pathは退役状態を維持する。
- 再クロール対応はsitemap、内部リンク、HTTP、canonical、contentを是正した後、
  URL Inspectionで`observe-after-fix`する。
- 過去送信履歴は証拠として保持するが、成功手段として推奨しない。
- read-onlyのURL Inspectionとsitemap観測は継続する。

## 7. Cadence

- Daily: URL Inspection priority sample、PSI重点URL、HTTP/status/canonical、Cloudflare異常、
  sitemap summary。自動Issueは既存の閾値alertだけ。
- Weekly: GSC/GA4 snapshot、normalized Observation、candidate rebuild、digest、人間triage。
- Monthly: CrUX History、28/56日effect判定、candidate calibration、stale data・quota・費用監査。

source failureが他sourceを巻き込まないようにし、日次・週次・月次を巨大な一workflowへ統合しない。

## 8. 実装配置

- pipeline: `.claude/scripts/search-growth/{collect,normalize,analyze,report,cli}.mjs`
- core: `.claude/scripts/search-growth/lib/`
- MCP: `.claude/scripts/search-growth/mcp/server.mjs`
- state: `.claude/state/search-growth/`
- CI: `.github/workflows/search-growth-weekly.yml`
- tests: `.claude/scripts/search-growth/__tests__/`

## 9. 検証

```bash
npm run search-growth:status
npm run search-growth:next -- --limit 20
npm run search-growth:test
npm run metrics:test
```

credentialがないsourceは`skipped`または`missing`と報告し、mock testだけでlive成功としない。
production mutation、secret変更、deployを検証に含めない。
