---
name: whitepaper-chart-inventory
description: 11 種の白書 (NotebookLM ノートブック) から「実描画されているチャート」を逆引き抽出し、`.Codex/skills/analytics/whitepaper-chart-inventory/reference/inventory/<wp-slug>.md` にチャート一覧を整理する。後段の e-Stat 紐付け・area/theme 配置決定の入力となる。Use when user says "白書チャート逆引き", "whitepaper chart inventory", "/whitepaper-chart-inventory".
primary_agent: performance-auditor
---

白書 PDF に描画されているチャート (図表) を **専門家が選定した「重要な統計の可視化」のフィルター済みリスト** として抽出し、stats47 のチャート設計 (`page_components`, `theme_metrics`) の入力にする。

e-Stat 全件 enumeration (~6000 statsDataId) より信号/雑音比が 1 桁高い。白書 11 冊 × ~50 chart = 推定 ~550 chart のうち、未取込が ~70% (~350 件) 存在する想定。

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 進捗 index | git: `.Codex/skills/analytics/whitepaper-chart-inventory/reference/inventory/README.md` | 11 白書の status を 1 ファイルで俯瞰 |
| 各白書 chart 一覧 | git: `.Codex/skills/analytics/whitepaper-chart-inventory/reference/inventory/<wp-slug>.md` | 1 白書 = 1 ファイル、人間レビュー対象 |
| テンプレート | git: `.Codex/skills/analytics/whitepaper-chart-inventory/reference/inventory/TEMPLATE.md` | 各白書 MD の統一フォーマット |
| query 履歴 (agent 用) | git: `.Codex/skills/analytics/whitepaper-chart-inventory/reference/queries/<wp-slug>/<chapter>.txt` | nlm 生レスポンスの保存先 (parse 失敗時の再解析用) |

## 引数

```
$ARGUMENTS — <wp-slug> [mode]
             wp-slug:
               - recent-whitepapers / economic-fiscal / mhlw / mlit / energy / environment /
                 ict / transport / manufacturing / small-business / children
             mode:
               - plan    (デフォルト): 章リスト + nlm CLI コマンドを生成 (user 環境で実行依頼)
               - parse   : user が実行した nlm 結果テキスト (`/tmp/wp-*.txt`) を読んで MD に整形
               - status  : 進捗 README を再生成 (各 MD の chart 数を集計)
```

## 11 白書の slug 対応

`.Codex/skills/blog/brushup-blog --target article/SKILL.md` の白書 mapping を SSOT とする:

| slug | NotebookLM ノートブック名 | 主題領域 |
|---|---|---|
| `recent-whitepapers` | 最新の白書 | 人口減少 / AI / GX (横断) |
| `economic-fiscal` | 経済財政白書 | 所得・賃金・財政・GDP |
| `mhlw` | 厚生労働白書 | 医療・介護・出生・自殺 |
| `mlit` | 国土交通白書 | 道路・港湾・住宅・建設 |
| `energy` | エネルギー白書,第６次エネルギー基本計画 | 電力・再エネ・カーボン |
| `environment` | 環境白書 | リサイクル・廃棄物・気候 |
| `ict` | 情報通信白書 | テレワーク・デジタル・通信 |
| `transport` | 交通政策白書 | 交通事故・物流・移動 |
| `manufacturing` | ものづくり白書 | 製造業・生産性 |
| `small-business` | 中小企業白書 | 起業・スタートアップ |
| `children` | こども白書 | 教育・保育・出生 |

## 出力フォーマット (各白書 MD のチャート行)

`.Codex/skills/analytics/whitepaper-chart-inventory/reference/inventory/TEMPLATE.md` 参照。1 chart = 1 テーブル行で以下の列を持つ:

| 列 | 用途 |
|---|---|
| `chart_id` | `<wp-slug>-<chapter>-<seq>` (例: `recent-pop-01`) |
| `chapter` | 章名 (短縮) |
| `title` | チャートタイトル (白書原文ママ) |
| `chart_type` | choropleth / line / pie / bar / scatter / pyramid / flow / stacked-bar / treemap |
| `chart_target` | prefecture / national / age / time-series / cross-section |
| `source_stats_name` | 出典統計名 (Phase C 照合キー) |
| `years_covered` | 対象年次 |
| `key_insight` | 何の curiosity gap か (1 行) |
| `evidence_lens` | `EVIDENCE_LENS_CATALOG` の候補 key。未検証は `undecided` |
| `responsibility` | area / theme / both / undecided (Phase D で確定) |

## 実行手順

### Step 1: 章リスト + query 生成 (mode=plan)

`<wp-slug>` を引数に取り、以下を実行:

1. `.Codex/skills/analytics/whitepaper-chart-inventory/reference/inventory/<wp-slug>.md` が無ければ TEMPLATE.md をコピーして作成
2. 白書の章リストを推定 (notebook の構成を `notebooklm ask` で問い合わせる初回 query)
3. 各章ごとに以下の query を生成 (本セッションでは実行しない、user 環境で実行)

