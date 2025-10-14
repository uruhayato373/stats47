# EstatRanking データ取得戦略の考察

作成日: 2025-10-05

## 概要

現在、`EstatRanking`コンポーネントは毎回 e-stat API から直接データを取得しています。この文書では、データベースを活用した場合のメリット・デメリットを分析し、最適な実装方針を提案します。

## 現状の分析

### 現在の実装

```tsx
// EstatRanking → EstatChoroplethMap → EstatStatsDataService
// 毎回APIリクエスト
const response = await EstatStatsDataService.getAndFormatStatsData(
  statsDataId,
  {
    categoryFilter: params.cdCat01,
    yearFilter: selectedYear,
    limit: 100000,
  }
);
```

### データの特性

1. **データの更新頻度**: e-stat の統計データは年次または月次更新

   - 国勢調査: 5 年に 1 回
   - 人口推計: 月次
   - 社会・人口統計体系: 年次

2. **データ量**:

   - 1 リクエストあたり: 数 KB ～数 MB
   - 全カテゴリ × 全年度: 非常に大量

3. **アクセスパターン**:
   - ユーザーは同じデータを繰り返し閲覧する可能性が高い
   - 複数ユーザーが同じデータを参照する

## アプローチ比較

### 1. 現状のアプローチ（API 直接取得）

#### メリット

- ✅ **実装がシンプル**: データベース設計・管理不要
- ✅ **常に最新データ**: e-stat の更新が即座に反映
- ✅ **ストレージコスト不要**: データ保存領域が不要
- ✅ **データ整合性**: 単一データソースのため矛盾がない

#### デメリット

- ❌ **レスポンス時間**: 毎回 API リクエストで 2-5 秒かかる
- ❌ **API 制限**: e-stat API には呼び出し制限がある（詳細不明だが存在）
- ❌ **可用性**: e-stat API のダウンタイムの影響を受ける
- ❌ **ネットワーク依存**: インターネット接続が必須
- ❌ **コスト**: API 呼び出し回数に応じたコスト（無料枠の消費）

### 2. データベース活用アプローチ

#### メリット

- ✅ **高速レスポンス**: DB 読み取りは 10-100ms 程度
- ✅ **API 制限回避**: API へのアクセス頻度を大幅削減
- ✅ **可用性向上**: API ダウン時もサービス継続可能
- ✅ **オフライン対応**: ネットワーク不要（キャッシュ済みデータ）
- ✅ **カスタマイズ**: データ加工・集計が容易
- ✅ **分析機能**: 時系列分析、地域比較が高速化

#### デメリット

- ❌ **実装複雑度**: DB 設計、同期処理、キャッシュ管理が必要
- ❌ **ストレージコスト**: Cloudflare D1 の容量を消費
- ❌ **データ鮮度**: 更新タイミングによっては古いデータ
- ❌ **同期処理**: 定期的なデータ更新が必要
- ❌ **データ整合性**: 同期失敗時の対処が必要

## 推奨アプローチ: ハイブリッド戦略

### 基本方針

**キャッシュファースト + API フォールバック**

1. **頻繁にアクセスされるデータ**: DB キャッシュ
2. **稀なアクセス**: API 直接取得
3. **定期更新**: バックグラウンドでキャッシュ更新

### 実装戦略

#### フェーズ 1: キャッシュテーブルの追加

```sql
-- 統計データキャッシュテーブル（estat_ranking_values）
CREATE TABLE IF NOT EXISTS estat_ranking_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stats_data_id TEXT NOT NULL,           -- 統計表ID
  area_code TEXT NOT NULL,               -- 地域コード
  value TEXT NOT NULL,                   -- 元の値（文字列）
  numeric_value REAL,                    -- 数値
  display_value TEXT,                    -- 表示用の値
  rank INTEGER,                          -- ランキング順位
  unit TEXT,                             -- 単位
  area_name TEXT,                        -- 地域名
  category_code TEXT,                    -- カテゴリコード（cdCat01）
  category_name TEXT,                    -- カテゴリ名
  time_code TEXT,                        -- 時間コード（年度）
  time_name TEXT,                        -- 時間名
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stats_data_id, category_code, time_code, area_code)
);

CREATE INDEX idx_estat_ranking_lookup ON estat_ranking_values(
  stats_data_id, category_code, time_code
);
CREATE INDEX idx_estat_ranking_area ON estat_ranking_values(area_code);
```

#### フェーズ 2: キャッシュ管理サービス

