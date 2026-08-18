---
title: アフィリエイト Playwright 継続運用・安全化実装仕様
type: implementation-spec
date: 2026-07-28
updated: 2026-08-04
status: in-progress
related_backlog: ASP-CONTINUITY-01
tags: [affiliate, Playwright, automation, operations, safety, measurement]
---

# アフィリエイト Playwright 継続運用・安全化実装仕様

## 0. この文書の位置づけ

本書は、A8.net・もしもアフィリエイト・afb の提携申請、承認追跡、広告コード取得、サイト配線を
Claude Code と Playwright で継続運用するための実装仕様である。

未完了タスクの status / tier / 期日は
`.claude/todo/backlog.md` の `ASP-CONTINUITY-01` を真実源とする。本書は実装方法と受入条件を扱い、
提携状態・広告在庫・成果値の現在値を正典化しない。

運用上の正典は既存の配置を維持する。

| 対象                   | 正典                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| アフィリエイト運用規約 | `.claude/rules/affiliate-ads-standards.md`                                       |
| A8 ブラウザ操作        | `.claude/agents/asp-scout.md` + `.claude/skills/ads/scout-asp/`                  |
| 3 ASP 横断操作         | `.claude/agents/affiliate-operator.md` + `.claude/skills/ads/affiliate-operate/` |
| 配信 SSOT・配置        | `.claude/agents/affiliate-manager.md` + `apps/web/scripts/affiliate-ads-data.ts` |
| A8 状態機械            | `.claude/state/ads/a8-catalog.json`                                              |
| 3 ASP 横断台帳         | `.claude/state/ads/affiliate-catalog.json`                                       |
| 配信時の広告データ     | git TS → R2 snapshot                                                             |
| 未完了状態             | `.claude/todo/backlog.md` `ASP-CONTINUITY-01`                             |

`a8-catalog.json` と `affiliate-catalog.json` は用途が異なるためマージしない。必要な横断表示は、
両方を入力にした read-only の派生 view で作る。

## 1. ゴール

継続運用を次の閉ループにする。

```text
候補発見
  → 掲載適格性の判定
  → 人間が申請計画を承認
  → 1 件ずつ冪等に申請
  → 承認状態を定期照合
  → 広告コードを安全に取得
  → SSOT 変更案を生成
  → compliance / 型 / export gate
  → 人間承認後に公開
  → GA4 と ASP 確定成果を照合
  → 継続 / 降格 / 停止候補を提示
```

成功状態は次のとおり。

1. 同じ案件を再実行しても重複申請、二重登録、二重公開が起きない。
2. 申請ボタン押下後にプロセスが落ちても、状態を「未申請」と誤認して再申請しない。
3. 一覧の取得失敗、未走査ページ、セッション失効を「案件なし」と扱わない。
4. vertical が一致するだけで、無関係・高リスクなページへ広告を配信しない。
5. 古い GA4 event schema を `measurementGate=ready` と誤判定しない。
6. 提携終了・広告終了・リンク切れ・条件変更を検出し、配信停止案を出せる。
7. Playwright の失敗を cron 成功として隠さず、最後に成功した工程と時刻が分かる。
8. 管理画面の Cookie、token、個人情報、秘密情報を git・ログ・モデル入力へ残さない。
9. 最適化指標を ASP 表示の単価だけでなく、確定報酬と実表示数へ接続する。

## 2. 2026-07-28 時点の実測ベースライン

以下は設計判断の根拠であり、変動値の正典ではない。実装時には state を再読込する。

| 観測                                                       | 根拠                                                   | 判断                                      |
| ---------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| active 広告 260 件、広告主 160 社、10 vertical に gap なし | `.claude/state/ads/inventory-latest.json`              | 新規申請数は現在の制約ではない            |
| A8 の新規 scout / apply は `APPLY_NEW=0`                   | `scripts/scheduled/scout-asp-weekly.sh`                | 計測復旧まで維持                          |
| もしも / afb は apply 後の承認追跡・harvest が未実装       | `/affiliate-operate`                                   | `ASP-CONTINUITY-01` の主対象              |
| GA4 operations state が旧データでも `ready`                | `.claude/state/ads/affiliate-operations-latest.json`   | event schema gate が必要                  |
| 直接配置 2 件に PR 表記不足                                | `.claude/state/ads/compliance-latest.json`             | 公開前 fail gate が必要                   |
| A8 `check-approval` の全ページ走査は実装済 (2026-08-04)    | `a8-browser.ts` `collectPartneredProgramIds`           | 残りは上限到達の `partial` 表現 (§8.1)    |
| cron は各失敗を echo 後に継続して握り潰す                  | `scout-asp-weekly.sh`                                  | partial / failed を exit と health に反映 |
| append の失敗復元が `git checkout --`                      | `append-affiliate-ads.ts`                              | 既存未コミット変更を消し得る              |
| 広告スクリプト純粋コアのテストは 120 件成功                | `node --test .claude/scripts/ads/__tests__/*.test.mjs` | browser adapter と cron の test が不足    |

## 3. 最優先の不変条件

### 3.1 外向き操作

