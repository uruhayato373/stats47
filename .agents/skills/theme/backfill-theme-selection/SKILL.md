---
name: backfill-theme-selection
description: ThemeCatalog の選定根拠 (selection) が定型文のままの primary/secondary 指標を、白書・省庁資料など一次資料で裏付けて adoptionCriteria 付きに埋める。対話では theme-researcher が調査し決定的 gate を通して書き込む。夜間は run-selection-backfill.sh が headless claude で無人実行する。
primary_agent: theme-designer
co_agents: theme-researcher
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

# backfill-theme-selection

`npm run validate:catalog` の `[no-adoption-criteria]` warn (2026-09-16 時点 542 件) を、**一次資料を実際に読んだ根拠**で
埋めるスキル。定型文で埋めるのではなく、資料が見つからない指標は未記入のまま残す (捏造が最悪の失敗)。

> 正典: `.claude/rules/theme-catalog-standards.md` §4 (selection / selection-evidence.ts の置き場) ・
> `.claude/todo/backlog.md` THEME-SELECTION-BACKFILL-01 / 委譲規約: `.claude/rules/model-prompting.md` ・
> `.claude/rules/agent-output-contract.md` (subagent は theme-researcher **最大 1 体**)

## 使い方

```
/backfill-theme-selection <theme-key>        # 対話: 1 テーマを調査 → gate → 書き込み
/backfill-theme-selection --targets          # 残件の一覧だけ
```

夜間の無人実行 (ユーザー端末で。Claude Code セッション内では claude CLI が Keychain を読めない):

```bash
bash .claude/scripts/themes/run-selection-backfill.sh --limit 3          # パイロット (3 テーマ)
bash .claude/scripts/themes/run-selection-backfill.sh                    # 全残件・並列 2・専用 worktree
bash .claude/scripts/themes/run-selection-backfill.sh --dry-run          # LLM を呼ばず配線だけ確認 (セッション内で可)
```

## 仕組み (対話でも夜間でも同じ 3 段)

```
1. prompt   node --import tsx .claude/scripts/themes/selection-backfill.mjs prompt --theme <key>
            → metric config の事実 (出典 / statsDataId / cdCat01 とその分類名 / 年) と禁止定型文を載せた指示
2. 調査     モデルが WebSearch / WebFetch で一次資料を読み、JSON (entries / skipped / roleRecommendations) を返す
            ★モデルはファイルを触らない。役割は「資料を読んで根拠を書く」だけ
3. apply    node --import tsx .claude/scripts/themes/selection-backfill.mjs apply --theme <key> --input <json>
            決定的 gate → 通過分だけ書く (インライン定義は <theme>.ts、expanded.ts 由来は selection-evidence.ts)
```

gate (`selection-backfill-core.mjs gateEntries`) が落とすもの:

| 理由 | 何を見るか |
|---|---|
| `quote-not-found` | `evidenceQuote` が sourceUrl の本文に無い (HTML は本文抽出、PDF は pdftotext があれば本文照合、無ければ到達性のみ) |
| `url-unreachable:<status>` | sourceUrl が https でないか HTTP 200 でない |
| `boilerplate:<句>` | `SELECTION_BOILERPLATE_PHRASES` (types.ts) が rationale / proposedBy に残っている |
| `code-mismatch` / `code-not-in-catalog` | `#A03503` 等のコードが metric config の cdCat01 と違う / pull 済み e-Stat カタログに無い |
| `criteria-empty` / `criteria-all` / `criteria-unknown` | adoptionCriteria が空 / 5 基準全部 / 語彙外 |
| `not-a-target` / `duplicate-entry` / `rationale-length` | 対象外の指標 / 同じ指標が 2 回 / 40〜400 字の範囲外 |

通過分は validator (`[selection-code-mismatch]` / `[selection-boilerplate]` / `[selection-source-required]` /
`[selection-criteria-all]`) でも二重に守られる。**role と rejectedCandidates は書かない** — role の意見は report に出すだけ。

