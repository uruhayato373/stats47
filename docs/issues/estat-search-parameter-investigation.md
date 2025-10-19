# e-Stat API 分野選択エラーの原因調査と解決策

## 調査結果

### 問題の原因

**結論**: 検索パラメータは正しい。一部の統計分野には実際にデータが存在しない。

### 検証内容

#### 1. パラメータ名の検証

e-Stat API公式テストフォームで確認した結果、パラメータ名は **`statsField`が正しい**ことを確認。

```html
<label class="formtitle">統計分野<span>[statsField]</span></label>
<input type="text" name="statsField">
```

#### 2. 実際のAPIリクエスト検証

各分野コードでデータ件数を確認：

| 分野コード | 分野名 | データ件数 | 状態 |
|----------|--------|-----------|------|
| 01 | 国土・気象 | **0件** | ❌ データなし |
| 02 | 人口・世帯 | 19,416件 | ✅ データあり |
| 03 | 労働・賃金 | 8,486件 | ✅ データあり |
| 04 | 事業所 | ? | 未確認 |
| 05 | 農林水産業 | 13,958件 | ✅ データあり |
| 06 | 鉱工業 | ? | 未確認 |
| 07 | 商業・サービス業 | ? | 未確認 |
| 08 | 企業・家計・経済 | ? | 未確認 |
| 09 | 住宅・土地・建設 | ? | 未確認 |
| 10 | エネルギー・水 | 918件 | ✅ データあり |
| 11 | 運輸・観光 | ? | 未確認 |
| 12 | 情報通信・科学技術 | ? | 未確認 |
| 13 | 教育・文化・スポーツ・生活 | ? | 未確認 |
| 14 | 行財政 | ? | 未確認 |
| 15 | 司法・安全・環境 | ? | 未確認 |
| 16 | 社会保障・衛生 | ? | 未確認 |
| 17 | 国際 | ? | 未確認 |

#### 3. APIリクエスト例

**成功例（Field 02）**:
```bash
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=XXX&statsField=02&limit=1"

# レスポンス
{
  "GET_STATS_LIST": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。"
    },
    "DATALIST_INF": {
      "NUMBER": 19416  # 19,416件のデータ
    }
  }
}
```

**データなし例（Field 01）**:
```bash
curl "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=XXX&statsField=01&limit=1"

# レスポンス
{
  "GET_STATS_LIST": {
    "RESULT": {
      "STATUS": 1,  # エラーステータス
      "ERROR_MSG": "正常に終了しましたが、該当データはありませんでした。"
    },
    "DATALIST_INF": {
      "NUMBER": 0  # 0件
    }
  }
}
```

### 問題点

現在の実装では、`STATUS !== 0` の場合に全て`EstatStatsListError`としてスローしているため、**データが存在しない分野を選択すると必ずエラーが発生する**。

## 解決策

### 推奨アプローチ: 3段階の改善

---

## Phase 1: データなしを正常ケースとして扱う（必須）

### 修正ファイル: `src/lib/estat-api/stats-list/fetcher.ts`

**修正箇所**: 73-89行目

```typescript
// 修正前
} else if (
  errorMsg.includes("該当するデータが存在しません") ||
  errorMsg.includes("該当データはありませんでした") ||
  errorMsg.includes("正常に終了しましたが、該当データはありませんでした")
) {
  throw new EstatStatsListError(EstatErrorType.NO_DATA_FOUND, errorMsg);
}

// 修正後
} else if (
  errorMsg.includes("該当するデータが存在しません") ||
  errorMsg.includes("該当データはありませんでした") ||
  errorMsg.includes("正常に終了しましたが、該当データはありませんでした")
) {
  // データなしは正常なケース - 空のレスポンスを返す
  console.log(`ℹ️ Fetcher: データなし (分野: ${params.statsField || '不明'}, メッセージ: ${errorMsg})`);

  return {
    ...response,
    GET_STATS_LIST: {
      ...response.GET_STATS_LIST,
      RESULT: {
        STATUS: 0, // 正常ステータスに変更
        DATE: response.GET_STATS_LIST.RESULT.DATE,
        ERROR_MSG: "正常終了（データなし）",
      },
      DATALIST_INF: {
        NUMBER: 0,
        RESULT_INF: {
          FROM_NUMBER: 0,
          TO_NUMBER: 0,
        },
        LIST_INF: undefined,
      },
    },
  };
}
```

**効果**:
- エラーが発生しなくなる
- 空の検索結果として扱われる
- すべての呼び出し元で一貫した動作

---

## Phase 2: サイドバーに統計数を表示（推奨）

データが存在しない分野をユーザーに明示します。

### 修正ファイル: `src/components/organisms/estat-api/stats-list/StatsFieldSidebar`

**現在の実装**:
```typescript
// useEstatAPIFieldStatsフックで各分野の統計数を取得
const { fieldStats } = useEstatAPIFieldStats({ showStatsCount: true });
```

**改善案**:

1. **データなし分野を視覚的に区別**
```typescript
<button
  className={cn(
    "w-full text-left px-4 py-2",
    count === 0 && "opacity-50 cursor-not-allowed" // データなし
  )}
  disabled={count === 0}
>
  {fieldName}
  {count === 0 && <span className="text-xs text-gray-400 ml-2">(データなし)</span>}
  {count > 0 && <span className="text-xs text-gray-500 ml-2">({formatCount(count)}件)</span>}
</button>
```