- 新規提携申請、契約同意、広告掲載、develop push、R2 publish、production deploy は外向き操作である。
- `--commit` は、その実行回に対するオーナーの明示承認がある場合だけ許可する。
- cron は新規提携申請、SSOT 書換え、commit、push、publish、deploy を行わない。
- CAPTCHA、2FA、初回ログインは人間が行う。自動回避を実装しない。
- ASP の公開規約だけでは管理画面の無人 UI 自動操作が明示許諾されていると確認できないため、
  unattended 運用を有効化する前に各 ASP へ用途・頻度・操作範囲を伝え、回答を保存する。

公式確認先:

- A8.net メディア会員利用規約: <https://www.a8.net/compliance/media-userpolicy.php>
- A8.net PR 表記: <https://www.a8.net/compliance/prNotation-urlSubmission.php>
- もしもアフィリエイト メディア利用規約: <https://af.moshimo.com/af/www/terms/shop>
- afb パートナー規約: <https://www.afi-b.com/general/partner/terms>
- afb API 連携: <https://www.afi-b.com/guide/api-linkage/>

### 3.2 サイト帰属

- A8 / もしも / afb は stats47 と doboku-note が同一口座に同居する。
- `asp-site-guard.mjs` の fail-closed を維持する。
- `--force`、fallback site、警告して続行する分岐を作らない。
- 申請前、一覧読取前、広告コード取得前の各工程で site ID を read-back する。

### 3.3 単一 writer

- ASP UI と catalog の writer は `affiliate-operator` / `asp-scout` の担当範囲に留める。
- `affiliate-ads-data.ts` の writer は `affiliate-manager` だけにする。
- 同一 working tree で複数 writer agent を動かさない。
- 分散 lock 用の DB を新設しない。`--commit` を実行する端末を 1 台に固定し、他端末は read-only とする。

### 3.4 Playwright の責務

Playwright は UI の取得・一意な要素の read-back・許可された 1 クリックだけを担当する。

次はモデルではなく決定的コードで行う。

- status 遷移
- 申請上限
- plan hash
- idempotency
- pagination 完了判定
- canonical サイズ判定
- eligibility gate
- freshness / measurement gate
- cron の成功・失敗判定

## 4. スコープ

### 4.1 本仕様で実装する

- エージェント・rule・skill 間の実行契約の一本化
- GA4 measurement schema v2 と偽陽性防止
- 申請 plan、hash、operation journal、排他 lock
- A8 / もしも / afb の完全走査を表現する共通 result
- もしも / afb の承認追跡
- もしも / afb の広告コード取得案生成
- A8 `check-approval` の pagination
- 提携終了・リンク切れ・条件変更の reconciliation
- cron の truthful exit、heartbeat、ログ保全
- debug artifact の最小化・mask・retention
- blog の文脈不一致 fallback の fail-closed
- `targetRankingKeys` の hard allowlist 化
- PR 表記違反の公開 gate
- ASP 成果の正規化 view と確定報酬ベースの候補生成

### 4.2 本仕様では実行しない

- 新しい万能 agent の追加
- A8 と3 ASP横断 catalog の統合
- 永続 D1・外部 queue・常駐サーバーの追加
- CAPTCHA / 2FA / bot detection の回避
- 無承認の提携申請
- 勝者広告、priority、掲載枠の自動反映
- 無承認の commit / push / PR / deploy / R2 write
- 管理画面 raw HTML・未加工 screenshot の git 保存
- ASP 間で提供されない page / ad 単位成果の推測結合

## 5. 目標アーキテクチャ

既存 agent を維持し、コード層を次のように分ける。

```text
affiliate-operator / asp-scout
  ├─ policy: eligibility / authorization / budget
  ├─ planner: dry-run plan + SHA-256
  ├─ executor: Playwright adapter
  ├─ journal: intent / sent / confirmed / unknown
  ├─ reconciler: live list vs catalog
  └─ proposer: harvested draft / suspension proposal

affiliate-manager
  ├─ SSOT patch
  ├─ type / inventory / export / compliance gate
  └─ owner-approved publish preparation

analytics
  ├─ GA4 affiliate_impression / affiliate_click
  ├─ ASP conversions / approvals / confirmed revenue
  └─ normalized outcome view
```

新規コードは既存配置規約に従う。

| 種別                             | 推奨配置                                |
| -------------------------------- | --------------------------------------- |
| 純粋な状態・plan・reconcile      | `.claude/scripts/ads/lib/`              |
| 3 ASP 共通 CLI                   | `.claude/scripts/ads/`                  |
| A8 固有 UI adapter               | `.claude/skills/ads/scout-asp/scripts/` |
| OS の定期実行 wrapper            | `scripts/scheduled/`                    |
| synthetic DOM fixture            | `.claude/scripts/ads/__fixtures__/`     |
| 単体テスト                       | `.claude/scripts/ads/__tests__/`        |
| ローカル journal / lock / health | `.local/affiliate-ops/`                 |

## 6. 状態モデル

### 6.1 永続 state を無理に統合しない

A8 と横断 catalog は既存の状態機械を保持する。表示・cron 判定用に次の normalized status を導出する。

```text
candidate
eligible
application-planned
applying
application-unknown
approved
harvested
registered
published
rejected
suspension-proposed
suspended
ended
blocked
error
```

`none` は lifecycle status に使わない。一覧で見つからないことは、走査未完了、ページ漏れ、selector drift、
提携終了、却下のいずれでもあり得るためである。

### 6.2 browser scan result

各 ASP adapter は次の論理 schema を返す。実装時は JSDoc typedef または既存規約に合う型を使い、
`any` を増やさない。

