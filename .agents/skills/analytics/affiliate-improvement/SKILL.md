---
name: affiliate-improvement
description: アフィリエイト広告の impression / click / CTR を GA4 (affiliate_impression / affiliate_click) と在庫棚卸しで分析し、弱い枠を特定して改善施策を .Codex/todo/improvements.md に記録するループ。在庫の管理画面 (単体 HTML) を開く機能も持つ。Use when user says "アフィリエイト改善", "アフィリエイト分析", "imp/click 増やす", "広告クリック改善", "アフィリエイト管理画面", "管理画面を開いて", "アフィリエイト一覧見せて", "在庫見せて".
primary_agent: affiliate-manager
co_agents: [improvement-triage, adsense-analyst]
---

アフィリエイト広告の **impression / click / CTR を計測ベースで改善するループ**。

「在庫 (どこに何枠あるか)」と「実績 (GA4 で imp / click)」を突き合わせ、impression を取りこぼしている
カテゴリ / ページと、impression はあるが click されない (低 CTR) 枠を特定し、具体施策に落として記録する。

- **在庫 (SSOT)**: `apps/web/scripts/affiliate-ads-data.ts` (`AFFILIATE_ADS[]`, git TS / 完全DBレス)
- **配信**: `export-affiliate-ads-snapshot.ts` → R2 `app/affiliate-ads/all.json`
- **計測**: GA4 `affiliate_impression` (`AdImpressionTracker`, 50%+ 表示 1s) / `affiliate_click` (`TrackedAffiliateLink`)
- **棚卸し (決定的)**: `npx tsx .Codex/scripts/ads/audit-affiliate-inventory.ts`

## 記録先 (データ保存)

| 層 | 場所 | 用途 |
|---|---|---|
| 施策一覧 | `.Codex/todo/improvements.md` | AFF-NN 行の追加・status 更新 |
| agent 用詳細 | `.Codex/skills/analytics/affiliate-improvement/reference/improvement-log.md` | 検証コマンド・仮説・実測値・GA4 クエリ結果 |
| **集約状態 (機械・★入口)** | `.Codex/state/ads/affiliate-operations-latest.json` | 計測ゲート・freshness・coverage・直接配置・実験・推奨アクションの現在地 (`build-affiliate-operations-state.ts` が生成、週次 CI 自動更新) |
| **二層portfolio (機械・★判断入口)** | `.Codex/state/ads/affiliate-portfolio-latest.json` | program/offer/ad/placement、discovery/decision、確定収益、unknown理由、次の1件 |
| pilot readiness (機械) | `.Codex/state/ads/affiliate-pilot-readiness-latest.json` | 開始gate、必要母数、観測verdict。勝者は持たない |
| 在庫 snapshot (機械) | `.Codex/state/ads/inventory-*.json` | audit script が生成、ループの入力 |
| compliance snapshot (機械) | `.Codex/state/ads/compliance-latest.json` | 直接配置の孤立・PR 表記監査 (`/audit-affiliate-compliance`) |

> **status モードはまず集約状態を読む**: `affiliate-operations-latest.json` の `measurementGate` /
> `coverage` / `recommendedActions` が現在地。**在庫ゼロ軸や gap は SKILL に固定記載しない** — 必ず
> state から読む (値は変動する)。stale (freshness > 10d) なら
> `npx tsx .Codex/scripts/ads/build-affiliate-operations-state.ts` で再生成する。

> **確定収益を使う前にA8 outcome gateも読む**:
> `node .Codex/scripts/ads/check-a8-outcome-gate.mjs`。`blocked`では欠損・累計・stale・
> サイト分離不能を0成果へ丸めず、CTR改善と収益勝敗を分けて報告する。

> **効果判定を確定する前に必ず** `.Codex/rules/evidence-based-judgment.md` の実証チェックリストを通す。
> 想定値 / 実測値 / 取得コマンド / 経過日数なしに判定してTODO行を削除しない。

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status (デフォルト) : 最新の在庫棚卸し + 進行中施策 (AFF-NN) を要約
               - dashboard         : 管理画面 (単体 HTML) を再生成して開く / ユーザーに渡す
               - audit             : 在庫棚卸しのみ再実行 (vertical 10軸ギャップ + サイズ lint + 配置偏り)
               - observe           : GA4 imp/click を取得 → CTR 集計 → 弱枠特定 → 実測を追記
               - action            : 新しい施策行 (AFF-NN) を追加
               - portfolio         : 二層portfolio・outcome/measurement gate・次の1件を要約
               - classify          : 証拠がある未分類profileを1件だけ分類案として提示
               - next              : 次に着手すべき改善候補を提示
