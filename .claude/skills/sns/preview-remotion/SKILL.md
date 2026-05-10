---
name: preview-remotion
description: 実データで Remotion Studio のプレビュー用データファイルを上書きする。--type で対象を選ぶ（ranking / area-profile / bar-chart-race / comparison / correlation）。Use when user says "プレビュー", "Remotion プレビュー", "ランキングプレビュー", "BCR プレビュー", "比較プレビュー", "相関プレビュー", "地域プロファイルプレビュー". HMR で自動反映.
disable-model-invocation: true
---

実データで Remotion Studio のプレビュー用 `.ts` データファイルを上書きする。Studio が HMR で自動反映するため、リアルタイムにプレビューを確認できる。

## 引数

```
$ARGUMENTS — [--type <name>] [type 固有の引数...]
             --type: 対象プレビューの種類。省略時は ranking
                     ranking         : ランキング 47 都道府県（既定）
                     area-profile    : 地域プロファイル（強み弱み）
                     bar-chart-race  : Bar Chart Race アニメーション
                     comparison      : 2 地域比較
                     correlation     : 相関散布図
```

`--type` の値ごとに必要な追加引数や読み込むデータが異なる。詳細は下記の参照ファイルに従うこと。

## type 別ガイドの参照

`--type` 値に応じて `.claude/skills/sns/preview-remotion/types/<type>.md` を読み、その手順に従う:

| --type 値 | 参照ファイル | 上書きする preview-data ファイル | 対象コンポジション例 |
|---|---|---|---|
| `ranking` | `types/ranking.md` | `apps/remotion/src/utils/preview-data.ts` | RankingX-Post / RankingInstagram-Carousel / RankingYouTube-Short |
| `area-profile` | `types/area-profile.md` | `apps/remotion/src/utils/preview-data-area-profile.ts` | AreaProfileInstagram-Carousel / AreaProfileOgp |
| `bar-chart-race` | `types/bar-chart-race.md` | `apps/remotion/src/utils/preview-data-bar-chart-race.ts` | BarChartRace 系 |
| `comparison` | `types/comparison.md` | `apps/remotion/src/utils/preview-data-comparison.ts` | CompareX-Post / CompareInstagram-Carousel / ComparisonOgp |
| `correlation` | `types/correlation.md` | `apps/remotion/src/utils/preview-data-correlation.ts` | CorrelationX-Scatter / CorrelationScatterOgp |

## 共通ルール

すべての type で共通する書き換えルール:

### 上書き時のフォーマット

- **import 文は型のみ**。データはリテラルとして埋め込む
- `undefined` のフィールドはオブジェクトから省略する
- 値が文字列の場合はダブルクォートで囲み、必要に応じてエスケープする

### 上書き後の報告

ユーザーに以下を報告する:
- 上書き対象ファイル
- 主要メタ情報（title / unit / 件数 / 対象都道府県 等、type に応じて）

### デフォルト（モック状態）に戻す

各 type の `types/*.md` 末尾に「デフォルトに戻す」の上書き内容を記載している（mock データ参照するパターン）。

## 注意

- **Studio の起動状態**: Remotion Studio が起動していない場合は HMR 反映を確認できない。`cd apps/remotion && npm run dev` を案内する
- **データの不足**: ソースデータが見つからない場合は **エラーで終了せず**、対応する `/generate-*` または `/render-*` 系スキルでデータ生成するよう案内する
- **モックに戻すタイミング**: PR 提出前や別作業に移る前にモックへ戻すと、他のメンバーがプル時に意図しないデータでビルドする事故を防げる

## 関連スキル（実データ生成系）

- `/generate-bar-chart-race` — Bar Chart Race の config + data 生成
- `/generate-compare` — 比較データ生成
- `/render-sns-stills` — SNS 静止画一括レンダリング
- `/render-bar-chart-race` — Bar Chart Race 動画レンダリング