```ts
type AspListSnapshot = {
  schemaVersion: 1;
  asp: 'a8' | 'moshimo' | 'afb';
  siteId: string;
  list: 'applying' | 'partnered';
  observedAt: string;
  completeness: 'complete' | 'partial' | 'unknown';
  pagesVisited: number;
  terminationReason:
    | 'last-page'
    | 'empty-page'
    | 'max-pages'
    | 'auth-required'
    | 'selector-drift'
    | 'site-attribution-error'
    | 'timeout';
  items: Array<{
    programId: string;
    name: string | null;
    statusText: string | null;
  }>;
};
```

負の判定は `completeness=complete` のときだけ材料にできる。それでも、既存 `approved/published` を
自動で削除せず `suspension-proposed` にする。

### 6.3 operation plan

dry-run は `.local/affiliate-ops/plans/<operationId>.json` に次を保存する。

```ts
type AffiliateOperationPlan = {
  schemaVersion: 1;
  operationId: string;
  action: 'apply';
  asp: 'a8' | 'moshimo' | 'afb';
  siteId: string;
  programId: string;
  programName: string;
  formTargetCount: 1;
  applyLabel: string;
  confirmLabel: string | null;
  termsFingerprint: string | null;
  eligibilityFingerprint: string;
  createdAt: string;
  expiresAt: string;
  payloadSha256: string;
};
```

- `payloadSha256` は時刻を除く意味上の申請対象から決定的に算出する。
- plan の有効期限は既定 24 時間とする。
- `--commit` は `--plan <operationId>` を必須にし、`--commit --id` を禁止する。
- commit 前に同じ画面を再読込し、site、program、target count、label、terms fingerprint を再照合する。
- 1 項目でも違えば押さずに plan を失効させる。

### 6.4 operation journal

`.local/affiliate-ops/journal.ndjson` は append-only とし、1 行 1 event にする。

```text
planned → intent-recorded → sent → confirmed
                            └→ unknown
             └→ aborted
```

最低フィールド:

- `operationId`
- `at`
- `asp`
- `siteId`
- `programId`
- `event`
- `planSha256`
- `reason`

ボタンを押す直前に `intent-recorded`、押した直後に `sent` を fsync 相当まで完了させる。
`sent` または `unknown` がある operation は自動再送しない。次回は live reconciliation だけを行う。

### 6.5 lock

ASP ごとに `.local/affiliate-ops/locks/<asp>.json` を作る。

- `O_EXCL` 相当の排他的 create を使う。
- `pid`、`hostname`、`startedAt`、`operationId` を持つ。
- 生存 PID の lock は奪わない。
- stale lock は age と PID 不在の両方を確認してから回収する。
- `finally` では自分の operationId の lock だけ削除する。
- profile directory 自体を削除・移動しない。

## 7. 掲載適格性

### 7.1 vertical は eligibility ではない

`vertical` は広告意図の大分類であり、掲載許可ではない。候補ごとに次を決定的に記録する。

```ts
type AffiliateEligibility = {
  status: 'pending' | 'approved' | 'blocked';
  riskFlags: Array<
    | 'ymyl-medical'
    | 'financial-high-risk'
    | 'adult-or-dating'
    | 'body-modification'
    | 'investigation'
    | 'brand-mismatch'
    | 'terms-unverified'
  >;
  allowedPageTypes: Array<
    'ranking' | 'blog' | 'theme' | 'area' | 'category' | 'survey'
  >;
  allowedRankingKeys: string[];
  allowedTagKeys: string[];
  minimumEligibleImpressions: number | null;
  reviewedAt: string | null;
  reviewedBy: 'code' | 'owner' | null;
  evidence: string[];
};
```

禁止語、risk flag、最低需要などの規則は `.claude/scripts/ads/data/` の versioned policy へ置き、
catalog の各 entry には判定結果と fingerprint を保存する。アプリ配信に必要な allowlist だけを
`affiliate-ads-data.ts` の型付きフィールドへ移す。

### 7.2 apply gate

新規申請は次のすべてを満たすときだけ plan を生成できる。

1. `eligibility.status=approved`
2. `allowedPageTypes` または具体的な ranking/tag target が 1 件以上
3. `riskFlags` が空、またはオーナーの案件単位承認が記録済み
4. 対象ページに実測需要がある
5. 同一案件の `applying/unknown/approved/...` がない
6. measurement gate が ready
7. ASP ごとの週次上限内
8. ASP の自動操作可否が確認済み

候補順位は、ASP 表示の reward / EPC だけでなく次の期待値を使う。

```text
eligible impressions
  × observed CTR
  × observed CVR
  × approval rate
  × reward
```

欠損値を 0 や業界平均で補完しない。データ不足は `unknown` とし、新規申請の自動再開理由にしない。

### 7.3 配信 gate

最小変更として次を先に実施する。

- `targetRankingKeys` が設定済みなら hard allowlist とする。
- rankingKey がない blog 等で `targetRankingKeys` を無視しない。
- blog tag が未解決、または該当 vertical の在庫がない場合に `economy` へ fallback しない。
- 不一致時は空配列を返し、既存の AdSense fallback または無表示へ委ねる。
- home の既存方針は別ルールで意図的に固定されているため、本変更で推測拡張しない。

## 8. ASP adapter と reconciliation

