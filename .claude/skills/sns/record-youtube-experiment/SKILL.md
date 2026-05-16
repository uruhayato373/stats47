---
name: record-youtube-experiment
description: YouTube 実験の仮説・結果・学びを docs/15_実験ログ/youtube/ に Markdown ファイルで記録する。Use when user says "実験記録", "YouTube実験", "結果を記録", "学びを記録". 実験の新規作成・初動/FINAL 結果追記・横断分析.
argument-hint: "<new|update EXP-XXX|analyze>"
---

YouTube Shorts のフォーマット・テーマ・タイトルの A/B テストを **1 実験 1 Markdown ファイル**（`docs/15_実験ログ/youtube/EXP-NNN.md`）で構造化して管理する。

## 用途

- 新しい実験の仮説を記録したいとき
- 投稿後の計測データ（再生数・維持率等）を更新したいとき
- 過去の実験を横断分析して傾向・学びをまとめたいとき

## 引数

```
$ARGUMENTS — new | update EXP-XXX | analyze
  new             新しい実験ファイル EXP-NNN.md を作成
  update EXP-XXX  指定実験ファイルに初動/FINAL 結果を Edit 追記
  analyze         全実験ファイルの横断分析
```

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 実験仮説・変数・予測・観測結果 | `docs/15_実験ログ/youtube/EXP-NNN.md` | git 履歴、grep 検索、PR レビュー可能 |
| 観測結果の追記 | 同 Markdown ファイル内の初動/FINAL セクションを編集 | 1 実験 = 1 ファイルで完結 |
| 横断分析のメモ | `docs/15_実験ログ/youtube/analysis-{YYYY-MM}.md` or `/knowledge` | 恒常知見は knowledge 行き |

## 移行先について（旧 `youtube_experiments.md`）

過去に `docs/10_SNS戦略/youtube_experiments.md`（1 ファイル蓄積）で運用していた場合は、`docs/15_実験ログ/youtube/EXP-NNN.md` への分割を推奨する。旧ファイルが残っている場合は、各実験エントリを EXP-NNN ファイルに分割移行してから旧ファイルを削除する（このスキルは新規分は EXP-NNN ファイル形式でのみ作成する）。

## 手順

### モード: `new`

1. 次の EXP-NNN 番号を採番:
   ```bash
   ls docs/15_実験ログ/youtube/EXP-*.md 2>/dev/null | sed -E 's|.*/EXP-([0-9]+)\.md|\1|' | sort -n | tail -1
   ```
   最大番号+1 が次の ID。3 桁 zero-pad（`EXP-001`, `EXP-002`, ...）。出力が空なら `EXP-001` から開始。

2. ユーザーに以下を確認:
   - テーマ（ランキング指標）
   - フォーマット（6秒静止画 / BCR / カウントダウン / その他）
   - 仮説（なぜこのテーマ・フォーマットが効くと考えるか）
   - 成功基準（初動48h再生 > N 等）
   - Control（既存の比較対象動画）と Variant（今回試す変更）

3. Write tool で `docs/15_実験ログ/youtube/EXP-NNN.md` を作成:

```markdown
---
type: youtube-experiment
exp_id: EXP-NNN
date: YYYY-MM-DD
status: pending
hypothesis: <短文>
format: 6秒静止画 | BCR | カウントダウン | その他
tags: []
---

# EXP-NNN: <タイトル>

## 実験 ID
- **ID**: EXP-NNN
- **投稿日**: YYYY-MM-DD

## 仮説
{何を検証するか。なぜ効くと考えるか}

## 変数

### Control（既存パターン）
{比較対象の投稿 URL or videoId}

### Variant（試したい変更）
- **フォーマット**: 6秒静止画 / BCR / カウントダウン / その他
- **テーマ**: {ランキング指標}
- **タイトル**: {Variant のタイトル}
- **サムネ**: {サムネ設計の要点}
- **長さ**: N 秒

## 予測

| 指標 | Control 既存平均 | Variant 予測 | 想定 delta |
|---|---|---|---|
| 再生数 | N | N | +N |
| CTR | N% | N% | +N pt |
| 視聴時間 | Ns | Ns | +N |

## 初動（投稿後 24-48h）
<!-- update EXP-NNN で追記 -->

## FINAL（投稿後 2 週間）
<!-- update EXP-NNN で追記 -->

## 判定
- [ ] 仮説通り → 本実装
- [ ] 仮説に反する → 原因分析
- [ ] 判定不能 → 次実験で条件変更

## 関連
<!-- 週次レビュー (docs/03_週次運用/週次レビュー/...) 、他の実験ファイル ([[EXP-NNN]]) を相対リンクで -->
```

