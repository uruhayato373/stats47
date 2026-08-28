---
name: a8-report
description: A8.net の成果レポート CSV を Playwright で収集し (collect)、データ品質を検査し (validate)、決定的に正規化して成果 SSOT へ upsert する (normalize)。A8 にはサイト切替が無いため口座 (mediaId) を assert し、stats47 と doboku-note の分離はレポート単位で行う。account-wide レポートは口座横断なので stats47 単独の実績として扱わない。Use when user says "A8 レポートを収集", "アフィリ成果を取得", "EPC を実測", "a8-report".
disable-model-invocation: true
primary_agent: a8-report-collector
co_agents: [a8-csv-auditor, affiliate-operator]
---

A8 の**成果 (発生・確定・EPC)** を実測して取り込む。提携運用 (`/affiliate-operate`) や
案件開拓 (`/scout-asp`) とは役割が違う。ローカル限定 (Playwright 永続プロファイル)。

> **正典は `.Codex/rules/affiliate-ads-standards.md` §11**。設定は `.Codex/config/a8-report-automation.json`、
> 成果 SSOT は `.Codex/state/metrics/affiliate/{a8-results.json,a8-report-log.json}`。
> A8 ログインは `/scout-asp` と**同じ永続プロファイルを共有**する (別パスにすると二重ログインになる)。

## ★数値を扱うときの不変条件

| レポート | siteScope | stats47 単独と言えるか |
|---|---|---|
| `site-summary` (`/report/site`) | `site-rows` | **言える** — サイト列があり stats47 行だけ採れる。**実績の真実源** |
| `program-detail` / `period-monthly` / `period-daily` | `account-wide` | **言えない** — 口座横断。`programIdMap` の allowlist で近似し、site-summary と突合して検算する |

- **両サイトが同じ A8 案件を配信している 3 プログラム** (buildjob / kensetsu-jobs / gks
  = config `_sharedWithDobokuNote`) は programId でも分離できない。その行は**両サイト合算**。
- account-wide 由来の数値を引用するときは必ず「口座横断 (doboku-note 込み)」と併記する。
  併記なしに stats47 の EPC として報告しない (`.Codex/rules/evidence-based-judgment.md`)。

## 手順

### 1. due 確認 (トークン消費ゼロ)

```bash
node .Codex/scripts/ads/check-a8-report-due.mjs
```

前回取り込みからの経過日数を surface する。**cron は作らない** — weekly-review がこれを呼ぶ運用。

### 2. collect — CSV を取る (ローカル・要 A8 ログイン)

```bash
# まず期間適用とDOM/selectorを検証 (ダウンロードしない)
node .Codex/scripts/ads/fetch-a8-ui-csv.mjs --dry-run --reports all --month YYYY-MM
# 単月を明示して実収集
node .Codex/scripts/ads/fetch-a8-ui-csv.mjs --reports all --month YYYY-MM
```

- 未ログインならブラウザが開くので人間がログインする (`/scout-asp` の `login.mjs` でも可)。
- 出力: `.local/a8-ui/<runId>/` に raw CSV + `manifest.json` (sha256 / 行数 / 期間)。
- **口座 assert に失敗したら 1 バイトも取り込まず停止する。** 回避しない。
- `--probe-isolation` / `--probe-period` は実機観察用 (ダウンロードしない)。
- **期間は URL では制御できない**。configで実機確認済みの可視フォームだけを操作し、
  `--month`の要求期間とCSVファイル名の実期間が完全一致しないunitは`period-mismatch`で取り込まない。

### 3. validate — 品質を検査する

`a8-csv-auditor` を起動し、manifest / raw / 正規化結果を採点させる (PASS/WARN/FAIL)。
**収集した本人が採点しない。** FAIL なら normalize へ進まず collect をやり直す。

### 4. normalize — SSOT へ upsert (決定的・ネットワーク不要)

```bash
node .Codex/scripts/ads/normalize-a8-csv.mjs --latest
node .Codex/scripts/ads/check-a8-outcome-gate.mjs
```

- `<runDir>/normalized/<reportKey>.json` (+ `.rejects.json`) を書き、
  `.Codex/state/metrics/affiliate/{a8-report-log.json,a8-results.json}` へ upsert する。
- raw CSV と manifest は書き換えない (append-only・監査可能性のため)。
- `programIdMap` に無い programId は **unmapped として報告される** (黙って捨てない)。
  stats47 の広告なら `apps/web/scripts/affiliate-ads-data.ts` に mid= があるはずなので、
  config の `programIdMap` を更新する。他サイト専用なら `_otherSiteProgramIds.ids` に足す。
- outcome gateが`blocked`なら、欠損・累計・stale・サイト不一致・口座横断超過を0成果へ変換しない。
  `ready`は「利用可能」の意味であり、広告の勝者や採用を自動決定しない。

## トラブル時

- **CSV ボタンが押せない / 曖昧**: `exportButtonLabels` に語を足さない (同一ボタンに複数ヒットして
  かえって押せなくなる)。debug artifact の visible-text.txt を見て実ラベルを確認する。
- **文字化け**: `csvEncoding` は Shift_JIS 前提。`decodeCsvBuffer` は U+FFFD を数えて UTF-8 へ
  自動フォールバックする。両方で化けるなら A8 側の変更を疑い、config を実機確認して直す。
- **列が取れない**: `columnAliases` に実ヘッダーを追加する。`確定金額` は `未確定金額` の部分文字列なので、
  完全一致を先に全列走査してから部分一致に落ちる実装になっている (順序を崩さない)。

## 関連

- 規約: `.Codex/rules/affiliate-ads-standards.md` §11 / 実証判定: `.Codex/rules/evidence-based-judgment.md`
- 設定: `.Codex/config/a8-report-automation.json`
- コア: `.Codex/scripts/ads/lib/{a8-report-browser,a8-report-csv}.mjs`
- 実行: `.Codex/scripts/ads/{fetch-a8-ui-csv,normalize-a8-csv,check-a8-report-due,check-a8-outcome-gate}.mjs`
- 成果 SSOT: `.Codex/state/metrics/affiliate/{a8-results.json,a8-report-log.json}`
- agent: `.Codex/agents/{a8-report-collector,a8-csv-auditor}.md`
- 隣接 skill: `/affiliate-operate` (提携運用) / `/scout-asp` (案件開拓)
