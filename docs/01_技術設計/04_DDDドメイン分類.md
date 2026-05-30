---
type: tech-design
status: active
tags: [ddd, architecture]
---

# DDDドメイン分類

stats47 のドメインを DDD の観点から分類する。

## コアドメイン (Core Domain)

競争優位性に直結する機能。

| ドメイン | feature | 責務 |
|---|---|---|
| Ranking | `ranking` | 統計指標のランキング生成・表示 |
| Dashboard | `dashboard` | 地域別統計データの可視化 |
| AreaProfile | `area-profile` | 地域別の詳細統計プロフィール |
| Correlation | `correlation` | 統計指標間の相関分析・散布図 |
| RegionComparison | `region-comparison` | 複数地域の統計比較 |

## 支援ドメイン (Supporting Domain)

プロジェクト固有のビジネスロジック。コアドメインを支援する。

| ドメイン | feature | 責務 |
|---|---|---|
| Area | `area` | 地域コード管理、都道府県・市区町村情報 |
| Category | `category` | カテゴリ・サブカテゴリ・タグ管理 |
| EstatAPI | `estat-api` | 政府統計データ (e-Stat) の取得・変換 |
| Search | `search` | 統計データの検索・フィルタリング |
| Ads | `ads` | アフィリエイト広告の配信管理 |
| AIContent | `ai-content` | AI による記事・コンテンツ生成 |
| MigrationFlow | `migration-flow` (`apps/remotion/`) | ペア観測 (pref ↔ pref) の集計・動画演出。**R2 `app/stats/<metric>/migration-flow-<year>.json` が backing store** (Phase 6 で R2 移行、永続 D1 なし)。詳細: `docs/01_技術設計/13_動画データSSOT.md` |

## 汎用ドメイン (Generic Domain)

技術的関心事。他プロジェクトでも再利用可能。

| ドメイン | 場所 | 責務 |
|---|---|---|
| Blog | `apps/web/src/features/blog` | MDX 記事の管理・表示 |
| Database | `packages/database` | Drizzle schema (型ソース) + テスト基盤 + 使い捨てビルドキャッシュ操作 (永続 D1 なし) |
| R2Storage | `packages/r2-storage` | Cloudflare R2 オブジェクトストレージ |
| Visualization | `packages/visualization` | D3 チャート・地図コンポーネント |

feature パスはすべて `apps/web/src/features/` 配下。

## ドメイン間の依存関係

```
コアドメイン → 支援ドメイン → 汎用ドメイン
```

**制約:**
- 上位から下位への一方向依存のみ（下位→上位は禁止）
- 同階層間の依存は最小限
- 循環依存は禁止

## 分類の判断基準

1. プロジェクトの競争優位性に直結するか? → コアドメイン
2. プロジェクト固有のビジネスロジックを含むか? → 支援ドメイン
3. 技術的関心事で汎用的か? → 汎用ドメイン