4. 作成したファイルパスを報告。

### モード: `update EXP-XXX`

1. 対象ファイルを Read:
   ```bash
   cat docs/15_実験ログ/youtube/EXP-XXX.md
   ```
2. `/fetch-youtube-data` で最新の再生数・いいね数を取得。
3. YouTube Analytics API（`node .claude/scripts/youtube/analytics.js retention <videoId>`）で視聴維持率を取得。
4. 現時点が「初動（24-48h）」なのか「FINAL（2 週間）」なのかを判断し、該当セクションを Edit tool で書き換える:
   ```markdown
   ## 初動（投稿後 N 時間）観測 (YYYY-MM-DD)

   - 再生数: N
   - Impressions: N
   - CTR: N%
   - 視聴維持率: N%（average view duration: Ns）
   - いいね: N（率 N%）

   **学び**:
   - 仮説は当たった/外れた/判定不能
   - 予想外の結果: ...
   - 次実験で試すこと: ...
   ```
5. FINAL 観測かつ判定が確定したら、frontmatter の `status:` を `completed` に更新し、本文の「判定」チェックボックスを Edit でチェック:
   ```yaml
   ---
   ...
   status: completed
   judgment: confirmed | rejected | inconclusive
   ---
   ```
6. 判定確定後は本実装にフィードバック（YouTube strategist エージェントへの知見反映）。

### モード: `analyze`

1. 全実験ファイルを取得:
   ```bash
   ls -t docs/15_実験ログ/youtube/EXP-*.md
   ```
2. 各ファイルを Read で本文と frontmatter を取得。`status: completed` のみを集計対象にする。
3. 集計:
   - フォーマット別の平均再生数・維持率（frontmatter `format:` で分類）
   - テーマ別の平均再生数・維持率
   - タイトル・タグの傾向
4. 成功パターンと失敗パターンを抽出。
5. youtube-strategist.md の戦略知見セクションに新しい学びを反映すべきか判断。
6. 分析結果は以下のいずれかに記録:
   - 単発の気付き → 個別 `EXP-NNN.md` の「学び」欄に追記
   - 恒常的な知見 → `/knowledge` スキルで永続化
   - 複数実験を束ねる横断レポート → `docs/15_実験ログ/youtube/analysis-{YYYY-MM}.md` を Write

## 運用ルール

- **ファイルは append-only** — section を増やす方向で編集。過去観測値の削除は禁止
- **日付は絶対日付** — 「今週」「先週」は使わない
- **数値はソース明示** — `/fetch-youtube-data` の実行日、`analytics.js` のレスポンスタイムスタンプ等
- **想定効果値は投稿前にファイル本文に書く** — 後付けバイアス防止
- **判定が確定したら frontmatter `status: completed`** — Obsidian Bases で active のみ抽出可能
- **週次 /weekly-review** から新規/更新ファイルの数が参照されるため、frontmatter `type: youtube-experiment` を必ず付与

## 関連スキル

| スキル | 関係 |
|---|---|
| `/fetch-youtube-data` | 再生数・いいね数の取得 |
| `/analyze-youtube` | 競合動画の内容分析 |
| `/post-youtube` | 投稿メタ（タイトル・説明・タグ）の生成 |
| `/knowledge` | 横断分析で得た恒常知見の永続化 |

## 参照

- `ls -t docs/15_実験ログ/youtube/EXP-*.md` — 過去実験の一覧
- `grep -l "status: pending\|status: running" docs/15_実験ログ/youtube/EXP-*.md` — 観測中/判定待ちの実験
- `.claude/agents/youtube-strategist.md` — 戦略知見の反映先
