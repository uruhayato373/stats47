# Area（地域管理）ドメイン実装ガイド

## 概要

Area（地域管理）ドメインは、日本の行政区画（都道府県・市区町村）の階層構造を管理する支援ドメインです。Mock 環境ではローカル JSON ファイル、開発・本番環境では Cloudflare R2 ストレージからデータを取得します。

## データソース切り替えの仕組み

### 環境変数による切り替え

```typescript
const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
```

- **Mock 環境**: `NEXT_PUBLIC_USE_MOCK_DATA=true`
- **開発環境**: `NEXT_PUBLIC_USE_MOCK_DATA=false`（R2 ストレージ使用）
- **本番環境**: `NEXT_PUBLIC_USE_MOCK_DATA=false`（R2 ストレージ使用）

### データソース

| 環境 | データソース  | 場所                     | 用途         |
| ---- | ------------- | ------------------------ | ------------ |
| Mock | ローカル JSON | `data/mock/area/*.json`  | 開発・テスト |
| 開発 | R2 ストレージ | `stats47-area-data-dev`  | 開発環境     |
| 本番 | R2 ストレージ | `stats47-area-data-prod` | 本番環境     |

## Mock/開発/本番環境の違い

### Mock 環境

- **データソース**: `data/mock/area/prefectures.json`, `data/mock/area/municipalities.json`
- **アクセス方法**: 静的 import
- **更新方法**: ローカルファイル編集
- **用途**: 開発・テスト・オフライン開発

### 開発・本番環境

- **データソース**: Cloudflare R2 ストレージ
- **アクセス方法**: HTTP fetch
- **更新方法**: CI/CD 自動アップロード
- **用途**: 本格的な開発・本番運用

## R2 ストレージの設定方法

### 1. R2 バケット作成

```bash
# Cloudflare Dashboardでバケット作成
# バケット名: stats47-area-data-dev, stats47-area-data-prod
# パブリックアクセス: 有効
# CORS設定: 適切に設定
```

### 2. wrangler.toml 設定

```toml
[[r2_buckets]]
binding = "AREA_DATA"
bucket_name = "stats47-area-data-prod"
preview_bucket_name = "stats47-area-data-dev"
```

### 3. 環境変数設定

```bash
# .env.local
R2_AREA_DATA_URL=https://pub-xxxxx.r2.dev
NEXT_PUBLIC_USE_MOCK_DATA=false

# .env.development
R2_AREA_DATA_URL=https://pub-dev-xxxxx.r2.dev
NEXT_PUBLIC_USE_MOCK_DATA=false

# .env.production
R2_AREA_DATA_URL=https://pub-prod-xxxxx.r2.dev
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## キャッシュ戦略の説明

### メモリキャッシュ

- **実装場所**: `AreaRepository`
- **キャッシュ期間**: アプリケーションライフサイクル中
- **用途**: 同一セッション内での高速アクセス

### SWR キャッシュ

- **実装場所**: React Hooks
- **キャッシュ期間**: 1 時間（`dedupingInterval: 3600000`）
- **用途**: コンポーネント間でのデータ共有

### キャッシュ階層

```
1. メモリキャッシュ（最速）
2. SWRキャッシュ（高速）
3. R2ストレージ（標準）
4. Mock JSON（開発時）
```

## 使用例とベストプラクティス

### 基本的な使用方法

```typescript
import { usePrefectures, useMunicipalities } from "@/features/area";

// 都道府県一覧を取得
function PrefectureList() {
  const { data: prefectures, error, isLoading } = usePrefectures();

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラーが発生しました</div>;

  return (
    <ul>
      {prefectures?.map((pref) => (
        <li key={pref.prefCode}>{pref.prefName}</li>
      ))}
    </ul>
  );
}

// 特定の都道府県の市区町村を取得
function MunicipalityList({ prefCode }: { prefCode: string }) {
  const { data: municipalities } = useMunicipalities(prefCode);

  return (
    <ul>
      {municipalities?.map((muni) => (
        <li key={muni.code}>{muni.name}</li>
      ))}
    </ul>
  );
}
```

### 階層構造の活用

```typescript
import { useAreaHierarchy } from "@/features/area";

function AreaHierarchy({ areaCode }: { areaCode: string }) {
  const { data: hierarchy } = useAreaHierarchy(areaCode);

  return (
    <div>
      <h3>{hierarchy?.areaName}</h3>
      {hierarchy?.children && (
        <ul>
          {hierarchy.children.map((child) => (
            <li key={child}>{child}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 検索機能の使用

```typescript
import { PrefectureService } from "@/features/area";

// 都道府県名で検索
const searchPrefectures = async (query: string) => {
  const results = await PrefectureService.search({ query });
  return results;
};

// 地域ブロック別取得
const getKantoPrefectures = async () => {
  const results = await PrefectureService.getPrefecturesByRegion("kanto");
  return results;
};
```

## ベストプラクティス

### 1. エラーハンドリング

```typescript
const { data, error, isLoading } = usePrefectures();

if (error) {
  console.error("都道府県データの取得に失敗:", error);
  // フォールバック処理
}
```

### 2. 型安全性の確保

```typescript
import type { Prefecture, Municipality } from "@/features/area/types";

function processPrefecture(pref: Prefecture) {
  // TypeScriptの型チェックが効く
  return pref.prefName;
}
```

### 3. パフォーマンス最適化

```typescript
// 必要な時のみデータを取得
const { data } = useMunicipalities(prefCode, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
});
```

### 4. テストでの使用

```typescript
// テスト環境ではMockデータを使用
process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";

const { data } = usePrefectures();
// Mockデータが返される
```

## トラブルシューティング

### よくある問題

1. **データが取得できない**

   - 環境変数の設定を確認
   - R2 バケットのパブリックアクセス設定を確認
   - CORS 設定を確認

2. **キャッシュが更新されない**

   - SWR の`mutate`を使用してキャッシュを無効化
   - ブラウザのキャッシュをクリア

3. **型エラーが発生する**
   - `@/features/area/types`の型定義を確認
   - インポートパスを確認

### デバッグ方法

```typescript
// デバッグ用のログ出力
console.log("使用環境:", process.env.NEXT_PUBLIC_USE_MOCK_DATA);
console.log("R2 URL:", process.env.R2_AREA_DATA_URL);
```

## 関連ドキュメント

- [Area Domain Design](../../01_技術設計/03_ドメイン設計/02_支援ドメイン/01_Area.md)
- [R2 Storage Guide](../../04_開発ガイド/03_インフラ/データベース/03_R2ストレージガイド.md)
- [DDD Domain Classification](../../01_技術設計/01_システム概要/04_DDDドメイン分類.md)
