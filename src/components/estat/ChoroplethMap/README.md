# EstatChoroplethMap コンポーネント

e-stat APIから直接データを取得してコロプレス地図を表示するReactコンポーネントです。

## 特徴

- **直接API連携**: e-stat APIから直接データを取得
- **柔軟なパラメータ**: `GetStatsDataParams` を使用して詳細な絞り込みが可能
- **自動データ変換**: APIレスポンスを自動的に地図表示用に変換
- **エラーハンドリング**: ローディング、エラー、空データの状態を適切に表示
- **カスタマイズ可能**: カラースキーム、サイズ、スタイルを自由に設定

## 基本的な使用方法

```tsx
import { EstatChoroplethMap } from '@/components/estat/ChoroplethMap';

function MyComponent() {
  return (
    <EstatChoroplethMap
      params={{
        statsDataId: '0003410379',  // 統計表ID（必須）
        cdCat01: 'A1101',           // カテゴリコード（総人口）
        cdTime: '2020000000',       // 年度コード（2020年）
        limit: 100000,              // 取得件数制限
      }}
    />
  );
}
```

## Props

### `params` (必須)

e-stat APIのパラメータを指定します。`GetStatsDataParams` 型に基づきます。

```tsx
interface EstatChoroplethMapProps {
  params: Omit<GetStatsDataParams, 'appId'>;
  // ...
}
```

主要なパラメータ:

- `statsDataId` (必須): 統計表ID
- `cdCat01` - `cdCat15`: カテゴリコード（カンマ区切りで複数指定可能）
- `cdTime`: 時間軸コード（年度など）
- `cdArea`: 地域コード
- `limit`: データ取得件数（デフォルト: 100000）

### `options` (オプション)

地図の可視化オプション:

```tsx
{
  colorScheme: string;           // D3カラースキーム名
  divergingMidpoint: 'zero' | 'mean' | 'median' | number;
}
```

利用可能なカラースキーム:
- Sequential: `interpolateBlues`, `interpolateGreens`, `interpolateOranges`, `interpolateReds`
- Diverging: `interpolateRdBu`, `interpolateRdYlBu`, `interpolateRdYlGn`, `interpolateSpectral`

### その他のProps

```tsx
{
  width?: number;                // 幅（デフォルト: 800）
  height?: number;               // 高さ（デフォルト: 600）
  className?: string;            // CSSクラス
  onDataLoaded?: (values: FormattedValue[]) => void;  // データ取得成功時
  onError?: (error: Error) => void;                   // エラー発生時
}
```

## 使用例

### 1. 基本的な表示

```tsx
<EstatChoroplethMap
  params={{
    statsDataId: '0003410379',
    cdCat01: 'A1101',
    cdTime: '2020000000',
  }}
/>
```

### 2. カラースキームのカスタマイズ

```tsx
<EstatChoroplethMap
  params={{
    statsDataId: '0003410379',
    cdCat01: 'A1101',
    cdTime: '2020000000',
  }}
  options={{
    colorScheme: 'interpolateGreens',
    divergingMidpoint: 'mean',
  }}
/>
```

### 3. サイズとスタイルの指定

```tsx
<EstatChoroplethMap
  params={{
    statsDataId: '0003410379',
    cdCat01: 'A1101',
    cdTime: '2020000000',
  }}
  width={1000}
  height={800}
  className="rounded-lg shadow-lg"
/>
```

### 4. データ取得完了時の処理

```tsx
<EstatChoroplethMap
  params={{
    statsDataId: '0003410379',
    cdCat01: 'A1101',
    cdTime: '2020000000',
  }}
  onDataLoaded={(values) => {
    console.log('データ件数:', values.length);
    // 統計計算や他の処理
  }}
  onError={(error) => {
    console.error('エラー:', error.message);
    // エラー通知の表示など
  }}
/>
```

### 5. 動的な年度切り替え

```tsx
function YearSelector() {
  const [year, setYear] = useState('2020000000');

  return (
    <div>
      <select value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="2020000000">2020年</option>
        <option value="2015000000">2015年</option>
        <option value="2010000000">2010年</option>
      </select>

      <EstatChoroplethMap
        params={{
          statsDataId: '0003410379',
          cdCat01: 'A1101',
          cdTime: year,
        }}
      />
    </div>
  );
}
```

### 6. カテゴリの切り替え

```tsx
function CategorySelector() {
  const [category, setCategory] = useState('A1101');

  const categories = [
    { code: 'A1101', name: '総人口' },
    { code: 'A1301', name: '年少人口' },
    { code: 'A1302', name: '生産年齢人口' },
  ];

  return (
    <div>
      {categories.map((cat) => (
        <button
          key={cat.code}
          onClick={() => setCategory(cat.code)}
        >
          {cat.name}
        </button>
      ))}

      <EstatChoroplethMap
        params={{
          statsDataId: '0003410379',
          cdCat01: category,
          cdTime: '2020000000',
        }}
      />
    </div>
  );
}
```

## 状態

コンポーネントは以下の3つの状態を持ちます：

1. **ローディング**: データ取得中
   - スピナーアイコンとメッセージを表示

2. **エラー**: データ取得失敗
   - エラーアイコンとエラーメッセージを表示
   - 統計表ID、カテゴリ、年度の情報を表示

3. **成功**: データ表示
   - コロプレス地図を表示

## データフロー

```
EstatChoroplethMap (params)
  ↓
EstatStatsDataService.getAndFormatStatsData()
  ↓
e-stat API
  ↓
FormattedValue[]
  ↓
ChoroplethMap (data)
  ↓
D3.js 可視化
```

## 参考情報

- [e-stat API仕様](https://www.e-stat.go.jp/api/)
- [D3.js カラースケール](https://github.com/d3/d3-scale-chromatic)
- `EstatStatsDataService`: データ取得・変換サービス
- `GetStatsDataParams`: パラメータ型定義
- `FormattedValue`: 変換後データ型

## 注意事項

1. **APIキー**: `appId` は自動的に環境変数から取得されます
2. **データ制限**: `limit` パラメータでデータ件数を制限できます（デフォルト: 100000）
3. **都道府県データ**: 全国データ（areaCode: 00000）は自動的に除外されます
4. **エラーハンドリング**: APIエラーは自動的にキャッチされ、エラー画面が表示されます

## トラブルシューティング

### データが表示されない

1. 統計表IDが正しいか確認
2. カテゴリコード、年度コードが存在するか確認
3. コンソールログを確認してAPIエラーを確認

### 地図が空白

- 都道府県データ（areaCode）が含まれているか確認
- numericValue が null でないデータが存在するか確認

### カラーが正しく表示されない

- colorScheme の名前が正しいか確認（D3.js のカラースケール名）
- データの値の範囲を確認