```typescript
// src/lib/estat/cache/EstatCacheService.ts

export class EstatCacheService {
  /**
   * キャッシュからデータを取得
   * キャッシュがなければAPIから取得してキャッシュ
   */
  static async getCachedData(
    statsDataId: string,
    categoryCode: string,
    timeCode: string
  ): Promise<FormattedValue[]> {
    // 1. キャッシュチェック
    const cached = await this.getFromCache(statsDataId, categoryCode, timeCode);

    if (cached && !this.isExpired(cached)) {
      console.log("[Cache] Hit:", { statsDataId, categoryCode, timeCode });
      return cached.data;
    }

    // 2. APIから取得
    console.log("[Cache] Miss, fetching from API...");
    const apiData = await EstatStatsDataService.getAndFormatStatsData(
      statsDataId,
      { categoryFilter: categoryCode, yearFilter: timeCode }
    );

    // 3. キャッシュに保存
    await this.saveToCache(statsDataId, categoryCode, timeCode, apiData.values);

    return apiData.values;
  }

  /**
   * キャッシュの有効期限チェック
   */
  private static isExpired(cache: CacheEntry): boolean {
    if (!cache.expires_at) return false;
    return new Date(cache.expires_at) < new Date();
  }

  /**
   * キャッシュへの保存
   * TTL（Time To Live）を設定
   */
  private static async saveToCache(
    statsDataId: string,
    categoryCode: string,
    timeCode: string,
    values: FormattedValue[]
  ): Promise<void> {
    const ttl = this.calculateTTL(statsDataId);
    const expiresAt = new Date(Date.now() + ttl);

    // バッチインサート
    const statements = values.map((v) => ({
      sql: `
        INSERT OR REPLACE INTO estat_data_cache
        (stats_data_id, category_code, time_code, area_code, area_name, value, unit, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        statsDataId,
        categoryCode,
        timeCode,
        v.areaCode,
        v.areaName,
        v.numericValue,
        v.unit,
        expiresAt.toISOString(),
      ],
    }));

    await db.batch(statements);
  }

  /**
   * TTL（有効期限）の計算
   * 統計の種類によって異なる期限を設定
   */
  private static calculateTTL(statsDataId: string): number {
    // 国勢調査（5年に1回）: 1年間キャッシュ
    if (statsDataId === "0000010101") {
      return 365 * 24 * 60 * 60 * 1000; // 1年
    }

    // 人口推計（月次更新）: 1ヶ月間キャッシュ
    if (statsDataId === "0003448738") {
      return 30 * 24 * 60 * 60 * 1000; // 1ヶ月
    }

    // デフォルト: 1週間
    return 7 * 24 * 60 * 60 * 1000;
  }

  /**
   * 期限切れキャッシュの削除
   */
  static async cleanExpiredCache(): Promise<void> {
    await db.exec(`
      DELETE FROM estat_data_cache
      WHERE expires_at < datetime('now')
    `);
  }
}
```

#### フェーズ 3: EstatRanking の修正

```typescript
// src/components/dashboard/Ranking/EstatRanking.tsx

// Before: 直接API呼び出し
const response = await EstatStatsDataService.getAndFormatStatsData(...);

// After: キャッシュファースト
const values = await EstatCacheService.getCachedData(
  params.statsDataId,
  params.cdCat01,
  selectedYear
);
```

### キャッシュ更新戦略

#### 1. オンデマンド更新

- ユーザーがアクセス時に期限切れなら自動更新
- 初回アクセス時のみ遅い（API 取得）、以降は高速

#### 2. バックグラウンド更新（将来的）

```typescript
// Cloudflare Workers Cron Triggers
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    // 人気の高いデータを事前更新
    await updatePopularDatasets();
  },
};
```

#### 3. 手動更新 UI（管理画面）

- 管理者が任意のタイミングでキャッシュをクリア・更新

## ストレージコスト試算

### Cloudflare D1 の制限

- **Free Plan**: 5GB ストレージ、25 億行読み取り/月
- **Paid Plan**: 使用量課金

### データ量試算

```
1統計 × 1カテゴリ × 1年度 × 47都道府県 = 47レコード
1レコード ≈ 200バイト（推定）

47レコード × 200バイト = 9,400バイト ≈ 9KB

想定ケース:
- 10統計 × 10カテゴリ × 10年度 = 1,000セット
- 1,000 × 9KB = 9MB

結論: ストレージコストは無視できるレベル
```

## パフォーマンス比較

| 指標         | API 直接 | DB キャッシュ   | 改善率         |
| ------------ | -------- | --------------- | -------------- |
| 初回アクセス | 2-5 秒   | 2-5 秒          | -              |
| 2 回目以降   | 2-5 秒   | 10-100ms        | **95-98%短縮** |
| API 呼び出し | 毎回     | 初回+期限切れ時 | **90-95%削減** |
| 可用性       | API 依存 | DB 依存         | 向上           |

## 実装優先度

### Phase 1（現在）: API 直接取得

- ✅ シンプル、動作確認済み
- 現状維持で問題なし

### Phase 2（推奨）: 基本的なキャッシュ

- キャッシュテーブル追加
- EstatCacheService 実装
- 期限管理（TTL）
- **効果**: レスポンス時間 95%改善

### Phase 3（将来）: 高度なキャッシュ

- アクセス頻度分析
- プリフェッチ（事前取得）
- バックグラウンド更新
- **効果**: ユーザー体験のさらなる向上

## 推奨事項

### 短期（1-2 週間）

1. ✅ **現状維持**: Phase 1 を継続
2. キャッシュテーブル設計の確定
3. EstatCacheService のプロトタイプ実装

### 中期（1-2 ヶ月）

1. Phase 2 実装
2. 人気データのキャッシュ効果測定
3. TTL 調整

### 長期（3-6 ヶ月）

1. アクセス分析に基づく最適化
2. バックグラウンド更新の実装
3. キャッシュヒット率の監視

## まとめ

### 結論

**データベースキャッシュの導入は推奨**

- **メリット**: レスポンス時間 95%改善、API 制限回避、可用性向上
- **デメリット**: 実装複雑度の増加（許容範囲）
- **コスト**: ストレージはほぼ無視できる

### 次のステップ

1. キャッシュテーブルのスキーマ設計を確定
2. EstatCacheService の実装
3. 段階的なロールアウト（一部のページから開始）
4. 効果測定とフィードバック

---

## 参考資料

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [e-Stat API 仕様](https://www.e-stat.go.jp/api/)
- 現在のデータベーススキーマ: `database/schemas/main.sql`
