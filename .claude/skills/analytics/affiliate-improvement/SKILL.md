---
name: affiliate-improvement
description: アフィリエイト広告のimpression/click/CTRをGA4(ad_impression/affiliate_click)と在庫棚卸しで分析し、弱い枠を特定して改善施策を改善バックログに記録するループ。在庫管理画面(単体HTML)を開く機能も持つ。Use when user says "アフィリエイト改善", "アフィリエイト分析", "広告クリック改善", "アフィリエイト管理画面", "在庫見せて".
primary_agent: adsense-analyst
co_agents: [improvement-triage]
---

アフィリエイト広告の **impression / click / CTR を計測ベースで改善するループ**。

「在庫 (どこに何枠あるか)」と「実績 (GA4 で imp / click)」を突き合わせ、impression を取りこぼしている
カテゴリ / ページと、impression はあるが click されない (低 CTR) 枠を特定し、具体施策に落として記録する。

- **在庫 (SSOT)**: `apps/web/scripts/affiliate-ads-data.ts` (`AFFILIATE_ADS[]`, git TS / 完全DBレス)
- **配信**: `export-affiliate-ads-snapshot.ts` → R2 `app/affiliate-ads/all.json`
- **計測**: GA4 `ad_impression` (`AdImpressionTracker`, 50%+ 表示 1s) / `affiliate_click` (`TrackedAffiliateLink`)
- **棚卸し (決定的)**: `npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts`

## 記録先 (データ保存)

| 層 | 場所 | 用途 |
|---|---|---|
| 施策一覧 | `docs/02_実装計画/03_改善バックログ.md` | AFF-NN 行の追加・status 更新 |
| agent 用詳細 | `.claude/skills/analytics/affiliate-improvement/reference/improvement-log.md` | 検証コマンド・仮説・実測値・GA4 クエリ結果 |
| 在庫 snapshot (機械) | `.claude/state/ads/inventory-*.json` | audit script が生成、ループの入力 |