### 8.1 A8

- ~~`check-approval` を全ページ走査へ変更する。~~ 実装済 (2026-08-04・`collectPartneredProgramIds`)。
  打ち切りは `import-partnered` の件数判定 (`< 20` で break) ではなく**新規 ID が増えなかったページ**とした。
  A8 が範囲外 `pageNo` で最終ページを返し続けた場合に件数判定は停止しないため。
- ページ上限は config 化し、上限到達は `partial/max-pages` とする。
  (現状は `MAX_PARTNERED_PAGES = 30` のハードコードで、上限到達時は警告ログのみ。呼出側へ `partial` を返していない)
- session expired を exit 0 の成功にしない。`auth-required` を呼出側へ返す。
- 既存 status を維持し、正の一致がある applied だけ approved へ進める。
- `dumpPage` の raw HTML 保存を廃止または sanitize する。

### 8.2 もしも

- `shop_site_id` を全 URL で固定し、各ページで read-back する。
- `apply_status=1/2` の全ページを巡回する。
- `promotion_id` は行スコープの href から抽出する。
- applying にいた案件が partnered へ現れた場合だけ approved へ進める。
- 広告コード画面の URL、selector、canonical banner/text の取得方法は実機 read-only audit で確定する。
- 取得コードは exact な href / image / tracking pixel を parser へ渡し、画面上のコードを改変しない。

### 8.3 afb

- Chosen site switch と SID read-back を維持する。
- pagination は実リンク click で辿り、`max-pages` 到達を complete としない。
- afb は別プロセスで session を復元できず headed が必要なため、無人 cron の対象にしない。
- 週次 cron は `manual-login-required` を health に記録し、人間が単一プロセスで status → harvest を行う。
- 成果取得は Playwright より公式 API を優先する。API 利用可否・審査・key 発行は人間工程とする。

### 8.4 status 更新規則

`affiliate-status --write` の「実機に無ければ `none`」を廃止する。

| prior                         | live evidence              | action              |
| ----------------------------- | -------------------------- | ------------------- |
| applying                      | partnered に正一致         | approved            |
| applying                      | applying に正一致          | no-op               |
| applying                      | complete scan で両方に無し | review-needed       |
| approved/registered/published | partnered に正一致         | no-op + verifiedAt  |
| approved/registered/published | complete scan で無し       | suspension-proposed |
| any                           | partial/unknown scan       | no mutation         |
| any                           | site attribution error     | fail                |

## 9. harvest と SSOT 登録

### 9.1 共通の出力

harvest は SSOT を直接変更せず、catalog entry に正規化 draft を保存する。

```ts
type AffiliateAdDraft = {
  asp: 'a8' | 'moshimo' | 'afb';
  programId: string;
  adType: 'banner' | 'text';
  title: string;
  href: string;
  imageUrl: string | null;
  trackingPixelUrl: string | null;
  width: number | null;
  height: number | null;
  sourceFingerprint: string;
  eligibilityFingerprint: string;
  harvestedAt: string;
};
```

- canonical サイズ以外の banner は draft にしない。
- text は既存 `sidebar-bottom` の規約へ合わせる。
- tracking code や query parameter を独自に削除・追加しない。
- 同じ source fingerprint は二重登録しない。
- vertical / page eligibility 未解決なら `pending` とし、SSOT へ進めない。

### 9.2 SSOT 変更

`append-affiliate-ads.ts` は次のように修正する。

1. 対象 SSOT が実行前から dirty なら `--apply` を拒否する。
2. 元内容を memory または `/tmp/` の所有ファイルに保持する。
3. 変更後内容を temp file へ生成する。
4. temp file に対して可能な gate を実行する。既存 gate が実ファイルを要求する場合も、失敗時は
   実行前に保持した byte 列を atomic に戻す。
5. `git checkout` / `git restore` を rollback に使わない。
6. catalog 更新は SSOT gate 成功後だけ行う。
7. SSOT と catalog の両書込は operationId を記録する。

## 10. measurement gate v2

### 10.1 GA4 snapshot

`ga4-affiliate-*.json` を schema v2 にする。

```json
{
  "schemaVersion": 2,
  "measurementEpoch": "affiliate-impression-v1",
  "eventNames": {
    "impression": "affiliate_impression",
    "click": "affiliate_click"
  },
  "generatedAt": "ISO-8601",
  "dimensions": [],
  "totals": {
    "impressions": 0,
    "clicks": 0,
    "ctr": null
  },
  "quality": {
    "recognizedVerticalImpressions": 0,
    "unsetVerticalImpressions": 0,
    "unsetVerticalRatio": null
  }
}
```

### 10.2 ready 条件

operations state の schema も v2 にし、次をすべて満たしたときだけ ready とする。

- GA4 snapshot `schemaVersion=2`
- `measurementEpoch=affiliate-impression-v1`
- impression event が `affiliate_impression`
- snapshot が freshness 閾値内
- `totals.impressions > 0`
- `affiliate_vertical` dimension が存在
- 認識済み10 verticalの impression が 1 件以上
- `(not set)/(unset)` 比率が named constant `MAX_UNSET_VERTICAL_RATIO=0.10` 以下
- active experiment がある場合は experiment / variant dimension が存在

旧 schema snapshot は値が新鮮でも `ga4-schema-unsupported` で blocked にする。

