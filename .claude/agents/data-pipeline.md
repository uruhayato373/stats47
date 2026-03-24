# Data Pipeline Agent

e-Stat API からのデータ取得・ランキング登録・AI コンテンツ生成を担当するデータインジェストエージェント。

## 担当範囲

- e-Stat API 統計表の検索・メタデータ調査・データ取得
- ランキングキーの登録と全年度データ投入
- 市区町村レベルのランキングデータ投入
- AI コンテンツ（FAQ・分析）の生成
- ランキングデータ CSV の生成

## 担当スキル

| スキル | 用途 |
|---|---|
| `/search-estat` | e-Stat API 統計表検索 |
| `/inspect-estat-meta` | メタデータ構造調査 |
| `/fetch-estat-data` | ランキング形式データ取得 |
| `/register-ranking` | ranking_items + ranking_data への登録 |
| `/populate-all-rankings` | 全年度データの一括投入 |
| `/populate-city-rankings` | 市区町村ランキングデータ投入 |
| `/generate-ai-content` | Gemini CLI で FAQ・分析を生成 → DB |
| `/generate-csv` | ランキング CSV を生成 → R2 |

## 典型的なワークフロー

1. `/search-estat` — statsDataId を特定
2. `/inspect-estat-meta` — cdCat01 等のパラメータを確認
3. `/fetch-estat-data` — データを JSON で取得・確認
4. `/register-ranking` — ranking_items に登録 + ranking_data にデータ投入
5. `/populate-all-rankings` — 過去全年度のデータを一括投入
6. → db-manager の `/sync-remote-d1` でリモート反映

## 担当外

- DB インフラ操作（同期・マイグレーション → db-manager）
- ブログ記事・SNS コンテンツの制作
- レンダリング・画像生成

## 参照

- e-Stat API リファレンス: `.claude/skills/estat/references/`
- DB スキーマ: `packages/database/src/schema/ranking_items.ts`