> **effect/* を付ける前に必ず** `.claude/rules/evidence-based-judgment.md` の実証チェックリストを通す。
> 想定値 / 実測値 / 取得コマンド / 経過日数なしに effect/full・effect/partial を付けない。

## 引数

```
$ARGUMENTS — [mode]
             mode:
               - status (デフォルト) : 最新の在庫棚卸し + 進行中施策 (AFF-NN) を要約
               - dashboard         : 管理画面 (単体 HTML) を再生成して開く / ユーザーに渡す
               - audit             : 在庫棚卸しのみ再実行 (17 軸ギャップ + 配置偏り)
               - observe           : GA4 imp/click を取得 → CTR 集計 → 弱枠特定 → 実測を追記
               - action            : 新しい施策 section (AFF-NN) を追加
               - next              : 次に着手すべき改善候補を提示
```

「アフィリエイト管理画面を開いて」「在庫一覧見せて」等の指示は **dashboard モード** に該当する。

## 手順

### Step 0: 管理画面を開く (dashboard モード)

ユーザーが「管理画面を開いて / アフィリエイト一覧見せて / 在庫見せて」と指示したら、最新 SSOT から
管理画面 HTML を再生成して開く (または渡す)。**いつでもこのモードだけ単独で実行してよい**。

```bash
npx tsx .claude/scripts/ads/build-affiliate-dashboard.ts
# → docs/40_アフィリエイト管理/affiliate-dashboard.html (依存なし・自己完結)
```

「開く」の意味は実行環境で分岐する (`.claude/rules/branch-workflow.md` の実行環境判定と同じ):

| 環境 | 開き方 |
|---|---|
| ローカル (GUI あり) | 生成後 `open docs/40_アフィリエイト管理/affiliate-dashboard.html` (macOS) / `xdg-open …` (Linux) でブラウザ起動 |
| Claude Code on the web / クラウド (GUI なし) | 生成後 **SendUserFile でユーザーに HTML を渡す** (ブラウザは手元で開いてもらう) |

- 管理画面は read-only (確認用)。バナーの追加・変更は `/register-affiliate-banner` に委譲する。
- 在庫を更新した直後に開く場合は、先に `/register-affiliate-banner` で SSOT を更新 → 本モードで再生成。

### Step 1: 在庫棚卸し (audit)

```bash
npx tsx .claude/scripts/ads/audit-affiliate-inventory.ts
```

出力で確認すること:
- **gapCategories** (広告ゼロ軸) — 該当 categoryKey のページは impression がゼロ → 在庫補充候補
- **thinCategories** (枠 ≤ 2) — 補充候補
- **配置偏り** — blog-bottom に集中していないか、高トラフィック page type に枠があるか

JSON は `.claude/state/ads/inventory-latest.json`。`--json` で stdout に JSON のみ。

### Step 2: GA4 実績取得 (observe モードのみ)

専用スクリプトで `ad_impression` / `affiliate_click` を (category × position) 別に取得する:

```bash
node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28   # 直近 28 日。snapshot → .claude/state/ads/ga4-affiliate-<date>.json
```

- dimension: `eventName` + `customEvent:affiliate_category` + `customEvent:link_position`、metric: `eventCount`
- impression / click を pivot し (category × position) ごとに `CTR = click / impression` を算出

> ⚠ **2 つの前提** (満たさないと内訳が取れない):
> 1. **GA4 鍵**: `stats47-*.json` がリポジトリルートに必要。**クラウド / web 実行環境には鍵が無いため、
>    実測は GitHub Actions で行う** → `.github/workflows/affiliate-ga4-weekly.yml`
>    (週次 cron + `workflow_dispatch`)。シークレット `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` を鍵ファイルに
>    復元して `fetch-affiliate-ga4.cjs` を実行し、snapshot を develop に commit-back する。
>    鍵のあるローカルなら直接 `node …` でも可。
> 2. **custom dimension 登録**: `affiliate_category` / `link_position` を GA4 管理画面で
>    イベントスコープのカスタムディメンションとして登録済みでないと内訳が引けない。
>    未登録時はスクリプトが `eventName` 単位の総数にフォールバックする (内訳は登録後に再取得)。

> 注: 外部連携トークンは `actions:write` を持たず `workflow_dispatch` を起動できない (403) ことがある。
> その場合は週次 cron の自動実行を待つか、`gh` の使えるローカルから dispatch する
> (`.claude/rules/branch-workflow.md` の実行環境判定)。

### Step 3: CTR 集計 + 弱枠特定

(category, position) ごとに `CTR = affiliate_click / ad_impression` を算出し、3 種の弱点を分類する:

| 分類 | 条件 | 打ち手 |
|---|---|---|
| **impression ゼロ (機会損失)** | gapCategory / 在庫はあるが imp=0 | 在庫補充 (AFF-02) / 配置追加 (AFF-03) |
| **低 CTR (click されない)** | imp ≥ baseline かつ CTR < 全体中央値 | マッチング修正 / CTA 文言 / 位置 (AFF-04) |
| **高 CTR だが imp 少** | CTR 上位だが imp 少 | 同案件を高トラフィック枠へ拡大 |

baseline / 中央値は実測から決め、根拠を improvement-log に書く (推測で閾値を作らない)。

### Step 4: 施策の記録 (action モード)

`docs/02_実装計画/03_改善バックログ.md` に新 section を追加 (INDEX.md の frontmatter 規約準拠):

```markdown
## [AFF-NN] タイトル

- **status**: pending | in-progress | effect/full | effect/partial | effect/none | effect/adverse
- **tier**: 1 | 2 | 3
- **target_metric**: affiliate/impression | affiliate/ctr | affiliate/click | affiliate/inventory
- **owner**: claude | uruhayato373
- **deployed_at**: YYYY-MM-DD
- **due**: YYYY-MM-DD
- **verification_command**: <copy-pasteable>
- **related_pr**: #N
```

詳細 (仮説 / 検証コマンド / 想定値の根拠 / 実測) は `reference/improvement-log.md` に
`.claude/rules/evidence-based-judgment.md` の記入テンプレで書く。

### Step 5: 効果判定 (observe モードで before/after)

施策デプロイから 1〜4 週後に GA4 を再取得し、impression / CTR の before/after を比較。
実証チェックリストを通してから `docs/02_実装計画/03_改善バックログ.md` の status を effect/* に更新する。
status 更新は排他的 writer の `improvement-triage` に委譲してもよい。

## 在庫追加・配置変更の実行委譲

このスキルは **分析と記録**が責務。実際の変更は専用スキルに委譲する:

- 新規バナー / 在庫補充 → `/register-affiliate-banner` (SSOT 追記 → develop push で `publish-affiliate-ads.yml` 自動反映)
- 収益直結記事の企画 → `/monetize-article`
- ランキング等へのバナー枠追加 (レンダリング変更) → 別 PR。`.claude/rules/nextjs-ssg-preservation.md` 厳守 (SSG 崩さない)

## 関連ファイル

| ファイル | 役割 |
|---|---|
| `.claude/scripts/ads/audit-affiliate-inventory.ts` | 在庫棚卸し (決定的) |
| `docs/02_実装計画/03_改善バックログ.md` | 人間向け施策ログ (AFF-NN) |
| `reference/improvement-log.md` | agent 用詳細ログ |
| `apps/web/scripts/affiliate-ads-data.ts` | 在庫 SSOT |
| `apps/web/src/lib/analytics/events.ts` | GA4 計測イベント定義 |
| `apps/web/src/features/ads/` | 描画コンポーネント |
| `.claude/skills/ads/register-affiliate-banner/SKILL.md` | バナー登録 (実行委譲先) |
| `.claude/rules/evidence-based-judgment.md` | effect/* 付与前の実証ルール |