## 対話手順 (Step 1〜4)

### Step 0: 残件を見る

```bash
node --import tsx .claude/scripts/themes/selection-backfill.mjs targets            # 全テーマ (残件の多い順)
node --import tsx .claude/scripts/themes/selection-backfill.mjs targets --theme <key> --json
```

### Step 1: 指示を作る

```bash
node --import tsx .claude/scripts/estat/catalog.mjs pull   # 初回 / 月次 (分類コードの照合に使う)
node --import tsx .claude/scripts/themes/selection-backfill.mjs prompt --theme <key> > /tmp/selection-<key>.prompt.md
```

### Step 2: theme-researcher へ委譲 (最大 1 体)

Agent tool で `theme-researcher` を 1 体だけ起動する。prompt は **Step 1 の出力をそのまま** 渡す
(Task Capsule と OUTPUT FORMAT が冒頭に固定されている。要約・省略しない)。末尾に次を足す:

```
出力 JSON を /tmp/selection-<key>.output.json に Write で保存し、chat には
「保存した / entries N 件 / skipped M 件」の 1 行だけ返す。
```

### Step 3: gate → 書き込み

```bash
node --import tsx .claude/scripts/themes/selection-backfill.mjs apply --theme <key> --input /tmp/selection-<key>.output.json --dry-run   # まず配置先と不合格理由を見る
node --import tsx .claude/scripts/themes/selection-backfill.mjs apply --theme <key> --input /tmp/selection-<key>.output.json             # 書く
npm run validate:catalog --workspace=@stats47/data-configs
npm run generate:catalog --workspace=@stats47/data-configs -- --check
```

`rejectedDetail` の理由が `quote-not-found` / `boilerplate` なら prompt の問題ではなく調査の質なので、
**同じテーマを再調査させる前に理由を researcher へ返す** (「引用は本文の逐語」「定型文禁止」)。

### Step 4: 記録

- `skippedDetail` (資料が見つからなかった指標) と `roleRecommendations` は、そのまま
  `.claude/skills/theme/manage-theme-portfolio/reference/audits/<日付>-selection-backfill.md` の該当節へ足す
  (夜間 run は自動で書く)。role を変える判断は theme-designer が別途行う
- warning ratchet の baseline (`.claude/config/quality-warning-baseline.json` の
  `theme-catalog:no-adoption-criteria`) を実測へ縮める (夜間 run は自動)

## 夜間 run の停止条件と翌朝の処理

- 停止: gate 不合格率 > 30% (10 件以上評価後) / 利用枠エラー 3 連続 (30 分待ち × 3) / `--max-budget-usd` 超過
- 翌朝: report の「gate 不合格」→ prompt か gate の問題を疑う (30% 超なら続行しない)、
  「資料なし」→ 人が資料を探すか context への降格を検討、「role の推奨」→ theme-designer 経由で判断
- 取り込み: worktree のブランチ `selection-backfill/<日付>` を develop へ ff-merge (script が末尾にコマンドを出す)

## 実測 (2026-09-16 パイロット)

tsunami-exposure 2 指標: 通過 2 / 不合格 0、15 turns、入力 128K トークン、$0.69 (API 換算)。
Agent tool 経路 (2026-09-16 aging-society: 1 テーマ 19 分・285K トークン) より軽い。
2 件とも PDF 出典で、pdftotext 経由の逐語照合が found。

## 関連

- core: `.claude/scripts/themes/selection-backfill-core.mjs` / CLI: `.claude/scripts/themes/selection-backfill.mjs` /
  driver: `.claude/scripts/themes/run-selection-backfill.sh`
- test: `node --import tsx --test .claude/scripts/themes/__tests__/selection-backfill-core.test.mjs`
- validator: `packages/data-configs/scripts/validate-theme-catalog.ts` (`validateSelectionEvidence`)
- 置き場: `packages/data-configs/src/theme-catalog/selection-evidence.ts` (expanded.ts 由来の指標専用・生成物)
