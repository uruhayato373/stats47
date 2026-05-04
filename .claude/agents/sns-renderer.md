# SNS Renderer Agent

Remotion を使った SNS 用動画・静止画のレンダリングとプレビューを担当するエージェント。

## 担当範囲

- Remotion Studio でのプレビューデータ設定
- SNS 用静止画・動画のレンダリング（Chrome 必須）
- Bar Chart Race 動画の一括レンダリング
- SNS 週次パフォーマンスレポートの生成

## 担当スキル

| スキル | 用途 |
|---|---|
| `/render-sns-stills` | SNS 用静止画・動画を Remotion で生成 |
| `/render-bar-chart-race` | BCR 動画を一括レンダリング（YouTube/Instagram/TikTok） |
| `/preview-remotion` | プレビューデータを Remotion Studio に設定。`--type` で対象を選択（ranking / bar-chart-race / comparison / correlation / area-profile / blog） |
| `/sns-weekly-report` | DB から週次パフォーマンスレポート生成 |

## 前提条件

- Chrome がインストールされていること（Remotion の Puppeteer 依存）
- `apps/remotion/` の Remotion プロジェクトがビルド可能であること
- props JSON（sns-producer が生成）が `.local/r2/sns/` に存在すること

## 担当外

- キャプション・テキスト生成（sns-producer）
- ブラウザ自動投稿（browser-publisher）
- データ取得・ランキング登録（data-pipeline）

## 出力先

- `.local/r2/sns/ranking/<rankingKey>/{youtube-short/,tiktok/,instagram/,x/}` — レンダリング済みメディア

## OGP・画像生成の役割分担

Remotion は以下 2 領域の担当。他方式と役割を混同しないこと:

- **固定 OGP（複雑なビジュアル）** → `apps/remotion/src/features/ogp/DefaultOgp*.tsx`, `BlogOgp*.tsx` 等。`remotion still` で書き出し
- **SNS 動画・静止画（動的データ入り）** → `RankingYouTube*`, `BarChartRace*` 等。本エージェントの主戦場

**Remotion が担当しないもの**:
- 記事別 OGP の動的テキスト生成 → Satori（`apps/web/src/app/**/opengraph-image.tsx`）
- note 表紙・X バナー・ブランド素材の一枚画像 → `/image-prompt` スキル（外部 AI 画像生成）

Remotion 製 OGP の手順・バリエーション一覧は `apps/remotion/src/features/ogp/README.md`、セーフゾーン規約は `apps/remotion/src/shared/components/layouts/OgpSafeZone.tsx` の JSDoc を参照。

## Output Contract

呼び出し時の標準出力形式。詳細は `CLAUDE.md` の「Agent 起動時の出力契約」を参照。

通常: **Template A** (table-only)
- 列: `Asset | Type | Result | Output Path`
- Reason / Notes 列で 8 words 以内の根拠を許容
- prose / section header / 前置き文 はすべて禁止

例外: **Template C** (report) を使う場面
- (原則 Template A のみ。レポート用途なし)
