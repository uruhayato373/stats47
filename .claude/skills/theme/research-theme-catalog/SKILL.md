---
name: research-theme-catalog
description: テーマページ (/themes/*) の指標×チャート候補を白書 (NotebookLM)・Web 競合・GSC 検索需要から調査し、provenance 付きの提案を指標バックログに書き出す。theme-researcher が実行。新規テーマの立ち上げ調査や既存テーマの指標拡充検討に使う。
primary_agent: theme-researcher
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

# research-theme-catalog

テーマの「何を、どのチャートで、なぜ載せるか」の**素材を実際に調査して検証済み提案を出す**スキル。
採否判断・カタログ実装は行わない (theme-designer / theme-component-builder の責務)。

> 正典規約: `.claude/rules/theme-catalog-standards.md` / 実行 agent: `.claude/agents/theme-researcher.md` /
> 呼び元がAgent toolを使う場合: `.claude/rules/model-prompting.md` /
> `.claude/rules/agent-output-contract.md` (最大1体)

## ★ 実証原則 (これを破った提案は呼び元が破棄する)

以下の Stage は「説明」ではなく**実際に実行するアクション**。tool を 1 つも呼ばずに提案を出すのは失敗
(2026-07-04 に 0-tool 捏造事故あり)。**未検証の候補・実行していない調査方法・推測 URL を書かない**
(`.claude/rules/evidence-based-judgment.md`)。e-Stat 実在は必ず解決してから返す (「未確認」を残さない)。

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

## Stage 1: 素材収集 (同一セッションの並列 tool call)

3 つを同一セッションで並列に収集する。数回の query / read で終わるため subagent は起動しない。

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

## Stage 2: 実在確認 (必須・inline。estat-researcher サブ agent を spawn しない)

Stage 1 で挙がった候補を **自分で解決する**。estat-researcher を background で起動して待つと自分の turn が
synthesize せず終わる事故が続いたため (2026-07-04)、**サブ agent 委譲は使わず inline に調べる**。

```bash
# (a) 既登録かの一次チェック (登録済みなら投入不要)
grep -c '"<candidate-key>":' packages/data-configs/src/registry.ts
# (b) 既知 Gap は backlog に statsDataId 付きで documented なことがある (再利用可)
grep -iE "<theme 関連語>" .claude/todo/06_指標バックログ.md
```

- 登録済み (`✅登録済`) → そのまま採用候補
- 未登録 → 自分で e-Stat を WebFetch/検索して **statsDataId + cdCat01 を突き止める**:
  - 自分で確認できた (`✅e-Stat実在(自分で確認)`) → `要ingest` 採用候補 (statsDataId を明記)
  - statsDataId は分かるが確信が持てない → `要呼び元検証(statsDataId=X)` (呼び元が最終確定)
  - e-Stat に不在 / statsDataId すら不明 (`❌不在`) → **不採用** (rejectedCandidates 行き)

## Stage 3: 統合・提案

`.claude/todo/06_指標バックログ.md` の7列候補表へ、実在確認に合格した候補だけを追加する。フォーマットは
`.claude/agents/theme-researcher.md` の「提案の出力先フォーマット」に従う。不採用・unknown・重複候補は追加しない。

## ★ 呼び元の受け入れ検証 (捏造を機械的に弾く・書き込み前に必須)

theme-researcher を Agent tool で呼ぶ場合、呼び元は報告が指す一次資料と決定的gateを使う。
1つでも失格なら提案を保存せず、失格IDと不足証拠を記録して停止する。同じtaskの再実行を
検証手段にしない。

1. **tool_uses メタ**: 完了通知の `tool_uses` が **0 なら即破棄** (何も調査していない = 捏造)。
2. **self-audit 行**: `未検証候補=0` か。0 でなければ破棄。
3. **statsDataId のスポット検証**: 未登録候補から 1〜2 件選び、その statsDataId が e-Stat に実在するか
   呼び元が自分で確認する (`/inspect-estat-meta <statsDataId>` or `curl` e-Stat API)。実在しなければ破棄。
4. 合格したら呼び元が backlog へ append (同一ファイルへの並列書込を避けるため、agent には返させ呼び元が書く)。

## 完了後の引き継ぎ (このスキルの外)

```
提案 (06_指標バックログ.md)
  → 人間レビューで採否決定
  → theme-designer が採択分を catalog TS 化 (packages/data-configs/src/theme-catalog/<theme>.ts)
     + THEME_CATALOGS 登録 + npm run generate:catalog + validate:catalog
  → theme-component-builder が componentProps (estatParams 等) を詳細化
  → data-ingester が未登録指標を e-Stat → R2 投入
```

## モデル役割分担 (トークン節約)

| 役割 | モデル |
|---|---|
| Stage 1 収集 (NotebookLM/競合/GSC) | theme-researcher が tool を直接実行 |
| Stage 2 実在検証 (estat-researcher) | sonnet (既存) |
| 統合・提案文書化 (theme-researcher 本体) | sonnet |
| 提案採否・カタログ設計 | メインセッション (上位モデル) |

## 関連

- 規約: `.claude/rules/theme-catalog-standards.md`
- agent: `.claude/agents/theme-researcher.md`
- 白書台帳: `reference/notebooks.md`
- 後続スキル: `/design-theme-charts` (チャート設計) / `/insert-theme-components` (反映) / `/audit-theme-components` (監査)