### 10.3 compliance

`compliance-latest.json` の `missingDisclosure` または `orphaned` が 1 件以上なら、
広告配信 snapshot の publish gate を失敗させる。

2026-07-29 の Phase 1 で次の2件を是正し、live compliance gate が
`ready` になったことを確認済み。

- `moshimo-ai-onikanri-93995`: blog head PR declaration
- `a8-strategy-career-koumuin-ai-tenshoku-260601701360`: blog head PR declaration + inline PR prefix

## 11. 定期実行と observability

### 11.1 cron の責務

週次 cron が行ってよい処理:

- status の完全走査
- 正の承認遷移
- 既存 approved の harvest 候補生成
- 終了・drift・selector 変更候補の報告
- SSOT append の dry-run
- health / log の更新

行ってはいけない処理:

- scout / apply
- `append --apply`
- SSOT 実変更
- commit / push / deploy / R2 write
- afb のログイン待ち

### 11.2 exit と health

各 step の結果を集約し、全 step が成功した場合だけ exit 0 にする。`|| echo` で握り潰さない。

```ts
type AffiliateAutomationHealth = {
  schemaVersion: 1;
  runId: string;
  startedAt: string;
  finishedAt: string;
  status: 'ok' | 'partial' | 'failed' | 'auth-required';
  steps: Array<{
    name: string;
    status: 'ok' | 'noop' | 'failed' | 'auth-required' | 'skipped';
    reason: string | null;
  }>;
  lastSuccessfulRunAt: string | null;
};
```

health は端末固有なので `.local/affiliate-ops/health.json` に置き、git を dirty にしない。
ログには program 名や報酬条件を必要以上に出さず、programId と step を中心にする。

### 11.3 concurrency

- cron 開始時に A8 / もしも profile lock を取得する。
- 人間の headed run が lock 中なら cron は failed にせず `skipped/profile-in-use` とする。
- 同時に `a8-catalog.json` / `affiliate-catalog.json` を書かない。
- git tracked catalog を変更する run は、開始前後の file hash を確認する。

## 12. セキュリティと retention

A8 の公開規約は管理画面で提供される情報を秘密情報として扱う。debug artifact を通常ログと同じ感覚で残さない。

- 成功時に screenshot / HTML を保存しない。
- failure artifact は `.local/` の runId directory だけに置く。
- directory `0700`、file `0600` を設定する。
- raw HTML は原則保存しない。必要なら selector 周辺だけを構造化・maskして保存する。
- screenshot は account header、氏名、メール、報酬、残高を mask または crop する。
- `maskSecrets` を email/token だけでなく cookie、authorization、CSRF、account ID、氏名候補へ拡張する。
- debug directory に 7 日 retention を設定する。
- cleanup は `.local/playwright-*-debug/<runId>` のような明示 target だけを削除する。
- profile、state file、workspace root を cleanup 対象にしない。
- raw 管理画面 artifact を Claude / subagent に読ませない。人間が selector と最小構造へ匿名化して fixture 化する。
- repository、CI artifact、ログ閲覧権限が秘密保持に適合するかオーナーが確認する。

`docs/01_技術設計/07_Playwright認証プロファイル.md` の「空・未ログイン」のような変動状態は削除し、
固定仕様と再ログイン手順だけを残す。実ログイン状態を git 文書へ固定しない。

## 13. 成果と収益の閉ループ

### 13.1 API first

- afb は公式成果 API を優先する。
- A8 は既存 `a8-report-collector` / CSV を使う。
- もしもは公式 API または export が確認できればそれを使い、無ければ低頻度の read-only UI 取得とする。
- API / CSV で取得できる情報を Playwright で重複取得しない。

### 13.2 normalized outcome

ASP ごとの取得結果は read-only の派生 view に正規化する。

```ts
type AffiliateOutcome = {
  asp: 'a8' | 'moshimo' | 'afb';
  programId: string;
  windowStart: string;
  windowEnd: string;
  attributionScope: 'program' | 'ad' | 'page';
  clicks: number | null;
  conversions: number | null;
  approvedConversions: number | null;
  rejectedConversions: number | null;
  confirmedRevenueYen: number | null;
  paidRevenueYen: number | null;
  source: 'api' | 'csv' | 'ui';
  observedAt: string;
};
```

ASP が program 単位しか返さない場合、GA4 の page / ad_id へ推測配賦しない。
`attributionScope=program` のまま保持する。

### 13.3 判断指標

優先順位:

1. 確定報酬 / 1,000 affiliate impression
2. 確定報酬 / click
3. 承認率
4. CTR
5. ASP 表示 EPC・想定単価

1〜3が欠損している間は 4〜5だけで自動掲載変更しない。

## 14. ファイル単位の変更計画

Phase 0 で再確認し、既存機能と重複する場合は新規ファイルを減らす。