```

「アフィリエイト管理画面を開いて」「在庫一覧見せて」等の指示は **dashboard モード** に該当する。

## 手順

### Step 0: 管理画面を開く (dashboard モード)

ユーザーが「管理画面を開いて / アフィリエイト一覧見せて / 在庫見せて」と指示したら、最新 SSOT から
管理画面 HTML を再生成して開く (または渡す)。**いつでもこのモードだけ単独で実行してよい**。

```bash
npx tsx .Codex/scripts/ads/build-affiliate-dashboard.ts
# → /tmp/stats47-affiliate-dashboard.html (依存なし・自己完結の派生物。git 管理しない)
```

「開く」の意味は実行環境で分岐する (`.Codex/rules/branch-workflow.md` の実行環境判定と同じ):

| 環境 | 開き方 |
|---|---|
| ローカル (GUI あり) | 生成後 `open /tmp/stats47-affiliate-dashboard.html` (macOS) / `xdg-open …` (Linux) でブラウザ起動 |
| Codex on the web / クラウド (GUI なし) | 生成後 **SendUserFile でユーザーに HTML を渡す** (ブラウザは手元で開いてもらう) |
| CI (週次 `affiliate-dashboard-refresh.yml`) | workflow artifact `affiliate-dashboard` として保存 (commit しない) |

- 管理画面は read-only (確認用)。バナーの追加・変更は `/register-affiliate-banner` に委譲する。
- 在庫を更新した直後に開く場合は、先に `/register-affiliate-banner` で SSOT を更新 → 本モードで再生成。

### Step 1: 在庫棚卸し (audit)

```bash
npx tsx .Codex/scripts/ads/audit-affiliate-inventory.ts
```

出力で確認すること:
- **gapVerticals** (在庫ゼロの意図軸・10 vertical) ★広告解決の実軸 — ゼロ軸は audit 出力から読む (固定値を
  持たない)。この意図のページ (ranking/theme/blog) に意図一致広告が出ない → `/register-affiliate-banner propose` の対象
- **thinVerticals** (枠 ≤ 2) — 補充候補
- **gapCategories / thinCategories** (17 軸 e-Stat 分類) — 参考 (backbone。実配信は vertical で解決)
- **sizeViolations** — canonical(300×250/250×250/320×100/text) 以外。`error` tier は新規混入 (要是正)
- **配置偏り** — blog-bottom に集中していないか、高トラフィック page type に枠があるか

JSON は `.Codex/state/ads/inventory-latest.json` (`byVertical` / `coverage.gapVerticals` / `sizeViolations` を含む)。`--json` で stdout に JSON のみ。`--check-size` で非 canonical・非 legacy があれば exit 1 (pre-commit ゲート)。

### Step 2: GA4 実績取得 (observe モードのみ)

専用スクリプトで `affiliate_impression` / `affiliate_click` を (category × position) 別に取得する:

```bash
node .Codex/scripts/ads/fetch-affiliate-ga4.cjs 28   # 直近 28 日。snapshot → .Codex/state/ads/ga4-affiliate-<date>.json
```

- dimension: `eventName` + `customEvent:affiliate_vertical` (★canonical 10軸) + `customEvent:affiliate_category` + `customEvent:link_position`、metric: `eventCount`
- impression / click を pivot し (vertical × position) ごとに `CTR = click / impression` を算出。`hasVerticalBreakdown` が false なら `affiliate_vertical` 未登録 (rules §6 の手順で登録)

> ⚠ **2 つの前提** (満たさないと内訳が取れない):
> 1. **GA4 鍵**: `stats47-*.json` がリポジトリルートに必要。**クラウド / web 実行環境には鍵が無いため、
>    実測は GitHub Actions で行う** → `.github/workflows/affiliate-ga4-weekly.yml`
>    (週次 cron + `workflow_dispatch`)。シークレット `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` を鍵ファイルに
>    復元して `fetch-affiliate-ga4.cjs` を実行し、snapshot / portfolio / operations / pilot stateを
>    workflow artifactとして保存する。workflowはcommit/pushしない。
>    鍵のあるローカルなら直接 `node …` でも可。
> 2. **custom dimension 登録**: `affiliate_vertical` / `affiliate_category` / `link_position` を GA4 管理画面で
>    イベントスコープのカスタムディメンションとして登録済みでないと内訳が引けない (登録手順の正典:
>    `.Codex/rules/affiliate-ads-standards.md` §6)。未登録時はスクリプトが `eventName` 単位の総数に
>    フォールバックする (内訳は登録後に再取得)。

> 注: 外部連携トークンは `actions:write` を持たず `workflow_dispatch` を起動できない (403) ことがある。
> その場合は週次 cron の自動実行を待つか、`gh` の使えるローカルから dispatch する
> (`.Codex/rules/branch-workflow.md` の実行環境判定)。

### Step 3: CTR 集計 + 弱枠特定

(category, position) ごとに `CTR = affiliate_click / affiliate_impression` を算出し、
3 種の弱点を分類する。

> **★ imp=0 を「在庫不足」と即断しない (2026-08-04 の教訓)。**
> 広告を描画する 9 コンポーネントのうち 4 つが **クリックだけ送って impression を
> 送っていなかった**ため、native 枠が impression 内訳に 1 つも現れない状態が続いた。
> 「在庫はあるが imp=0」を見たら、**まず計装の有無を確認する**:
> `npx vitest run --root apps/web src/features/ads/__tests__/impression-tracking-contract.test.ts`
> (このテストが通っていれば計装漏れは無い = 在庫/配置の問題として扱ってよい)。
> 計装が原因なのに在庫を積むと、表示されない在庫だけが増える。

| 分類 | 条件 | 打ち手 |
|---|---|---|
| **impression ゼロ (機会損失)** | gapCategory / 在庫はあるが imp=0 **かつ計装は有る** | 在庫補充 (AFF-02) / 配置追加 (AFF-03) |
| **低 CTR (click されない)** | imp ≥ baseline かつ CTR < 全体中央値 | マッチング修正 / CTA 文言 / 位置 (AFF-04) |
| **高 CTR だが imp 少** | CTR 上位だが imp 少 | 同案件を高トラフィック枠へ拡大 |

baseline / 中央値は実測から決め、根拠を improvement-log に書く (推測で閾値を作らない)。

### Step 3.5: portfolio / classify / next

- `portfolio`: `npx tsx .Codex/scripts/ads/build-affiliate-portfolio-state.ts`を実行し、二層キュー、
  measurement/outcome/coverage gate、欠損理由、`recommendedActions[0]`だけを報告する。
- `classify`: `pending-classification`の先頭1件について、ASP詳細で成果条件・個人情報・連絡・支払い・
  出典URL・確認日を実機確認できた場合だけprofile更新案を作る。更新はaffiliate-managerの排他領域。
  条件を読めなければunknownのまま終了する。
- `next`: portfolioの`recommendedActions[0]`をそのまま提示する。モデルが別候補へ並べ替えない。

### Step 4: 施策の記録 (action モード)

`.Codex/todo/improvements.md` の該当Tierの6列表に1行を追加する:

```markdown
| AFF-NN | <次アクションを含む短い要約> | pending | YYYY-MM-DD | <owner> | affiliate |
```

target metric、deployed_at、関連PR、詳細 (仮説 / 検証コマンド / 想定値の根拠 / 実測) は
`reference/improvement-log.md` に
`.Codex/rules/evidence-based-judgment.md` の記入テンプレで書く。

### Step 5: 効果判定 (observe モードで before/after)

> **★2026-08-04 に計測の断絶がある。この日をまたぐ before/after 比較をしない。**
> 同日に (a) 未計装だった 4 コンポーネントへの impression 計装追加、(b) `affiliate_vertical`
> の汚染是正 (10 軸外の値が "other" として imp の 61% を占めていた)、(c) 枠の拡張
> (blog 本文 A/B・記事末尾・ranking/themes 末尾) を同時に入れた。
> **impression は増え CTR は下がる**が、これは実態の悪化ではなく分母が埋まった結果。
> 2026-08-04 より前の窓と数字を並べると誤った判定になる。
> 併せて `ad_impression` → `affiliate_impression` の改名 (2026-07-28) もあるため、
> **実質的に比較可能なのは 2026-08-04 以降どうし**だけ。

施策デプロイから 1〜4 週後に GA4 を再取得し、impression / CTR の before/after を比較。
実証チェックリストを通し、判定結果を `reference/improvement-log.md` に追記してから
`.Codex/todo/improvements.md` の該当行を削除する。是正が必要なら別IDを追加する。
TODOのwriteは排他的 writer の `improvement-triage` に委譲してもよい。

## 在庫追加・配置変更の実行委譲

このスキルは **分析と記録**が責務。実際の変更は専用スキルに委譲する:

- 新規バナー / 在庫補充 → `/register-affiliate-banner` (SSOT 追記 → develop push で `publish-affiliate-ads.yml` 自動反映)
- 収益直結記事の企画 → `/monetize-article`
- ランキング等へのバナー枠追加 (レンダリング変更) → 別 PR。`.Codex/rules/nextjs-ssg-preservation.md` 厳守 (SSG 崩さない)

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `.Codex/scripts/ads/audit-affiliate-inventory.ts` | 在庫棚卸し (決定的) |
| `.Codex/scripts/ads/build-affiliate-portfolio-state.ts` | 二層portfolio派生state |
| `.Codex/scripts/ads/build-affiliate-pilot-state.ts` | pilot readiness / verdict派生state |
| `.Codex/todo/improvements.md` | 人間向けactive施策一覧 (AFF-NN) |
| `reference/improvement-log.md` | agent 用詳細ログ |
| `apps/web/scripts/affiliate-ads-data.ts` | 在庫 SSOT |
| `apps/web/src/lib/analytics/events.ts` | GA4 計測イベント定義 |
| `apps/web/src/features/ads/` | 描画コンポーネント |
| `.Codex/skills/ads/register-affiliate-banner/SKILL.md` | バナー登録 (実行委譲先) |
| `.Codex/rules/evidence-based-judgment.md` | 効果判定確定前の実証ルール |
