---
name: gsc-coverage-remediation
description: GSC「ページ」インデックスカバレッジ (見つからない404 / ソフト404 / 5xx / クロール済未登録) を計画的に是正する閉ループ。Use when user says "GSCのカバレッジ", "インデックス未登録", "404が多い", "ソフト404", "見つかりませんでした", "カバレッジ是正". GSC UI export を取り込み→本番HTTP実測でA/B分類→SSOTキュー化→live観測(observe-after-fix)/薄さ確認→経過観測を1サイクルで回す。
primary_agent: gsc-analyst
co_agents: [improvement-triage]
---

GSC のインデックスカバレッジ問題 (404 / soft404 / 5xx / crawled-not-indexed) を **週次で計画的に順次是正**する閉ループ。
ブログ品質是正ループ (`.claude/rules/blog-remediation-loop.md`) と同型。「次に何を直すか・何をやったか・効いたか」を
**1 つの状態付きキュー**で追える。

> **本 SKILL がこのループの運用正典 (runbook)**。2026-07-12 に旧 `docs/02_実装計画/12` を統合し .claude に一本化。
> **SSOT (機械)**: `.claude/state/gsc/coverage-remediation-queue.json`。**人間向け要約**: `.claude/state/gsc/LATEST.md`。
> オーナー agent: `gsc-analyst` / status 更新: `improvement-triage`。

## 前提となる事実 (これを取り違えない)

- **404=8,378 / redirect=1,277 / robots=2,651 / noindex=1,434 の大半は「意図的削除・旧URL・設計上のブロック」**で、
  0 件にはできないし目標でもない。GSC は 410 も「404」に束ねる。Google の再クロールは遅く週〜月単位でしか減らない。
- **実際に直すべきは「sitemap/サイトが参照しているのに 404/soft404/5xx」= 生きてるのに誤登録された URL だけ**。
  これは本番 HTTP を実測すれば機械的に判別できる (現在 200 を返すか)。