2. **データなし分野をフィルタ**
```typescript
// オプション: データがない分野を非表示
const fieldsWithData = Object.keys(STATS_FIELDS).filter(code => {
  const stats = getFieldStats(code);
  return stats && stats.count > 0;
});
```

---

## Phase 3: UI層でのエラーハンドリング改善（オプション）

### 修正ファイル: `src/components/pages/EstatAPIStatsListPage/EstatAPIStatsListPage.tsx`

**現在の実装**:
```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
    <p>{error}</p>
  </div>
)}
```

**改善案**:
```typescript
{/* エラー表示 */}
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex">
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          エラーが発生しました
        </h3>
        <div className="mt-2 text-sm text-red-700">
          <p>{error}</p>
        </div>
      </div>
    </div>
  </div>
)}

{/* データなし表示（エラーではない） */}
{!error && searchResult && searchResult.tables.length === 0 && !isLoading && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-blue-800">
          該当する統計データが見つかりませんでした
        </h3>
        <div className="mt-2 text-sm text-blue-700">
          <p>
            選択した分野「{selectedField && STATS_FIELDS[selectedField]?.name}」には、
            現在公開されている統計データがありません。
          </p>
          <p className="mt-1">
            別の分野を選択するか、検索条件を変更してください。
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{/* 検索結果表示 */}
{searchResult && searchResult.tables.length > 0 && (
  <StatsListResults
    tables={searchResult.tables}
    totalCount={searchResult.totalCount}
    isLoading={isLoading}
    onTableSelect={handleTableSelect}
    onSort={handleSort}
    onFilter={handleFilter}
    sortBy="surveyDate"
    sortOrder="desc"
  />
)}
```

---

## 実装の優先順位

### 最小限の対応（Phase 1のみ）
- **所要時間**: 5-10分
- **効果**: エラーが発生しなくなる
- **対象ファイル**: `fetcher.ts`のみ

### 推奨対応（Phase 1 + 2）
- **所要時間**: 20-30分
- **効果**: エラー防止 + ユーザーに分野の統計数を表示
- **対象ファイル**: `fetcher.ts` + サイドバーコンポーネント

### 完全対応（Phase 1 + 2 + 3）
- **所要時間**: 30-45分
- **効果**: 最高のUX（エラー/データなしを明確に区別）
- **対象ファイル**: `fetcher.ts` + サイドバー + ページコンポーネント

---

## データ件数の完全調査（オプション）

すべての分野のデータ件数を調査するスクリプト:

```bash
#!/bin/bash

APP_ID="59eb12e8a25751dfc27f2e48fcdfa8600b86655e"
BASE_URL="https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList"

echo "| 分野コード | 分野名 | データ件数 |"
echo "|----------|--------|-----------|"

for field in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17; do
  count=$(curl -s "${BASE_URL}?appId=${APP_ID}&statsField=${field}&limit=1" | \
    grep -o '"NUMBER":[0-9]*' | cut -d':' -f2)

  case $field in
    01) name="国土・気象" ;;
    02) name="人口・世帯" ;;
    03) name="労働・賃金" ;;
    04) name="事業所" ;;
    05) name="農林水産業" ;;
    06) name="鉱工業" ;;
    07) name="商業・サービス業" ;;
    08) name="企業・家計・経済" ;;
    09) name="住宅・土地・建設" ;;
    10) name="エネルギー・水" ;;
    11) name="運輸・観光" ;;
    12) name="情報通信・科学技術" ;;
    13) name="教育・文化・スポーツ・生活" ;;
    14) name="行財政" ;;
    15) name="司法・安全・環境" ;;
    16) name="社会保障・衛生" ;;
    17) name="国際" ;;
  esac

  echo "| ${field} | ${name} | ${count:-0}件 |"
  sleep 0.5  # API制限対策
done
```

---

## テスト項目

### Phase 1のテスト
- [ ] データが存在する分野（02, 03, 05など）を選択 → 統計表が表示される
- [ ] データが存在しない分野（01など）を選択 → エラーなし、空結果が表示される
- [ ] コンソールに`ℹ️ Fetcher: データなし`ログが表示される
- [ ] エラーログが表示されない

### Phase 2のテスト
- [ ] サイドバーに各分野の統計数が表示される
- [ ] データなし分野が無効化またはグレー表示される
- [ ] データあり分野のみクリック可能

### Phase 3のテスト
- [ ] データなし時に青い情報メッセージが表示される
- [ ] エラーと「データなし」が明確に区別される
- [ ] 分野名が正しく表示される

---

## まとめ

### 根本原因
検索パラメータは正しい。**一部の統計分野には実際にデータが存在しない**（例：Field 01「国土・気象」は0件）。

### 解決方法
1. **Phase 1（必須）**: データなしをエラーではなく正常ケースとして扱う
2. **Phase 2（推奨）**: サイドバーに統計数を表示して、データなし分野を明示
3. **Phase 3（オプション）**: UIでエラーとデータなしを明確に区別

### 次のステップ
1. Phase 1の実装（5-10分）
2. 動作確認
3. 必要に応じてPhase 2, 3の実装

---

## 参考

- e-Stat API仕様: https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0
- テストフォーム: https://www.e-stat.go.jp/api/sample/testform2/getStatsList.html
- 関連Issue: `docs/issues/estat-no-data-found-error.md`
- 関連Issue: `docs/issues/estat-field-selection-no-data-error.md`
