# pipeline

ランキング画像の一括生成スクリプト群。ローカル D1（SQLite）からデータを取得し、Remotion で PNG を生成して `.local/r2/` に保存する。

## スクリプト

| ファイル | npm コマンド | 説明 |
|---|---|---|
| `render-ranking-all.ts` | `pipeline:all` | OGP + サムネイルを同時生成（D1・バンドル共有、並列レンダリング） |
| `render-ranking-ogp.ts` | `pipeline:ranking-ogp` | OGP のみ生成 |
| `render-ranking-thumbnails.ts` | `pipeline:ranking-thumbnails` | サムネイルのみ生成 |

## 実行

```bash
# OGP + サムネイルを同時生成（推奨）
npm run pipeline:all --workspace remotion

# OGP のみ
npm run pipeline:ranking-ogp --workspace remotion

# サムネイルのみ
npm run pipeline:ranking-thumbnails --workspace remotion
```

## 出力先

```
.local/r2/ranking/prefecture/{rankingKey}/{yearCode}/
├── ogp/
│   ├── ogp-light.png        # RankingHeroOgp (1200x630)
│   └── ogp-dark.png
└── thumbnails/
    ├── thumbnail-light.png  # RankingThumbnail (240x240)
    └── thumbnail-dark.png
```

## データソース

- **D1**: `.local/d1/v3/d1/miniflare-D1DatabaseObject/*.sqlite`
  - `ranking_items`（`is_active=1`, `area_type='prefecture'`）
  - `ranking_data`（最新年のデータ）

生成後は `/push-r2` スキルでリモート R2 にアップロードする。