- 効果判定は `.claude/rules/evidence-based-judgment.md` に従う (推測で effect/* を付けない)。

## ループ全体図

```
[1] ユーザーが GSC UI から export (週次・10分)  → ~/Downloads に zip
       ↓
[2] ingest-gsc-export.py        cp932 zip を正規化 → coverage-drilldown/<週>/<category>-drilldown.csv + category-totals.json
       ↓
[3] build-coverage-queue.mjs    本番 HTTP を Googlebot UA で実測 → A/B 分類 → coverage-remediation-queue.json (状態保持)
       │                         + LATEST.md + coverage-totals-history.csv (経過観測) + coverage-live-observe-urls.csv (curated)
       ↓
[4] 是正 (action 別):
       observe-after-fix(live) → sitemap/内部リンク/canonical を整備 → url-inspection-daily.cjs で coverageState を観測 (Indexing API 送信はしない・準拠是正 2026-07-23)
       content-check(soft) → gsc-analyst で薄さ/描画確認 → 補強 or noindex → 良ければ observe-after-fix 格上げ
       fix-5xx             → 実バグ修正 (PR)
       verify-intent(404)  → 旧URL/内部パスか確認。死亡が正なら resolved-by-design でマーク
       ↓
[5] 記録      improvement-log [COVERAGE-LOOP-01] + 改善バックログ status / build --mark-done
       ↓
[6] 経過観測  次週 export → ingest+build で件数減 (8378↓) と登録済↑ を totals-history で追う
```

## A/B 分類ロジック (build-coverage-queue.mjs)

actionable カテゴリ (404 / soft404 / 5xx / crawled / discovered) の URL を本番実測し、現在の HTTP で分類する:

| 現在 HTTP | 元カテゴリ | verdict | action |
|---|---|---|---|
| 200 | soft404 | live-soft404 | **content-check** |
| 200 | 404 / 5xx / crawled / discovered | live-misflagged | **observe-after-fix** |
| 410 | * | now-gone | none (放置・発生源修正済) |
| 3xx | * | now-redirect | none (放置) |
| 5xx | * | still-5xx | **fix-5xx** (最優先) |
| 404 | * | still-404 | **verify-intent** (旧URL/公開漏れ判別) |
| 0 | * | recheck | recheck |

意図的カテゴリ (redirect / robots / noindex / alt-canonical / duplicate) は実測せず `resolved-by-design` で放置。

## 命名規約 (observe-after-fix)

> **Indexing API 送信は 2026-07-23 に退役**（公式に JobPosting/BroadcastEvent VideoObject 専用。
> 準拠正典: `.claude/skills/analytics/search-growth/reference/platform-contract.md`）。
> 通常ページの再クロールは「送信」ではなく「直してから URL Inspection で観測 (observe-after-fix)」で行う。

build が本番 HTTP を Googlebot UA で実測して live-misflagged (404/5xx/crawled だが現在 200) を選別し
**`coverage-live-observe-urls.csv`** に書き出す。これは Indexing API 送信の入力ではなく、
sitemap 掲載・内部リンク・canonical を整えた上で `url-inspection-daily.cjs` で coverageState 遷移を観測する対象リスト。

- **生 drilldown は `<category>-drilldown.csv`** (観測対象にしない)。
- `content-check` (soft404) は **observe-after-fix に格上げするまで観測しない** (薄いまま観測しても indexed 化しない)。

## 実行手順

### Phase 0 — 前提確認
- ユーザーに「GSC UI から export 済みか」を確認。未取得なら `USER_EXPORT_GUIDE.md` Step 2/3 を案内
  (インデックス作成 > ページ → 各カテゴリを開いて右上エクスポート → `~/Downloads` へ)。
- export 不要で「キュー状態だけ見たい」なら Phase 3 の `--no-probe` か `--next` だけ実行。

### Phase 1 — 取り込み (ingest)
```bash
# (任意) UI export を Playwright で自動化する。カバレッジは公式 API が無く UI export しか経路がない。
# 初回だけ headed Chrome で人間が Google にログインする (認証情報はスクリプトが扱わない)。
node .claude/scripts/gsc/export-coverage-playwright.mjs --probe   # 初回: DOM 構造を確認
node .claude/scripts/gsc/export-coverage-playwright.mjs           # ~/Downloads へ zip を保存

python3 .claude/scripts/gsc/ingest-gsc-export.py        # ~/Downloads の GSC zip を自動検出・正規化
# 週を明示する場合: --week 2026-W25 / 日付指定: --date 2026-06-16
```

> **GSC UI export は 1 カテゴリ 1,000 行が上限**。404 / redirect / robots が 1,000 ちょうどで
> 頭打ちになるのはこのためで、取り込み漏れではない (手動 export でも同じ)。
> 総件数は `category-totals.json` 側で正しく取れる。
- cp932 ファイル名を復元し、カテゴリ判定して `coverage-drilldown/<週>/<category>-drilldown.csv` に保存。
- **生 drilldown は `-drilldown.csv`** (auto-resubmit は拾わない)。集計は `category-totals.json`、推移は `coverage-trend.csv`。

### Phase 2 — キュー構築 (本番 HTTP 実測)
```bash
node .claude/scripts/gsc/build-coverage-queue.mjs       # actionable URL を実測 → 分類 → upsert
# 高速 (実測せずキャッシュ): --no-probe   /  実測上限: --probe-limit 2500
```
- actionable カテゴリ (404 / soft404 / 5xx / crawled-not-indexed / discovered) のみ実測する。意図的カテゴリは放置。
- 状態 (pending / in-progress / done / resolved-by-design) を **upsert で保持**。done を毎回潰さない。

### Phase 3 — 報告
- `.claude/state/gsc/LATEST.md` を読み、ユーザーに「総件数 (意図的の内訳)」と「要対応 pending の action 別件数」を提示。
- `node .claude/scripts/gsc/build-coverage-queue.mjs --next 20` で次にやる actionable を JSONL で取得。

### Phase 4 — 是正 (action 別。gsc-analyst サブエージェントに委譲)

| action | 対応 | 委譲先 |
|---|---|---|
| `resubmit` | 既に curated CSV (`coverage-live-resubmit-urls.csv`) に出力済 → CI に送信を委ねる | (CI) |
| `content-check` | soft404 の薄さ/描画を確認。本当に thin なら content 補強 or `noindex`、十分なら resubmit 格上げ | **gsc-analyst** |
| `fix-5xx` | 実バグ。再現確認 → 修正 PR | gsc-analyst → 実装 |
| `verify-intent` | 旧URL/内部パス (`/tmp/*` `/.local/*` 等) か確認。死亡が正なら放置確定 | gsc-analyst |

`content-check` の大きな独立バッチだけを subagent 最大1体に委譲する (Agent tool,
`mode: bypassPermissions`)。`.claude/rules/model-prompting.md` と
`.claude/rules/agent-output-contract.md` に従い、Task Capsule と **OUTPUT FORMAT を prompt 冒頭に固定**する:
```
OUTPUT FORMAT: 1 markdown table only.
Columns: URL | thin? | 推奨 (resubmit/noindex/enrich) | 理由(≤10語)
No prose before/after.
TASK: 以下の soft404→現在200 の URL 群が「薄い/空」か判定。R2 観測値の年数・データ点数を確認。
```

### Phase 5 — 是正 (observe-after-fix・Indexing API 送信は退役)
- **live (observe-after-fix) は送信ではなく「直してから観測」**。Indexing API 送信は 2026-07-23 に退役した
  (公式に JobPosting/BroadcastEvent VideoObject 専用・準拠是正)。次を行う:
  1. sitemap 掲載整合 (`SITEMAP_RANKING_KEYS` / `sitemap.ts`)・内部リンク強化・canonical 是正・content 補強
  2. `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 50` で coverageState / lastCrawlTime を観測
- `coverage-live-observe-urls.csv` は観測対象の候補リスト (送信キューではない)。
- ローカルからの R2 push は禁止 (`_assert-ci-write` で停止)。

### Phase 6 — 記録 (真実源を更新)
- 完了した URL を done に: `node .claude/scripts/gsc/build-coverage-queue.mjs --mark-done <url> --wave-id 2026-MM-DD-coverage`
- `improvement-log.md` の `[COVERAGE-LOOP-01]` に「何をやったか」(送信件数・content-check 結果・fix-5xx PR) を追記。
- 改善バックログ `.claude/todo/04_改善バックログ.md` の `COVERAGE-LOOP-01` 行の status / 期日を更新 (improvement-triage)。
- **effect/* を付ける前に実証チェックリスト** (`evidence-based-judgment.md`): 送信した URL が次週 indexed 化したかを
  URL Inspection / totals-history で確認してからでないと effect/full を付けない。

### Phase 7 — 経過観測 (次サイクルの起点)
- 次週ユーザーが再 export → Phase 1-2 を再実行。`coverage-totals-history.csv` に週次の件数が積まれる。
- 判定指標: **404・soft404 の総件数が減少**、**登録済みが増加**、**resubmit した URL が indexed 化**。
- done だった URL が再び壊れて検出されたら自動で再 actionable 化される (5xx 再発は pending に戻す)。

## 真実源とファイル

| 役割 | パス | 書く / 読む |
|---|---|---|
| **状態付きキュー (SSOT・機械)** | `.claude/state/gsc/coverage-remediation-queue.json` | build が書く / skill・agent が読む |
| 人間向け要約 | `.claude/state/gsc/LATEST.md` | build が書く / 人間が読む |
| 経過観測 (週次件数) | `.claude/state/gsc/coverage-totals-history.csv` | build が追記 |
| 取り込み済 drilldown | `.claude/state/metrics/gsc/coverage-drilldown/<週>/*-drilldown.csv` | ingest が書く |
| observe-after-fix 対象 | `.claude/state/metrics/gsc/coverage-drilldown/<週>/coverage-live-observe-urls.csv` | build が書く / url-inspection で観測 |
| agent 用詳細ログ | `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` `[COVERAGE-LOOP-01]` | skill/agent |
| TODO 真実源 | `.claude/todo/04_改善バックログ.md` `COVERAGE-LOOP-01` | improvement-triage |

## cadence (週次)

**自動 (CI)**: `fetch-metrics-weekly.yml` (日曜 20:00 JST) が **Phase 2 のキュー再構築を毎週回す**
(`build-coverage-queue.mjs` → `.claude/state/gsc/` を develop へ commit-back)。
本番 HTTP 実測は認証不要なので、新しい export が無くても **verdict は毎週最新化される**
(直した URL が 200/410 になったかが自動で反映される)。失敗時は `[Coverage Alert]` Issue
(`coverage-alert,auto-generated`) を起票し、次回成功で自動クローズする。
step には `timeout-minutes: 12` を置き、probe が長引いても週次計測本体を道連れにしない。

**手動 (ローカル)**: **Phase 1 の export だけは CI で回せない**。GSC UI export は
Google ログイン済み Playwright profile を要求し、GitHub Actions に持ち込めないため
(A8 / note / KDP 系と同じ制約)。月次を目安にオーナーがローカルで
`export-coverage-playwright.mjs` → `ingest-gsc-export.py` を実行して drilldown を更新する。

- `/weekly-review` 前にユーザーが export (10分) → 本スキルで取り込み・是正。
- 自動アーム (CI・既存): `gsc-url-inspection-daily.yml` (個別URL状態=observe-after-fix 観測) が毎日稼働。`gsc-auto-resubmit-daily.yml` は 2026-07-23 退役 (Indexing API 送信しない)。
  本スキルの週次手動アームは「UI export でしか取れない総件数・未把握URL」を補う (API は自サイト視点のみ)。

## 関連
- 運用正典: 本 SKILL（2026-07-12 に旧 GSC カバレッジ是正計画を統合。旧版は Git 履歴）
- 同型: `.claude/rules/blog-remediation-loop.md` (ブログ品質是正ループ)
- 実測判定: `.claude/rules/evidence-based-judgment.md`
- export 手順 (手動): `.claude/skills/analytics/gsc-improvement/reference/USER_EXPORT_GUIDE.md`
- export 自動化 (Playwright): `.claude/scripts/gsc/export-coverage-playwright.mjs`
  — カバレッジは公式 API が無く UI export しか経路がないため
  (google-admin README「公式 API がないものだけローカル headed Playwright に残す」に該当)。
  初回のみ人間が Google にログインする。保存名は消費側 `ingest-gsc-export.py` の
  `is_gsc_zip()` が拾える形に揃える。遮断ページは fail-closed で停止する
- agent: `gsc-analyst` (実行) / `improvement-triage` (status 更新)
