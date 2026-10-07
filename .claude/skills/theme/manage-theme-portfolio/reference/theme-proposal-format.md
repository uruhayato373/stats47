---
type: agent-reference
date: 2026-10-07
status: operational
tags: [theme-catalog, metrics, charts, proposal, editorial-workflow]
---

# テーマ改善の提案文書の形式

1 テーマの指標・図・カード・章を見直すときに書く提案文書の固定形式。2026-10-06 に aging-society・
fishery-marine・local-economy の 3 テーマをこの形で提案し、承認を得てから実装した。
流れ全体と担当は `theme-improvement-execution.md`、カタログの規約は `.claude/rules/theme-catalog-standards.md` が正典。

## 判断の基準

指標を選ぶ視点は `config/theme-selection-viewpoints.json` が正本で、管理画面
`/quality/theme-viewpoints` で全テーマの該当箇所を見られる。提案の「理由」列には、どの視点で判断したかを
視点の id (例: `card-chart-duplicate`) か、その規則の言葉で書く。視点に無い判断をしたら、提案のあとで
視点の JSON に足すかをオーナーに確かめる (提案の中で黙って新しい基準を作らない)。

## 次のテーマの選び方

管理画面 `/quality/theme-viewpoints` の「次に見直す候補」を上から取る。並びは最新の GSC 週次スナップショット (28 日) の
表示回数の多い順で、直す候補・確かめる候補の件数と最新の提案・公開の目安 (進行中の実験の d56) を横に出す。
30 日以内の承認待ちと公開待ちのテーマは下に分けてある。表示回数が近いときは、直す候補の多い方を先にする。
「該当件数の推移」は週次のテーマ監査 (`npm run theme:portfolio:audit`) が記録し、直したぶん減っているかを見る。

## 提案に使う effort

2026-10-07 の canary (`.claude/scripts/model-usage/canary-fixtures/theme-designer.json`、見直し前の local-economy から
承認済みの 8 判断を当てる課題) で、Opus 5.5 の medium は high と同じ recall 0.81 で、費用は 32% 低かった
(`.claude/state/metrics/model-usage/canary/2026-10-07-theme-designer-claude-opus-5-5-high-vs-claude-opus-5-5-medium.json`)。
提案も実装も medium を既定にする。両方の effort で落ちやすいのは「他テーマの主指標を一覧からも外す」と
「総額は人口の多い県ほど大きいと注記する」の 2 つで、どちらも視点 (`owned-elsewhere`・`scale-vs-rate`) に書いてあるので、
提案の前に `config/theme-selection-viewpoints.json` を読む。

## 置き場と状態

- 置き場: `reference/reviews/YYYY-MM-DD-theme-<key>.md` (1 テーマ 1 文書)。前の版があれば frontmatter の `supersedes` に書く。
- frontmatter: `type: theme-catalog-review` / `date` / `status` / `theme` / `supersedes` / `tags`。
- `status` は `proposal-ready` (承認待ち) → `implemented-pending-release` (実装済み・未公開) と進める。
  公開後の効果は `data/themes/experiments.json` の実験が持つので、文書の状態はそこで止める。
- 承認前は catalog と metric config を編集しない。

## 本文の形 (この順)

1. **結論** — 何が問題で何を変えるかを 2〜4 段落で。最初の 1 文で一番大きい変更を言う。
2. **Theme brief** (表) — 主読者 / 主問 / 比較軸 / 誤読リスク / baseline (GSC 28 日のクリック・表示・CTR・掲載順位と出典の snapshot パス)。
   検索需要の補足は queries.csv の該当クエリ数と表示数で書く。
3. **現行の構成** (表) — `順 | 章 (key) | カード | チャート`。最後に指標数 (primary / secondary / context) を書く。
4. **表 1: 現行指標** — `rankingKey | 現行 | 提案 | 年 | 理由`。
   - 提案は keep / remove / 追加 / role 変更 / `years` 拡張。年は config の登録年と、e-Stat の実在年 (`getStatsData` で確かめた範囲と確認日) を並べる。
   - remove は「別テーマに主担当がある」「推移を描けない」など視点で理由を書く。
5. **表 2: 現行チャート・カード・章** — 3 つの小表に分ける。
   - チャート: `componentKey | 提案 | 理由 / 実装差分`。
   - カード: `key | 提案 | 内容` (new / revise / merge。merge は残す key と `comparisonYear` を書く)。
   - 章: `順 | 章 | 提案` (改題・説明文の追加・章ごと外す)。
6. **表 3: 不採用候補** — `rankingKey / 候補 | reason | reconsider condition`。rankingKey が実在する候補は、実装時に catalog の `rejectedCandidates` にも残す。
7. **想定実装差分と検証** — 編集するファイル、R2 に影響するもの (page-components・観測値)、件数基準の更新、検証コマンド、デプロイの条件。
8. **採用決定** — 承認前は「ユーザー承認待ち」と判断が要る点を番号付きで書く。実装後は承認日・実装した branch / PR・
   選定根拠の出典・warning の増減・件数基準と調査紐付け ratchet の変更を書く。

## 実装後の検証 (この順)

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs          # error 0・warning を増やさない
npx tsx packages/data-configs/scripts/update-theme-catalog-baseline.ts   # 図・指標の件数基準。意図した変更なら --write
npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts --check
npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --check
npm run build --workspace=web && (cd apps/web && npx next start -p 3100)   # 別の端末で起動したまま
node .claude/scripts/themes/capture-theme-page.mjs <themeKey>            # 5 幅の確認と章ごとの画像
```

- 選定根拠は `/backfill-theme-selection` の gate (引用の逐語一致・URL の 200) を通してから書く。
- 調査紐付けの下限 (`.claude/config/survey-taxonomy-ratchet.json`) は図やカードを外した分だけ下げ、
  `themeBaselineFollowUps` に外した key と理由を記録する (`.claude/rules/survey-linkage-standards.md` §3)。
- `capture-theme-page.mjs` の `afterLastChapter` に外した図が出るのは、R2 の page-components が旧版のとき。
  公開時に R2 と一緒に反映すれば消える。カタログの図が `missingCharts` に出るのも同じ理由で、R2 へ反映する前は想定どおり。
- metric config の `years` を広げたときは、R2 の観測値の再取得 (`data-refresh.yml`) がデプロイと同じ承認で要る。
  反映まではカードが登録済みの年だけを描く。
