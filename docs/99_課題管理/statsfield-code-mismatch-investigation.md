# 統計表検索で分野コード検索が機能しない問題の調査報告

**作成日**: 2025-11-01
**ステータス**: 解決策特定済み
**優先度**: 高

## 問題の概要

`src/app/admin/dev-tools/estat-api/stats-list/StatsListPageClient.tsx`で分野コードを指定して検索しても、「検索結果が見つかりませんでした」と表示される問題が発生している。

## 調査内容

### 1. 実装状況の確認

#### 1.1 検索フローの確認

検索フローは以下の通りに実装されている：

```
StatsListPageClient.tsx (handleSimpleSearch)
  ↓
useStatsListSearch.ts (search)
  ↓
swr-fetcher.ts (statsListFetcherWithErrorHandling)
  ↓
fetcher.ts (searchByField)
  ↓
http-client.ts (executeHttpRequest)
  ↓
e-Stat API
```

#### 1.2 パラメータ構築の確認

**StatsListSearch.tsx:54-61**
```typescript
const options: StatsListSearchOptions = {
  ...(searchWord && { searchWord }),
  ...(statsCode && { statsCode }),
  ...(statsField && statsField !== "" && { statsField }),
  ...(collectArea && collectArea !== "" && { collectArea }),
  ...(surveyYears && { surveyYears }),
  limit,
};
```
✅ 空文字列のフィルタリングは正しく実装されている

**swr-fetcher.ts:60-68**
```typescript
} else if (options.statsField) {
  // 分野別検索
  response = await EstatStatsListFetcher.searchByField(options.statsField, {
    limit: options.limit || 100,
    ...(options.collectArea && { collectArea: options.collectArea }),
    ...(options.surveyYears && { surveyYears: options.surveyYears }),
  });
```
✅ 分岐ロジックは正しく実装されている

**fetcher.ts:281-299**
```typescript
static async searchByField(
  fieldCode: string,
  options: StatsListSearchOptions = {}
): Promise<EstatStatsListResponse> {
  const params: Omit<GetStatsListParams, "appId"> = {
    statsField: fieldCode,
    limit: options.limit || 100,
    startPosition: options.startPosition || 1,
    ...(options.collectArea && { collectArea: options.collectArea }),
    ...(options.surveyYears && { surveyYears: options.surveyYears }),
    ...(options.openYears && { openYears: options.openYears }),
  };
  return this.fetchStatsList(params);
}
```
✅ パラメータ構築は正しく実装されている

### 2. e-Stat API仕様の確認

#### 2.1 公式ドキュメントの確認

- `statsField`パラメータは**単独で使用可能**
- 2桁の数値コードで統計大分類を検索
- 4桁の数値コードで統計小分類を検索
- 他のパラメータとの組み合わせは必須ではない

#### 2.2 実際のAPIテスト結果

```bash
# テスト1: statsField=10（運輸・観光）
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=XXX&statsField=10&limit=10"
# 結果: 918件の統計表が返される ✅

# テスト2: 全パラメータ付き
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=XXX&lang=J&dataFormat=json&statsField=10&limit=5"
# 結果: 918件の統計表が返される ✅
```

**結論**: e-Stat API自体は正常に動作している

### 3. 根本原因の特定

#### 3.1 統計分野コード定義の比較

