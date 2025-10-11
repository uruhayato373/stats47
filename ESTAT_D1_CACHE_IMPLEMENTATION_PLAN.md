# e-Stat データキャッシュ実装計画 - D1データベース活用

## 目次
1. [概要](#概要)
2. [現状の課題](#現状の課題)
3. [実装方針](#実装方針)
4. [データベース設計](#データベース設計)
5. [実装手順](#実装手順)
6. [キャッシュ戦略](#キャッシュ戦略)
7. [データフロー](#データフロー)
8. [実装の優先順位](#実装の優先順位)

---

## 概要

現在、`EstatRankingServer`コンポーネントは毎回e-Stat APIからデータを取得しており、以下の問題があります：

- APIレスポンスタイムが遅い（数百ms〜数秒）
- 同じデータを複数回取得している
- e-Stat APIのレート制限リスク
- ページロード時間が長い

**解決策**: Cloudflare D1データベースに変換済みデータをキャッシュし、API呼び出しを最小限に抑える。

---

## 現状の課題

### 現在のデータフロー

```
ユーザーリクエスト
  ↓
EstatRankingServer (サーバーコンポーネント)
  ↓
EstatStatsDataService.getAvailableYears()
  → e-Stat API呼び出し (全国データ取得)
  ↓
EstatStatsDataService.getPrefectureDataByYear()
  → e-Stat API呼び出し (都道府県データ取得)
  ↓
データ整形・レンダリング
```

### 問題点

1. **毎回APIを呼び出す**: キャッシュがないため、同じデータでも毎回e-Stat APIにアクセス
2. **レスポンスタイムが遅い**: e-Stat APIのレスポンスは200-500msかかる
3. **複数回のAPI呼び出し**: 年度一覧取得と実データ取得で最低2回のAPI呼び出し
4. **データ変換の重複**: 毎回同じデータ整形処理を実行

### パフォーマンス計測（現状）

```
年度一覧取得: 200-400ms
都道府県データ取得: 300-600ms
合計: 500-1000ms (0.5-1秒)
```

---

## 実装方針

### 基本戦略

1. **変換済みデータのキャッシュ**: `FormattedValue[]`をJSON形式でD1に保存
2. **キャッシュファースト**: D1にデータがあればAPIを呼び出さない
3. **バックグラウンド更新**: データの鮮度を保つための定期更新機構
4. **段階的な実装**: まずは基本的なキャッシュから開始し、徐々に最適化

### キャッシュの粒度

データは以下のキーで管理：

```typescript
cache_key = `${statsDataId}_${categoryCode}_${yearCode}`

例: "0000010101_A5103_2024100000"
```

---

## データベース設計

### 新規テーブル: `estat_ranking_cache`

```sql
CREATE TABLE estat_ranking_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- キャッシュキー（ユニーク制約）
  stats_data_id TEXT NOT NULL,
  category_code TEXT NOT NULL,
  year_code TEXT NOT NULL,

  -- キャッシュデータ（JSON形式）
  data TEXT NOT NULL,  -- FormattedValue[] をJSON.stringify()

  -- メタデータ
  record_count INTEGER NOT NULL,  -- データ件数
  has_valid_values BOOLEAN DEFAULT 1,  -- 有効な値があるか

  -- キャッシュ管理
  fetched_from_api BOOLEAN DEFAULT 1,  -- APIから取得したか
  cache_hit_count INTEGER DEFAULT 0,  -- キャッシュヒット回数

  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,  -- キャッシュ有効期限

  -- 複合ユニーク制約
  UNIQUE(stats_data_id, category_code, year_code)
);

-- インデックス作成
CREATE INDEX idx_estat_cache_lookup
  ON estat_ranking_cache(stats_data_id, category_code, year_code);

CREATE INDEX idx_estat_cache_expires
  ON estat_ranking_cache(expires_at);
```

### 新規テーブル: `estat_available_years_cache`

年度一覧も別途キャッシュ：

```sql
CREATE TABLE estat_available_years_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- キャッシュキー
  stats_data_id TEXT NOT NULL,
  category_code TEXT NOT NULL,

  -- 年度一覧（JSON配列）
  years TEXT NOT NULL,  -- string[] をJSON.stringify()

  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,

  UNIQUE(stats_data_id, category_code)
);

CREATE INDEX idx_estat_years_lookup
  ON estat_available_years_cache(stats_data_id, category_code);
```

### 既存テーブルの活用

`estat_metainfo`テーブルは既に存在するため、カテゴリ情報のキャッシュに活用可能。

---

## 実装手順

### フェーズ1: キャッシュレイヤーの実装

#### 1.1 データベーススキーマの作成

**ファイル**: `database/migrations/004_create_estat_cache_tables.sql`

```sql
-- estat_ranking_cache テーブル作成
-- estat_available_years_cache テーブル作成
```

**実行コマンド**:
```bash
npx wrangler d1 execute stats47 --file=database/migrations/004_create_estat_cache_tables.sql --local
npx wrangler d1 execute stats47 --file=database/migrations/004_create_estat_cache_tables.sql --remote
```

#### 1.2 キャッシュサービスの実装

**ファイル**: `src/lib/estat/cache/EstatCacheService.ts`

```typescript
import { createD1Database } from "@/lib/d1-client";
import { FormattedValue } from "@/lib/estat/types/formatted";

export interface CacheEntry {
  data: FormattedValue[];
  recordCount: number;
  cachedAt: string;
  expiresAt: string;
}

export class EstatCacheService {
  /**
   * ランキングデータをキャッシュから取得
   */
  static async getRankingData(
    statsDataId: string,
    categoryCode: string,
    yearCode: string
  ): Promise<FormattedValue[] | null> {
    try {
      const db = await createD1Database();

      const result = await db
        .prepare(`
          SELECT data, expires_at
          FROM estat_ranking_cache
          WHERE stats_data_id = ?
            AND category_code = ?
            AND year_code = ?
            AND (expires_at IS NULL OR expires_at > datetime('now'))
          LIMIT 1
        `)
        .bind(statsDataId, categoryCode, yearCode)
        .first();

      if (!result) {
        return null;
      }

      // キャッシュヒットカウント更新
      await this.incrementCacheHit(statsDataId, categoryCode, yearCode);

      // JSONパース
      const data = JSON.parse(result.data as string) as FormattedValue[];
      return data;
    } catch (error) {
      console.error("キャッシュ取得エラー:", error);
      return null;
    }
  }

  /**
   * ランキングデータをキャッシュに保存
   */
  static async saveRankingData(
    statsDataId: string,
    categoryCode: string,
    yearCode: string,
    data: FormattedValue[],
    ttlDays: number = 30  // デフォルト30日間有効
  ): Promise<void> {
    try {
      const db = await createD1Database();

      const dataJson = JSON.stringify(data);
      const recordCount = data.length;
      const hasValidValues = data.some(v => v.numericValue !== null);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);

      await db
        .prepare(`
          INSERT INTO estat_ranking_cache (
            stats_data_id, category_code, year_code,
            data, record_count, has_valid_values,
            expires_at, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(stats_data_id, category_code, year_code)
          DO UPDATE SET
            data = excluded.data,
            record_count = excluded.record_count,
            has_valid_values = excluded.has_valid_values,
            expires_at = excluded.expires_at,
            updated_at = datetime('now')
        `)
        .bind(
          statsDataId,
          categoryCode,
          yearCode,
          dataJson,
          recordCount,
          hasValidValues ? 1 : 0,
          expiresAt.toISOString()
        )
        .run();

      console.log(`キャッシュ保存完了: ${statsDataId}_${categoryCode}_${yearCode}`);
    } catch (error) {
      console.error("キャッシュ保存エラー:", error);
      // キャッシュ保存失敗してもアプリケーションは継続
    }
  }

  /**
   * 年度一覧をキャッシュから取得
   */
  static async getAvailableYears(
    statsDataId: string,
    categoryCode: string
  ): Promise<string[] | null> {
    try {
      const db = await createD1Database();

      const result = await db
        .prepare(`
          SELECT years
          FROM estat_available_years_cache
          WHERE stats_data_id = ?
            AND category_code = ?
            AND (expires_at IS NULL OR expires_at > datetime('now'))
          LIMIT 1
        `)
        .bind(statsDataId, categoryCode)
        .first();

      if (!result) {
        return null;
      }

      return JSON.parse(result.years as string) as string[];
    } catch (error) {
      console.error("年度キャッシュ取得エラー:", error);
      return null;
    }
  }

  /**
   * 年度一覧をキャッシュに保存
   */
  static async saveAvailableYears(
    statsDataId: string,
    categoryCode: string,
    years: string[],
    ttlDays: number = 7  // 年度一覧は7日間有効
  ): Promise<void> {
    try {
      const db = await createD1Database();

      const yearsJson = JSON.stringify(years);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);

      await db
        .prepare(`
          INSERT INTO estat_available_years_cache (
            stats_data_id, category_code, years,
            expires_at, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(stats_data_id, category_code)
          DO UPDATE SET
            years = excluded.years,
            expires_at = excluded.expires_at,
            updated_at = datetime('now')
        `)
        .bind(statsDataId, categoryCode, yearsJson, expiresAt.toISOString())
        .run();
    } catch (error) {
      console.error("年度キャッシュ保存エラー:", error);
    }
  }

  /**
   * キャッシュヒットカウント更新
   */
  private static async incrementCacheHit(
    statsDataId: string,
    categoryCode: string,
    yearCode: string
  ): Promise<void> {
    try {
      const db = await createD1Database();

      await db
        .prepare(`
          UPDATE estat_ranking_cache
          SET cache_hit_count = cache_hit_count + 1
          WHERE stats_data_id = ?
            AND category_code = ?
            AND year_code = ?
        `)
        .bind(statsDataId, categoryCode, yearCode)
        .run();
    } catch (error) {
      // エラーは無視（重要な処理ではない）
    }
  }

  /**
   * 期限切れキャッシュの削除
   */
  static async cleanupExpiredCache(): Promise<number> {
    try {
      const db = await createD1Database();

      const result = await db
        .prepare(`
          DELETE FROM estat_ranking_cache
          WHERE expires_at IS NOT NULL
            AND expires_at < datetime('now')
        `)
        .run();

      await db
        .prepare(`
          DELETE FROM estat_available_years_cache
          WHERE expires_at IS NOT NULL
            AND expires_at < datetime('now')
        `)
        .run();

      return result.meta?.changes || 0;
    } catch (error) {
      console.error("キャッシュクリーンアップエラー:", error);
      return 0;
    }
  }
}
```

### フェーズ2: EstatStatsDataServiceの更新

#### 2.1 キャッシュ統合

**ファイル**: `src/lib/estat/statsdata/EstatStatsDataService.ts`

既存メソッドにキャッシュレイヤーを追加：

```typescript
import { EstatCacheService } from "@/lib/estat/cache/EstatCacheService";

export class EstatStatsDataService {
  /**
   * 利用可能な年度一覧を取得（キャッシュ対応）
   */
  static async getAvailableYears(
    statsDataId: string,
    categoryCode: string
  ): Promise<string[]> {
    try {
      // 1. キャッシュから取得を試みる
      const cachedYears = await EstatCacheService.getAvailableYears(
        statsDataId,
        categoryCode
      );

      if (cachedYears) {
        console.log(`年度一覧キャッシュヒット: ${statsDataId}_${categoryCode}`);
        return cachedYears;
      }

      // 2. キャッシュミス: APIから取得
      console.log(`年度一覧API取得: ${statsDataId}_${categoryCode}`);
      const response = await this.getAndFormatStatsData(statsDataId, {
        categoryFilter: categoryCode,
        areaFilter: '00000',
      });

      const years = Array.from(
        new Set(
          response.values
            .filter((v) => v.timeCode && v.timeCode.length >= 4)
            .map((v) => v.timeCode)
        )
      ).sort((a, b) => b.localeCompare(a));

      // 3. キャッシュに保存
      await EstatCacheService.saveAvailableYears(
        statsDataId,
        categoryCode,
        years,
        7  // 7日間有効
      );

      return years;
    } catch (error) {
      console.error("Failed to get available years:", error);
      throw error;
    }
  }

  /**
   * 都道府県データを年度別に取得（キャッシュ対応）
   */
  static async getPrefectureDataByYear(
    statsDataId: string,
    categoryCode: string,
    yearCode: string,
    limit: number = 100000
  ): Promise<FormattedValue[]> {
    try {
      // 1. キャッシュから取得を試みる
      const cachedData = await EstatCacheService.getRankingData(
        statsDataId,
        categoryCode,
        yearCode
      );

      if (cachedData) {
        console.log(
          `ランキングデータキャッシュヒット: ${statsDataId}_${categoryCode}_${yearCode}`
        );
        return cachedData;
      }

      // 2. キャッシュミス: APIから取得
      console.log(
        `ランキングデータAPI取得: ${statsDataId}_${categoryCode}_${yearCode}`
      );
      const response = await this.getAndFormatStatsData(statsDataId, {
        categoryFilter: categoryCode,
        yearFilter: yearCode,
        limit,
      });

      const prefectureValues = response.values.filter(
        (v) => v.areaCode && v.areaCode !== "00000" && v.numericValue !== null
      );

      if (prefectureValues.length === 0) {
        throw new Error("都道府県データが見つかりませんでした");
      }

      // 3. キャッシュに保存
      await EstatCacheService.saveRankingData(
        statsDataId,
        categoryCode,
        yearCode,
        prefectureValues,
        30  // 30日間有効
      );

      return prefectureValues;
    } catch (error) {
      console.error("Failed to get prefecture data:", error);
      throw error;
    }
  }
}
```

### フェーズ3: 定期的なキャッシュクリーンアップ

#### 3.1 クリーンアップAPIエンドポイント

**ファイル**: `src/app/api/estat/cache/cleanup/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EstatCacheService } from "@/lib/estat/cache/EstatCacheService";

/**
 * 期限切れキャッシュのクリーンアップ
 * GET /api/estat/cache/cleanup
 */
export async function GET(request: NextRequest) {
  try {
    const deletedCount = await EstatCacheService.cleanupExpiredCache();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount}件の期限切れキャッシュを削除しました`,
    });
  } catch (error) {
    console.error("キャッシュクリーンアップエラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "キャッシュクリーンアップに失敗しました",
      },
      { status: 500 }
    );
  }
}
```

#### 3.2 Cron設定（オプション）

GitHub ActionsまたはCloudflare Workersのcron triggerで定期実行：

```yaml
# .github/workflows/cache-cleanup.yml
name: Cache Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時（UTC）に実行
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup endpoint
        run: |
          curl -X GET https://your-domain.com/api/estat/cache/cleanup
```

---

## キャッシュ戦略

### キャッシュ有効期限（TTL）

| データタイプ | TTL | 理由 |
|------------|-----|------|
| 年度一覧 | 7日 | あまり変更されないが、新年度追加時に更新が必要 |
| ランキングデータ | 30日 | 統計データは月次更新が多い |
| メタ情報 | 90日 | カテゴリ情報はほとんど変更されない |

### キャッシュ無効化戦略

1. **時間ベース**: `expires_at`カラムで自動的に無効化
2. **手動無効化**: 管理APIで特定データを削除可能
3. **全削除**: 緊急時にすべてのキャッシュをクリア

### キャッシュウォーミング（オプション）

頻繁にアクセスされるデータを事前にキャッシュ：

```typescript
// src/scripts/cache-warming.ts
const popularDatasets = [
  { statsDataId: "0000010101", categoryCode: "A5103" },
  { statsDataId: "0000010102", categoryCode: "A1101" },
  // ... 人気のデータセット
];

for (const dataset of popularDatasets) {
  const years = await EstatStatsDataService.getAvailableYears(
    dataset.statsDataId,
    dataset.categoryCode
  );

  for (const year of years.slice(0, 5)) {  // 最新5年分
    await EstatStatsDataService.getPrefectureDataByYear(
      dataset.statsDataId,
      dataset.categoryCode,
      year
    );
  }
}
```

---

## データフロー

### 改善後のデータフロー

```
ユーザーリクエスト
  ↓
EstatRankingServer (サーバーコンポーネント)
  ↓
EstatStatsDataService.getAvailableYears()
  ↓
  [キャッシュチェック]
    ├─ ヒット → D1から返却 (5-10ms)
    └─ ミス → e-Stat API呼び出し → D1に保存 → 返却 (300-500ms)
  ↓
EstatStatsDataService.getPrefectureDataByYear()
  ↓
  [キャッシュチェック]
    ├─ ヒット → D1から返却 (10-20ms)
    └─ ミス → e-Stat API呼び出し → D1に保存 → 返却 (400-700ms)
  ↓
データ整形・レンダリング
```

### パフォーマンス予測

| シナリオ | 現状 | 改善後（キャッシュヒット） | 改善率 |
|---------|------|--------------------------|--------|
| 初回アクセス | 500-1000ms | 500-1000ms | 0% |
| 2回目以降 | 500-1000ms | 15-30ms | **95-97%改善** |
| 年度切り替え | 400-700ms | 10-20ms | **97-98%改善** |

---

## 実装の優先順位

### 優先度1（必須）: 基本キャッシュ機能

- [ ] テーブル作成マイグレーション
- [ ] `EstatCacheService`実装
- [ ] `EstatStatsDataService`へのキャッシュ統合
- [ ] 基本的な動作確認

**作業時間**: 2-3時間

### 優先度2（推奨）: キャッシュ管理

- [ ] クリーンアップAPIエンドポイント
- [ ] 手動キャッシュ無効化API
- [ ] キャッシュ統計・モニタリング

**作業時間**: 1-2時間

### 優先度3（オプション）: 最適化

- [ ] キャッシュウォーミング
- [ ] Cron設定
- [ ] プリフェッチ機構
- [ ] 圧縮保存（gzip）

**作業時間**: 2-3時間

---

## テスト計画

### 単体テスト

```typescript
// src/lib/estat/cache/__tests__/EstatCacheService.test.ts
describe("EstatCacheService", () => {
  it("データを保存して取得できる", async () => {
    const testData = [/* FormattedValue[] */];

    await EstatCacheService.saveRankingData(
      "0000010101",
      "A5103",
      "2024100000",
      testData
    );

    const cached = await EstatCacheService.getRankingData(
      "0000010101",
      "A5103",
      "2024100000"
    );

    expect(cached).toEqual(testData);
  });

  it("期限切れデータは取得できない", async () => {
    // テスト実装
  });
});
```

### 統合テスト

```typescript
describe("EstatRankingServer with cache", () => {
  it("初回はAPIから取得し、2回目はキャッシュから取得", async () => {
    // テスト実装
  });
});
```

---

## モニタリング

### キャッシュヒット率の追跡

```typescript
// キャッシュ統計取得API
export async function GET() {
  const db = await createD1Database();

  const stats = await db
    .prepare(`
      SELECT
        COUNT(*) as total_entries,
        SUM(cache_hit_count) as total_hits,
        AVG(cache_hit_count) as avg_hits_per_entry,
        COUNT(CASE WHEN expires_at < datetime('now') THEN 1 END) as expired_entries
      FROM estat_ranking_cache
    `)
    .first();

  return NextResponse.json(stats);
}
```

---

## セキュリティ考慮事項

1. **APIキーの保護**: D1クエリにe-Stat APIキーを含めない
2. **データサイズ制限**: 大きすぎるデータはキャッシュしない（上限設定）
3. **アクセス制御**: キャッシュクリアAPIに認証を追加

---

## まとめ

このキャッシュ実装により：

✅ **パフォーマンス向上**: 2回目以降のアクセスが95-97%高速化
✅ **APIコスト削減**: e-Stat API呼び出しが大幅に減少
✅ **ユーザー体験向上**: ページロード時間の短縮
✅ **スケーラビリティ**: より多くのユーザーに対応可能

段階的に実装することで、リスクを最小限に抑えながら効果を最大化できます。