| ファイル                                                          | 変更                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.claude/rules/affiliate-ads-standards.md`                        | 「全自動」と現行 safe mode の矛盾解消、状態・eligibility・cron責務 |
| `.claude/agents/asp-scout.md`                                     | 全件自動申請の記述を削除し、mode と承認境界を明示                  |
| `.claude/agents/affiliate-operator.md`                            | plan/journal/reconcile/harvest の責務追加                          |
| `.claude/agents/affiliate-manager.md`                             | eligibility を通過した draft だけ SSOT 化                          |
| `.claude/skills/ads/scout-asp/SKILL.md`                           | A8 pagination、safe cron、unknown 状態                             |
| `.claude/skills/ads/affiliate-operate/SKILL.md`                   | check-approval / harvest / health mode                             |
| `.claude/scripts/ads/lib/affiliate-operations-core.mjs`           | measurement gate v2                                                |
| `.claude/scripts/ads/fetch-affiliate-ga4.cjs`                     | snapshot schema v2・quality                                        |
| `.claude/scripts/ads/build-affiliate-operations-state.ts`         | schema v2・compliance gate                                         |
| `.claude/scripts/ads/lib/asp-browser-base.mjs`                    | lock、artifact mode、mask、retention                               |
| `.claude/scripts/ads/affiliate-apply.mjs`                         | plan必須、journal、unknown、idempotency                            |
| `.claude/scripts/ads/affiliate-status.mjs`                        | pagination、completeness、positive-only transition                 |
| `.claude/skills/ads/scout-asp/scripts/a8-browser.ts`              | approval 全ページ走査、raw dump廃止                                |
| `.claude/scripts/ads/append-affiliate-ads.ts`                     | dirty preflight、byte-preserving rollback                          |
| `scripts/scheduled/scout-asp-weekly.sh`                           | truthful result、lock、health                                      |
| `apps/web/src/features/ads/services/resolve-affiliate-ad.ts`      | blog economy fallback 廃止                                         |
| `apps/web/src/features/ads/repositories/affiliate-ad-snapshot.ts` | targetRankingKeys hard allowlist                                   |
| `docs/01_技術設計/07_Playwright認証プロファイル.md`                    | 変動するログイン状態を削除                                         |
| `docs/01_技術設計/06_自動化インベントリ.md`                       | cron追加・変更時に更新                                             |

想定する新規 pure core。Phase 0 で既存 core に収まるなら統合し、ファイルを増やさない。

- `.claude/scripts/ads/lib/asp-operation-core.mjs`
- `.claude/scripts/ads/lib/asp-reconciliation-core.mjs`
- `.claude/scripts/ads/lib/affiliate-eligibility-core.mjs`

## 15. 実装フェーズ

### Phase 0 — read-only 監査（完了 2026-07-29）

監査結果は本節と `.claude/todo/backlog.md` の `ASP-CONTINUITY-01` へ統合済み。
判定は `ready`、pure core test は 120/120 pass。

外部ブラウザを起動せず、コードと state だけを調べる。

- `git status` と関連差分を確認し、既存変更を保護する。
- 本書の前提を現行コードへ突合する。
- 既存 test baseline を取る。
- 追加・変更・触らないファイルを確定する。
- `.claude/scripts/ads` 内の state writer を列挙する。
- 未完了事項だけを `ASP-CONTINUITY-01` の実行順・停止条件・完了条件へ反映する。
- Phase 1 の開始可否を `ready / blocked` で判定する。

### Phase 1 — 外部アクセス不要の安全基盤（完了 2026-07-29）

measurement gate v2、plan/journal/lock core、安全 rollback、truthful cron health、
artifact 保護、契約ドリフトと既知 PR 表記を是正済み。apply CLI への plan 必須配線は
Phase 2 以降で行う。

- measurement gate v2
- operation plan / hash / journal の pure core
- lock / stale lock の pure core
- append の安全な rollback
- cron result / health の pure core と shell 配線
- artifact mask / retention
- rule / agent / skill の契約矛盾解消
- 既知の PR 表記2件のローカル是正

Playwright、ASP、R2、本番へアクセスしない。

### Phase 2 — eligibility と配信 fail-closed

- eligibility policy / schema / tests
- apply gate
- `targetRankingKeys` hard allowlist
- blog economy fallback 廃止
- resolver / repository の既存テスト更新
- app type-check

公開はしない。ローカル差分と検証結果をオーナーへ提示する。

### Phase 3 — ASP の read-only 実機監査

オーナーが明示承認し、必要なら手動ログインした場合だけ実行する。

- A8 / もしも / afb の applying / partnered pagination
- もしも / afb の広告コード画面への read-only 導線
- selector の一意性
- site ID read-back
- 生データを保存せず、匿名化した最小 fixture を人間確認後に作成

申請、設定変更、広告コードのSSOT反映は行わない。

### Phase 4 — reconciliation / harvest

- fixture parser
- complete / partial / unknown 判定
- positive-only approval transition
- suspension proposal
- もしも / afb harvest draft
- A8 approval pagination
- CLI と skill 接続

live smoke は既存案件の read-only 1 件まで。新規申請しない。

### Phase 5 — assisted weekly run

- A8 / もしも cron
- afb manual-login-required
- health / logs
- lock / concurrent run
- selector drift / auth expiry notification
- launchd の 1 回手動 kick と結果確認

### Phase 6 — 収益 outcome

- A8 CSV の normalized view
- afb API の利用可否確認と owner 手順
- もしもの official export / API 調査
- confirmed revenue と GA4 denominator の接続
- 改善候補の生成

### Phase 7 — live canary / publish

次を満たす場合だけ別承認で行う。

- ASP から自動操作可否の回答を取得
- measurement gate ready
- eligibility approved
- plan hash 一致
- journal / lock 稼働
- dry-run 結果をオーナーが確認

新規申請の canary は 1 ASP・1案件・1回に限定する。SSOT publish / deploy はさらに別承認とする。

## 16. テスト計画

### 16.1 pure unit

- plan payload の順序が違っても同じ hash
- program / site / terms の変更で hash が変わる
- expired plan を commit できない
- `sent/unknown` operation を再送できない
- 生存 PID lock を奪わない
- stale lock の条件を片方だけ満たしても回収しない
- partial scan で status を変更しない
- applying → partnered の正一致だけ approved
- published 不在は suspension-proposed
- unsupported GA4 schema を blocked
- impression 0 を blocked
- recognized vertical 0 を blocked
- compliance violation を publish blocked
- pre-existing SSOT byte を gate failure 後も保持
- raw secret / email / token / account header を artifact へ残さない
- eligibility pending / risk flag で plan を作れない

### 16.2 synthetic DOM fixture

実管理画面 HTML を保存せず、最小の匿名 fixture を手書きする。

- 一覧 1 ページ / 複数ページ / 最終ページ
- 空一覧
- auth redirect
- selector drift
- 同名案件で ID が異なる
- もしもの href 内 `promotion_id`
- afb の `【PID:N】`
- 一括申請用 input が混ざる
- site select 不一致
- canonical banner / non-canonical banner / text

### 16.3 integration

- CLI dry-run が plan のみ生成し catalog を変えない
- commit は plan なしで失敗
- cron の1工程失敗が全体 `partial/failed`
- health の `lastSuccessfulRunAt` は成功時だけ更新
- concurrent run は2本目を skip
- append gate failure で既存未コミット内容が残る

### 16.4 live smoke

- headed
- 1 ASP ずつ
- 既存案件 1 件
- read-only
- max page / timeout / duration を固定
- 生 artifact を残さない
- 最後に context、所有 process、lock を閉じる

## 17. 検証コマンド

実装した phase に応じて必要なものだけ実行する。

```bash
# 広告 pure core
node --test .claude/scripts/ads/__tests__/*.test.mjs

# web の resolver / repository を変更した場合
npm run type-check --workspace apps/web
npx vitest run \
  apps/web/src/features/ads/__tests__/resolve-affiliate-ad.test.ts \
  apps/web/src/features/ads/repositories/__tests__/affiliate-ad-snapshot.test.ts

# 在庫・export・compliance
npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts --check-size
NODE_OPTIONS="--conditions react-server" \
  npx tsx apps/web/scripts/export-affiliate-ads-snapshot.ts --validate-only
npx tsx .claude/scripts/ads/audit-affiliate-compliance.ts --check

# 参照・契約ドリフト
rg -n "全件自動申請|週次全自動|APPLY_NEW|git checkout" \
  .claude/agents .claude/skills/ads .claude/rules/affiliate-ads-standards.md \
  .claude/scripts/ads scripts/scheduled
```

app route、SSG、R2 export の本番挙動を変更しない phase では full build を実行しない。
実行しなかった test / browser smoke / build / deploy は最終報告に明記する。

## 18. 受入条件

### Safety release

- [ ] agent / rule / skill の apply・cron・publish 契約が矛盾しない。
- [ ] `--commit --id` が拒否され、plan hash が必須。
- [ ] click 前後の journal があり、unknown を自動再送しない。
- [ ] ASP profile lock と stale lock test がある。
- [ ] partial / auth-required / selector-drift が成功扱いにならない。
- [ ] `git checkout` rollback が無く、既存 SSOT 変更を保持できる。
- [ ] raw管理画面HTMLを保存しない。
- [ ] debug artifact の permission と retention がある。

### Data correctness release

- [ ] measurement schema v2 以前の snapshot が blocked。
- [ ] `affiliate_impression=0` が blocked。
- [ ] 10 vertical の実 impression が確認できる。
- [ ] PR表記不足が publish gate を通らない。
- [ ] `targetRankingKeys` が非rankingページでも hard allowlist。
- [ ] blog の不一致時 economy fallback がない。
- [ ] vertical と eligibility が別項目。

### ASP continuity release

- [ ] A8 / もしも / afb の scan completeness を表現できる。
- [ ] A8 / もしもの approval を全ページ追跡できる。
- [ ] afb は assisted run として auth-required を正しく報告する。
- [ ] もしも / afb の approved から draft を作れる。
- [ ] 提携終了候補が suspension-proposed になり、自動削除されない。
- [ ] cron の最終成功時刻と失敗 step が分かる。

### Revenue release

- [ ] A8・afb・もしもの取得可能範囲を明示した outcome view がある。
- [ ] program scope の成果を page/ad scope へ推測配賦しない。
- [ ] 確定報酬 / 1,000 impression を計算可能、または不足理由を表示できる。
- [ ] 勝者・停止候補は提示だけで、自動反映されない。

## 19. ロールバック

- コード変更は phase ごとに独立差分とする。
- rollback は対象ファイルの実行前 byte 列または inverse patch で行う。
- user の既存変更へ `git checkout` / `git restore` / reset を使わない。
- catalog migration は schema version と一方向 migration を持ち、旧 reader が壊れる場合は同一 phase で更新する。
- measurement v2 が失敗しても、旧データを ready として再利用しない。blocked のまま原因を表示する。
- resolver の fail-closed で収益が下がっても、無関係広告を再表示して回避しない。適格在庫または実測で判断する。

## 20. オーナーが行うこと

- 各 ASP へ自動操作可否を問い合わせる。
- `--commit` の plan を案件単位で承認する。
- afb の手動ログインを行う。
- afb API key の発行可否を確認する。
- GA4 の `affiliate_impression` と vertical 内訳を本番実測で確認する。
- local diff の確認後、commit / push / PR / deploy を別途指示する。

## 21. Claude Code 用プロンプト

### 21.1 Phase 2 用プロンプト — eligibility / 配信

Phase 1 が green の場合だけ使用する。

```text
<task>
  <goal>アフィリエイト候補の掲載適格性gateと、サイト配信の文脈fail-closedを実装する</goal>
  <scope>doc 42 Phase 2のみ。eligibility pure core、apply plan gate、targetRankingKeys hard allowlist、blog economy fallback廃止、関連test/rule更新</scope>
  <sources>doc 42 Phase 0、affiliate rules、placement-map state、既存resolver/repository/tests</sources>
  <done_when>risk/target未承認案件はplanを作れず、targetRankingKeys指定広告は非ranking文脈へ出ず、blog不一致時は空を返し、対象testとweb type-checkが成功する</done_when>
  <authorization>ローカル編集とテストのみ。ASP・Playwright・commit・push・deploy・R2 writeは禁止</authorization>
</task>
<output_format>
最終報告は「結果 / 変更 / 検証 / 配信差分 / 未実行」の5見出し、800語以内。
</output_format>

- git statusとdoc 42 Phase 0を先に読む。
- 既存未コミット変更を保護し、対象fileがdirtyなら衝突箇所を示す。
- verticalをeligibilityの代用にしない。
- policy値はversioned config、判定はpure core、配信allowlistはgit TSの型で拘束する。
- 未知のtag/pageはeconomyへfallbackしない。
- homeの既存方針は本scopeで変更しない。
- 実データ件数をtestへ固定しない。
- doc 42 §17の対象testとtype-checkを実行する。
- full build、公開、ブラウザ操作はしない。
```

### 21.2 Phase 3〜4 用プロンプト — read-only 実機監査と continuity

オーナーが「ASPへのread-onlyアクセスを許可」と明示した場合だけ使用する。

```text
<task>
  <goal>A8・もしも・afbの一覧と広告コード導線をread-onlyで実測し、完全走査reconciliationとharvest draftを実装する</goal>
  <scope>doc 42 Phase 3と4。新規申請・設定変更・SSOT反映・公開は対象外</scope>
  <sources>doc 42 Phase 0、Phase 1/2実装、ASP config、site guard、synthetic fixtures</sources>
  <done_when>各ASPのscan completenessが表現され、positive-only approval transitionとharvest draftがfixture testで成功し、許可されたASPだけread-only smoke結果がある</done_when>
  <authorization>headed Playwrightによるread-onlyアクセスを1 ASPずつ許可。apply/submit/confirm、一括操作、catalog --write、SSOT変更、commit/push/deployは禁止。ログインは人間のみ</authorization>
</task>
<output_format>
最終報告は「ASP | 読取範囲 | 完全性 | 実装 | fixture | 未検証」の表1つと、要判断最大5項目。
</output_format>

- 最初に対象ASPとログイン可否を確認する。未ログインなら自動入力せず人間を待つ。
- apply/submit/confirmに一致する要素をclick allowlistへ入れない。
- 1 ASP・1 listずつ、max pages/timeを固定する。
- site ID read-back前に一覧やコードを採用しない。
- raw HTML、full screenshot、Cookie、token、個人情報、報酬画面を保存・表示しない。
- selector確定用fixtureは匿名の最小HTMLを手書きする。
- partial/unknown scanからnegative transitionを作らない。
- afbを無人cronへ入れない。
- live smoke終了時にcontextと自分のlockだけを閉じる。
- SSOT appendはdry-runまで。外向き変更はしない。
```

### 21.3 Phase 5〜6 用プロンプト — 定期実行と収益

```text
<task>
  <goal>承認追跡をassisted weekly runへ接続し、GA4とASP確定成果のnormalized viewを作る</goal>
  <scope>doc 42 Phase 5と6。A8/もしものsafe cron、afb manual gate、health、API/CSV first outcome view</scope>
  <sources>Phase 0〜4の実装と監査、doc 42、a8-report、afb公式API仕様、GA4 schema v2</sources>
  <done_when>cron失敗がhealth/exitへ反映され、afbはmanual-login-requiredとなり、取得可能範囲だけでconfirmed revenue指標を生成できる</done_when>
  <authorization>ローカル実装・test・read-only API/CSV確認まで。ASP申請、SSOT変更、commit/push/deploy/R2 writeは禁止</authorization>
</task>
<output_format>
最終報告は「結果 / cron / outcome / 検証 / 人間作業 / 未実行」の6見出し、各4項目以内。
</output_format>

- API/CSVで取得できる情報をPlaywrightで重複取得しない。
- program scopeをpage/ad scopeへ推測配賦しない。
- afb API keyが無ければ0で埋めずblocked理由を出す。
- cronはscout/apply/append --apply/pushを含めない。
- launchd kickはprofile lockとread-only範囲を確認し、オーナー承認がある場合だけ行う。
- 最終成功時刻は全必須step成功時だけ進める。
- full build、commit、push、deployは実行しない。
```