**e-Stat API公式の統計分野コード** (https://www.e-stat.go.jp/api/api-info/statsfield)

| コード | 分野名 |
|--------|--------|
| 01 | 国土・気象 |
| 02 | 人口・世帯 |
| 03 | 労働・賃金 |
| **04** | **農林水産業** |
| 05 | 鉱工業 |
| 06 | 商業・サービス業 |
| 07 | 企業・家計・経済 |
| 08 | 住宅・土地・建設 |
| 09 | エネルギー・水 |
| 10 | 運輸・観光 |
| 11 | 情報通信・科学技術 |
| 12 | 教育・文化・スポーツ・生活 |
| 13 | 行財政 |
| 14 | 司法・安全・環境 |
| 15 | 社会保障・衛生 |
| 16 | 国際 |
| 99 | その他 |

**アプリケーションの定義** (src/features/estat-api/core/constants/search-options.ts)

```typescript
export const STATS_FIELD_OPTIONS: SelectOption[] = [
  { value: "", label: "選択してください" },
  { value: "01", label: "国土・気象" },
  { value: "02", label: "人口・世帯" },
  { value: "03", label: "労働・賃金" },
  { value: "04", label: "事業所" },        // ❌ 間違い！正しくは「農林水産業」
  { value: "05", label: "農林水産業" },     // ❌ 1つずれている
  { value: "06", label: "鉱工業" },        // ❌ 1つずれている
  { value: "07", label: "商業・サービス業" }, // ❌ 1つずれている
  { value: "08", label: "企業・家計・経済" }, // ❌ 1つずれている
  { value: "09", label: "住宅・土地・建設" }, // ❌ 1つずれている
  { value: "10", label: "エネルギー・水" },   // ❌ 1つずれている（正しくは「運輸・観光」）
  { value: "11", label: "運輸・観光" },      // ❌ 1つずれている
  { value: "12", label: "情報通信・科学技術" }, // ❌ 1つずれている
  { value: "13", label: "教育・文化・スポーツ・生活" }, // ❌ 1つずれている
  { value: "14", label: "行財政" },         // ❌ 1つずれている
  { value: "15", label: "司法・安全・環境" },  // ❌ 1つずれている
  { value: "16", label: "社会保障・衛生" },   // ❌ 1つずれている
  { value: "17", label: "国際" },           // ❌ 1つずれている（正しくは16）
];
```

#### 3.2 問題の詳細

1. **コード04**の定義が間違っている
   - アプリケーション: "事業所"（このコードは存在しない）
   - 正しい値: "農林水産業"

2. **コード05以降**がすべて1つずつずれている
   - 例: ユーザーが「運輸・観光」を選択 → アプリケーションは"11"を送信 → API側では"11"は「情報通信・科学技術」

3. **コード17**は存在しない
   - 正しい最大値は16（国際）
   - 17の代わりに99（その他）が正しい

## 影響範囲

### 影響を受ける機能
- ✅ 統計表検索機能（分野コード検索）
- ✅ 分野別フィルタリング機能
- ✅ 分野コードを使用するすべての機能

### 影響を受けるファイル
```
src/features/estat-api/core/constants/search-options.ts (修正必要)
```

### 影響を受けないファイル
- ✅ フォームUI実装
- ✅ API通信ロジック
- ✅ データフォーマッター

## 解決策

### 修正1: 統計分野コードの定義を修正

**ファイル**: `src/features/estat-api/core/constants/search-options.ts`

**修正前**:
```typescript
export const STATS_FIELD_OPTIONS: SelectOption[] = [
  { value: "", label: "選択してください" },
  { value: "01", label: "国土・気象" },
  { value: "02", label: "人口・世帯" },
  { value: "03", label: "労働・賃金" },
  { value: "04", label: "事業所" },
  { value: "05", label: "農林水産業" },
  // ... 以下省略
  { value: "17", label: "国際" },
];
```

**修正後**:
```typescript
export const STATS_FIELD_OPTIONS: SelectOption[] = [
  { value: "", label: "選択してください" },
  { value: "01", label: "国土・気象" },
  { value: "02", label: "人口・世帯" },
  { value: "03", label: "労働・賃金" },
  { value: "04", label: "農林水産業" },       // ✅ 修正
  { value: "05", label: "鉱工業" },           // ✅ 修正
  { value: "06", label: "商業・サービス業" },   // ✅ 修正
  { value: "07", label: "企業・家計・経済" },   // ✅ 修正
  { value: "08", label: "住宅・土地・建設" },   // ✅ 修正
  { value: "09", label: "エネルギー・水" },     // ✅ 修正
  { value: "10", label: "運輸・観光" },        // ✅ 修正
  { value: "11", label: "情報通信・科学技術" }, // ✅ 修正
  { value: "12", label: "教育・文化・スポーツ・生活" }, // ✅ 修正
  { value: "13", label: "行財政" },           // ✅ 修正
  { value: "14", label: "司法・安全・環境" },   // ✅ 修正
  { value: "15", label: "社会保障・衛生" },     // ✅ 修正
  { value: "16", label: "国際" },             // ✅ 修正
];
```

### 修正2: テストの追加（推奨）

**ファイル**: `src/features/estat-api/core/constants/__tests__/search-options.test.ts`（新規作成）

```typescript
import { STATS_FIELD_OPTIONS } from '../search-options';

describe('STATS_FIELD_OPTIONS', () => {
  it('should match e-Stat API statsField codes', () => {
    // e-Stat API公式の分野コード定義
    const officialCodes = {
      '01': '国土・気象',
      '02': '人口・世帯',
      '03': '労働・賃金',
      '04': '農林水産業',
      '05': '鉱工業',
      '06': '商業・サービス業',
      '07': '企業・家計・経済',
      '08': '住宅・土地・建設',
      '09': 'エネルギー・水',
      '10': '運輸・観光',
      '11': '情報通信・科学技術',
      '12': '教育・文化・スポーツ・生活',
      '13': '行財政',
      '14': '司法・安全・環境',
      '15': '社会保障・衛生',
      '16': '国際',
    };

    STATS_FIELD_OPTIONS.filter(opt => opt.value !== '').forEach(option => {
      expect(officialCodes[option.value]).toBe(option.label);
    });
  });

  it('should not include code 17', () => {
    const hasCode17 = STATS_FIELD_OPTIONS.some(opt => opt.value === '17');
    expect(hasCode17).toBe(false);
  });

  it('should not include code 04 with label "事業所"', () => {
    const wrongOption = STATS_FIELD_OPTIONS.find(
      opt => opt.value === '04' && opt.label === '事業所'
    );
    expect(wrongOption).toBeUndefined();
  });
});
```

## 検証方法

### 1. 修正後の動作確認

```bash
# 1. 開発サーバー起動
npm run dev

# 2. ブラウザで以下のURLにアクセス
# http://localhost:3000/admin/dev-tools/estat-api/stats-list

# 3. 各分野コードで検索を実行し、結果が返されることを確認
# - 「農林水産業」を選択 → コード04で検索
# - 「運輸・観光」を選択 → コード10で検索
# - 「国際」を選択 → コード16で検索
```

### 2. APIリクエストのログ確認

ブラウザの開発者ツールのコンソールで以下のログを確認：

```
🔵 Component: 検索オプション { statsField: "10", limit: 100 }
🔵 Hook: 検索開始 { statsField: "10", limit: 100 }
🔵 SWR Fetcher: 分野別検索実行 10
🔵 Fetcher: searchByField パラメータ { fieldCode: "10", ... }
🌐 HTTP Client: リクエストURL: https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=XXX&lang=J&dataFormat=json&statsField=10&limit=100
✅ Formatter: formatStatsListData 完了 - XXX件
```

### 3. 期待される結果

| 選択した分野 | 送信されるコード | API側の解釈 | 結果 |
|-------------|----------------|------------|------|
| 国土・気象 | 01 | 国土・気象 | ✅ 正常 |
| 人口・世帯 | 02 | 人口・世帯 | ✅ 正常 |
| 労働・賃金 | 03 | 労働・賃金 | ✅ 正常 |
| 農林水産業 | 04 | 農林水産業 | ✅ 正常 |
| 運輸・観光 | 10 | 運輸・観光 | ✅ 正常 |
| 国際 | 16 | 国際 | ✅ 正常 |

## タイムライン

- **2025-11-01**: 問題報告受領
- **2025-11-01**: 調査実施、根本原因特定
- **2025-11-01**: 解決策策定
- **未定**: 修正実施
- **未定**: テスト実施
- **未定**: リリース

## 参考リンク

- [e-Stat API 統計分野コード一覧](https://www.e-stat.go.jp/api/api-info/statsfield)
- [e-Stat API マニュアル - getStatsList](https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0#api_2_1)

## 関連ファイル

- `src/features/estat-api/core/constants/search-options.ts:9-28` - 修正対象
- `src/features/estat-api/stats-list/components/StatsListSearch/StatsListSearch.tsx:131-145` - 使用箇所
- `src/app/admin/dev-tools/estat-api/stats-list/StatsListPageClient.tsx` - 問題発生場所
