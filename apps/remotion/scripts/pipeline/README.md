# pipeline

SNS コンテンツ向け動画・静止画の一括生成スクリプト群。

## スクリプト

| ファイル | npm コマンド | 説明 |
|---|---|---|
| `render-sns-all.ts` | `pipeline:sns` | X/Instagram/note 向け静止画 + 動画を一括生成（renderStill + renderMedia） |
| `render-bar-chart-race.ts` | `pipeline:bar-chart-race` | バーチャートレース動画を生成（YouTube/Instagram/TikTok/X/YouTube-Normal） |

## 実行

```bash
# SNS コンテンツ（静止画 + 動画）を一括生成
npm run pipeline:sns --workspace remotion

# バーチャートレース動画のみ
npm run pipeline:bar-chart-race --workspace remotion
```

## 注意

ブログ OGP・サムネイルは **Satori** で生成する:

```bash
npx tsx apps/web/scripts/generate-blog-thumbnails.ts --force
```

ランキング OGP は **Next.js `opengraph-image.tsx`** が動的生成するため、スクリプト不要。
