---
name: record-youtube-experiment
description: YouTube 実験の仮説・結果・学びを GitHub Issues に記録する。Use when user says "実験記録", "YouTube実験", "結果を記録", "学びを記録". 実験の新規作成・初動/FINAL 結果追記・横断分析.
argument-hint: "<new|update EXP-XXX|analyze>"
---

YouTube Shorts のフォーマット・テーマ・タイトルの A/B テストを **1 実験 1 GitHub Issue** で構造化して管理する。

## 用途

- 新しい実験の仮説を記録したいとき
- 投稿後の計測データ（再生数・維持率等）を更新したいとき
- 過去の実験を横断分析して傾向・学びをまとめたいとき

## 引数

```
$ARGUMENTS — new | update EXP-XXX | analyze
  new             新しい実験 Issue を作成
  update EXP-XXX  指定実験 Issue に初動/FINAL 結果を追記（`gh issue comment`）
  analyze         open/closed 全実験 Issue の横断分析
```

## データの保管場所

| データ | 保管先 | 理由 |
|---|---|---|
| 実験仮説・変数・予測・観測結果 | GitHub Issues ラベル `youtube-experiment` | タイムライン、ラベル検索、PR/動画リンク |
| 観測結果の追記 | 各 Issue へのコメント（初動 24-48h と FINAL 2 週間時点で追記） | append-only 履歴 |
| 横断分析のメモ | Issue コメント（`EXP-000` 相当のメタ Issue でもよい）or `/knowledge` | 恒常知見は knowledge 行き |

## 手順

### モード: `new`

1. 次の EXP-NNN 番号を採番:
   ```bash
   gh issue list --label youtube-experiment --state all --json title --jq '[.[] | .title | capture("EXP-(?<n>\\d+)").n | tonumber] | max // 0 + 1'
   ```
   最大番号+1 が次の ID。3 桁 zero-pad（`EXP-001`, `EXP-002`, ...）。

2. ユーザーに以下を確認:
   - テーマ（ランキング指標）
   - フォーマット（6秒静止画 / BCR / カウントダウン / その他）
   - 仮説（なぜこのテーマ・フォーマットが効くと考えるか）
   - 成功基準（初動48h再生 > N 等）
   - Control（既存の比較対象動画）と Variant（今回試す変更）

3. Issue 本文を作成。テンプレは `.github/ISSUE_TEMPLATE/youtube-experiment.md` に準拠:

```markdown
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

## 関連 Issue
<!-- weekly-review、他の実験 Issue -->
```

4. Issue 作成:
   ```bash
   gh issue create \
     --title "[YouTube Exp] EXP-NNN" \
     --label "youtube-experiment" \
     --body-file /tmp/exp-body.md
   ```

5. 作成した Issue 番号と URL を報告。

### モード: `update EXP-XXX`

1. 対象 Issue を取得:
   ```bash
   gh issue list --label youtube-experiment --state all --search "EXP-XXX in:title" --json number,title,body
   ```
2. `/fetch-youtube-data` で最新の再生数・いいね数を取得。
3. YouTube Analytics API（`node .claude/scripts/youtube/analytics.js retention <videoId>`）で視聴維持率を取得。
4. 現時点が「初動（24-48h）」なのか「FINAL（2 週間）」なのかを判断し、該当セクションの数値をコメントで追記する:
   ```bash
   gh issue comment <Issue 番号> --body "$(cat <<'EOF'
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
   EOF
   )"
   ```
5. FINAL 観測かつ判定が確定したら、本文の「判定」チェックボックスを `gh issue edit` で更新し、必要に応じて Issue をクローズ:
   ```bash
   gh issue edit <番号> --body-file /tmp/updated-body.md
   # 仮説通り → 本実装にフィードバック済みなら
   gh issue close <番号> --comment "判定: 仮説通り。YouTube strategist の戦略知見に反映済み。"
   ```

### モード: `analyze`

1. 全実験 Issue を取得:
   ```bash
   gh issue list --label youtube-experiment --state all --limit 100 --json number,title,body,state,labels,createdAt
   ```
2. 各 Issue のコメント（`gh issue view <番号> --comments`）から観測結果を抽出。
3. 集計:
   - フォーマット別の平均再生数・維持率
   - テーマ別の平均再生数・維持率
   - タイトル・タグの傾向
4. 成功パターンと失敗パターンを抽出。
5. youtube-strategist.md の戦略知見セクションに新しい学びを反映すべきか判断。
6. 分析結果は以下のいずれかに記録:
   - 単発の気付き → `[YouTube Exp] EXP-XXX` 個別 Issue のコメントに追記
   - 恒常的な知見 → `/knowledge` スキルで永続化
   - 複数実験を束ねる横断レポート → 新規 Issue（例: `[YouTube Analysis] YYYY-MM`、ラベル `youtube-experiment` + 任意の `analysis` ラベル）

## Issue 運用ルール

- **Issue は append-only** — 編集ではなくコメント追記で履歴を残す（本文は最初の仮説/予測と判定チェックボックスのみ更新）
- **日付は絶対日付** — 「今週」「先週」は使わない
- **数値はソース明示** — `/fetch-youtube-data` の実行日、`analytics.js` のレスポンスタイムスタンプ等
- **想定効果値は投稿前に Issue 本文に書く** — 後付けバイアス防止
- **判定が確定した Issue はクローズ** — open は「観測中」「判定待ち」の実験のみ
- **週次 /weekly-review** から新規/更新 Issue の数が参照されるため、ラベルは必ず `youtube-experiment` を付与

## Issue ラベル

- `youtube-experiment` — 本スキルが作成する Issue のラベル
- weekly-review Issue の「SNS パフォーマンス」節から参照される

## 関連スキル

| スキル | 関係 |
|---|---|
| `/fetch-youtube-data` | 再生数・いいね数の取得 |
| `/analyze-youtube` | 競合動画の内容分析 |
| `/post-youtube` | 投稿メタ（タイトル・説明・タグ）の生成 |
| `/knowledge` | 横断分析で得た恒常知見の永続化 |

## 参照

- `.github/ISSUE_TEMPLATE/youtube-experiment.md` — Issue テンプレ
- `gh issue list --label youtube-experiment --state all` — 過去実験の一覧
- `gh issue list --label youtube-experiment --state open` — 観測中/判定待ちの実験
- `.claude/agents/youtube-strategist.md` — 戦略知見の反映先
