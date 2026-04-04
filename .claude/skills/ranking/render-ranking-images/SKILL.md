---
name: render-ranking-images
description: 全ランキングの OGP・サムネイルを Remotion で一括生成しローカル R2 に保存する。Use when user says "OGP生成", "サムネイル一括生成", "ランキング画像". light/dark 4枚並列レンダリング.
disable-model-invocation: true
---

全 active ランキング（約1,250件）の OGP 画像とサムネイルを一括生成する。

## 生成される画像

| 種別 | コンポジション | サイズ | 出力先 |
|---|---|---|---|
| OGP | `RankingHeroOgp` | 1200x630 | `{key}/{year}/ogp/ogp-{light|dark}.png` |
| サムネイル | `RankingThumbnail` | 240x240 | `{key}/{year}/thumbnails/thumbnail-{light|dark}.png` |

## 手順

### Step 1: 一括生成

```bash
# OGP + サムネイルを同時生成（推奨）
npm run pipeline:all --workspace remotion

# OGP のみ
npm run pipeline:ranking-ogp --workspace remotion

# サムネイルのみ
npm run pipeline:ranking-thumbnails --workspace remotion
```

`pipeline:all` は D1 読み込みとバンドルを1回に共有し、各ランキングの4枚を並列レンダリングする。

### Step 2: R2 にアップロード

```
/push-r2
```

プレフィックス `ranking` を指定。

## 参照

- パイプライン: `apps/remotion/scripts/pipeline/`
- OGP コンポジション: `apps/remotion/src/features/ogp/RankingHeroOgp.tsx`
- サムネイルコンポジション: `apps/remotion/src/features/web/RankingThumbnail.tsx`
