---
name: research-theme-catalog
description: テーマページ (/themes/*) の指標×チャート候補を白書 (NotebookLM)・Web 競合・GSC 検索需要から調査し、provenance 付きの提案を指標バックログに書き出す。theme-researcher が実行。新規テーマの立ち上げ調査や既存テーマの指標拡充検討に使う。
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch, Agent
---

# research-theme-catalog

テーマの「何を、どのチャートで、なぜ載せるか」の**素材を調査して提案する**スキル。
採否判断・カタログ実装は行わない (theme-designer / theme-component-builder の責務)。

> 正典規約: `.claude/rules/theme-catalog-standards.md` / 実行 agent: `.claude/agents/theme-researcher.md`

## 使い方

```
/research-theme-catalog <theme-key>      # 例: /research-theme-catalog manufacturing
```

## 前提の確認 (Step 0)

```bash
# 既存カタログ / IndicatorSet の現状を把握 (何が既に載っているか)
cat packages/data-configs/src/theme-catalog/<theme>.ts 2>/dev/null \
  || cat packages/types/src/indicator-sets/<theme>.ts   # legacy テーマ
# 既存チャート
cat apps/web/scripts/data/page-components/theme/<theme>.json
```

## Stage 1: 素材収集 (並列 fan-out・各 subagent に Template A 出力契約を強制)

3 つを**並列**で回す。各 subagent の prompt 冒頭に OUTPUT FORMAT (Template A) を必ず置く
(`.claude/rules/agent-output-contract.md`)。

### 1a. NotebookLM 白書クエリ (文書読解を Google 側にオフロード)

```bash
# 台帳で対象テーマの白書ノートブックを確認
cat .claude/skills/theme/research-theme-catalog/reference/notebooks.md

# 対象テーマの白書に問う (引用付き回答だけ受領・PDF はコンテキストに載せない)
node .claude/scripts/notebooklm-cross-query.mjs \
  --notebooks "<対象白書ノートブック名>" \
  "<theme> の地域差・都道府県間格差を示す統計指標と、その根拠データを列挙してください。出典の統計名も。"
```

- 対象テーマの白書が**未登録**なら `notebooklm-notebook-builder.mjs find-or-create` で作成し、
  白書 PDF を `add-source` → **台帳 `reference/notebooks.md` を更新**する。
- 白書カバレッジが無い/薄いテーマは system skill `deep-research` を**質問を絞って**代替に使う。

### 1b. 競合ダッシュボード調査 (WebSearch / WebFetch)

todo-ran / RESAS / e-Stat ダッシュボード / uub の同テーマページを調べ、**採用されている指標と可視化形式**を抽出。
`/design-theme-charts` の競合調査部と同じ観点。感情煽り路線には寄せない (信頼性×網羅性で差別化)。

### 1c. GSC 検索需要 (API を再取得しない)

```bash
# 既存 snapshot CSV からテーマ関連クエリの impressions/CTR を grep
grep -iE "<theme 関連キーワード>" \
  .claude/skills/analytics/gsc-improvement/reference/snapshots/*/queries.csv | sort -t',' -k3 -rn | head -20
```

## Stage 2: 実在検証 (estat-researcher に委譲)

Stage 1 で挙がった候補 rankingKey / 統計表を estat-researcher に渡し、
**METRICS_REGISTRY 実在 + e-Stat 統計表の実在**を確認させる (AI 生成 key は実在と乖離しがち)。

```bash
# 既登録かの一次チェック (登録済みなら投入不要)
grep -c '"<candidate-key>":' packages/data-configs/src/registry.ts
```

- 登録済み → そのまま採用候補
- 未登録だが e-Stat に実在 → `要ingest` (採択時 data-ingester が投入)
- e-Stat に不在 → 不採用 (rejectedCandidates 行き)

## Stage 3: 統合・提案 (05_指標バックログ.md へ append)

`docs/02_実装計画/05_指標バックログ.md` にテーマ節を append (append-only)。フォーマットは
`.claude/agents/theme-researcher.md` の「提案の出力先フォーマット」に従う。各候補に:
`rankingKey / shortLabel / 推奨 role / 推奨チャート (componentType) / 出典 (proposedBy+URL) / e-Stat実在 / verdict`。

## 完了後の引き継ぎ (このスキルの外)

```
提案 (05_指標バックログ.md)
  → 人間レビューで採否決定
  → theme-designer が採択分を catalog TS 化 (packages/data-configs/src/theme-catalog/<theme>.ts)
     + THEME_CATALOGS 登録 + npm run generate:catalog + validate:catalog
  → theme-component-builder が componentProps (estatParams 等) を詳細化
  → data-ingester が未登録指標を e-Stat → R2 投入
```

## モデル役割分担 (トークン節約)

| 役割 | モデル |
|---|---|
| Stage 1 収集 subagent (NotebookLM/競合/GSC) | sonnet (Template A で圧縮) |
| Stage 2 実在検証 (estat-researcher) | sonnet (既存) |
| 統合・提案文書化 (theme-researcher 本体) | sonnet |
| 提案採否・カタログ設計 | メインセッション (上位モデル) |

## 関連

- 規約: `.claude/rules/theme-catalog-standards.md`
- agent: `.claude/agents/theme-researcher.md`
- 白書台帳: `reference/notebooks.md`
- 後続スキル: `/design-theme-charts` (チャート設計) / `/insert-theme-components` (反映) / `/audit-theme-components` (監査)