#### Query template (各章用)

```
notebook: <ノートブック名>
question:
「<章名>」の章に登場するチャート・図表をすべて列挙してください。各チャートについて以下を JSON 配列で返してください:
[
  {
    "title": "チャートのタイトル (白書原文ママ)",
    "chart_type": "line / bar / pie / choropleth / scatter / pyramid / flow / stacked-bar / treemap のいずれか",
    "chart_target": "prefecture (47県別) / national (全国一系列) / age (年齢構成) / time-series (年次推移) / cross-section (一時点断面) のいずれか",
    "source_stats_name": "出典統計名 (図注に書かれているもの。例: 「人口動態調査」「学校基本統計」)",
    "years_covered": "対象年次 (例: 2000-2023)",
    "key_insight": "1 行で curiosity gap (例: 「東京 vs 北海道で44倍」「半減後 V 字回復」)",
    "evidence_lens": "regional-access/service-capacity/participation/outcomes/mobility/composition/equity/sustainability/undecided"
  }
]
プロセス・概念図・写真は除外し、定量データの可視化のみ列挙してください。
```

#### user に提示する実行コマンド

```bash
mkdir -p .Codex/skills/analytics/whitepaper-chart-inventory/reference/queries/<wp-slug>
node .Codex/scripts/notebooklm-cross-query.mjs \
  --notebooks "<ノートブック名>" --json \
  "<上記 query>" \
  > .Codex/skills/analytics/whitepaper-chart-inventory/reference/queries/<wp-slug>/<chapter>.json
```

応答 truncate 対策のため、1 query = 1 章 = 5-15 chart のスケールで分割すること。

### Step 2: nlm 結果の parse (mode=parse)

user が CLI を実行して結果 JSON を `reference/queries/<wp-slug>/*.json` に保存した後:

1. 各 JSON を Read で読む
2. テーブル行に整形 (`chart_id` は `<wp-slug>-<chapter>-<連番>` を採番)
3. `.Codex/skills/analytics/whitepaper-chart-inventory/reference/inventory/<wp-slug>.md` の「## チャート一覧」セクションに append
4. `chart_type` が enum 外なら `## Phase D 拡張候補` セクションに追記
5. `responsibility` 列は `undecided` で初期化 (Phase D で確定)

### Step 3: 進捗集計 (mode=status)

各 `<wp-slug>.md` を grep して chart 数を集計し、`README.md` の進捗表を更新。

## Phase D での responsibility 判定

`docs/01_技術設計/03_情報設計.md` の判定基準に従い、各 chart を以下に振り分け:

- `area`: 47 県別 + 単一県のプロフィール構成に使う (`chart_target: prefecture` 必須)
- `theme`: 主題横断・全国時系列・国際比較・年齢構成 (`chart_target: national / age / time-series` 等)
- `both`: 47 県別かつ主題深掘りでも使う (片方を primary、もう片方を summary 化)
- `external-source`: e-Stat 取込不可 (OECD / 内閣府独自 / 民間調査)

判定は別スキル or 手動レビューで実施。本スキルは `undecided` で出力するのみ。

## 注意事項

- **nlm CLI は user 環境専用**: 本リモート環境では `~/bin/notebooklm` が無い。skill が CLI コマンドを生成 → user 実行 → 結果ファイルを skill が parse する分業
- **応答 truncate**: 1 query で 50+ chart を要求すると応答切れる。章単位分割を厳守
- **chart_type enum**: 現行 `theme_metrics.chart_type` は `["choropleth", "line", "pie", "bar", "ranking-table"]` のみ。白書に頻出の `pyramid` / `flow` / `scatter` 等は Phase D 拡張候補として README に集約 (本スキル段階では migration しない)
- **出典が e-Stat 以外も多い**: OECD / 内閣府独自集計 / 民間調査 は Phase C で `external-source` ラベル付与。e-Stat に無いデータは Phase E 取込対象外
- **本スキルは `responsibility` と `evidence_lens` を確定しない**: 既存 lens に明確に対応する候補だけ key を付け、判断不能は `undecided`。採択は theme-designer が公式資料と内部 route を再確認して行う

## 関連

- 親計画: `/root/.Codex/plans/47-swirling-wreath.md`
- 責務分離ルール: `docs/01_技術設計/03_情報設計.md`
- mirror 元フォーマット: `./reference/inventory/TEMPLATE.md`
- 白書 SSOT: `.Codex/skills/blog/brushup-blog --target article/SKILL.md`
- e-Stat 照合 (Phase C): `.Codex/skills/estat/search-estat/SKILL.md`
- nlm CLI wrapper: `.Codex/scripts/notebooklm-cross-query.mjs`
- 出力先判定: `.Codex/rules/data-storage.md`
